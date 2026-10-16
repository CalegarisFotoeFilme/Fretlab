import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LessonProgress, type Song } from './db'
import { useSettings } from './settings'
import { dayKey, levelFromXp, starsFor, streak, xpFor } from './scoring'

export interface AttemptResult {
  stars: number
  previousStars: number
  xpGained: number
  levelBefore: number
  levelAfter: number
}

export async function recordAttempt(lessonId: string, accuracy: number, seconds: number): Promise<AttemptResult> {
  return db.transaction('rw', db.lessons, db.days, async () => {
    const prev = await db.lessons.get(lessonId)
    const previousStars = prev?.stars ?? 0
    const xpGained = xpFor(accuracy, previousStars)
    const totalBefore = (await db.days.toArray()).reduce((s, d) => s + d.xp, 0)
    const stars = starsFor(accuracy)
    await db.lessons.put({
      lessonId,
      stars: Math.max(stars, previousStars),
      bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
      attempts: (prev?.attempts ?? 0) + 1,
      lastPlayedAt: Date.now(),
    })
    const key = dayKey()
    const day = (await db.days.get(key)) ?? { day: key, xp: 0, minutes: 0 }
    await db.days.put({ ...day, xp: day.xp + xpGained, minutes: day.minutes + seconds / 60 })
    return {
      stars,
      previousStars,
      xpGained,
      levelBefore: levelFromXp(totalBefore).level,
      levelAfter: levelFromXp(totalBefore + xpGained).level,
    }
  })
}

/**
 * Registra uma sessão do aquecimento técnico. Tocou limpo: o alvo sobe 4 BPM (como no Guitar Aerobics,
 * aos poucos). Ainda não: o alvo fica igual. Conta XP e minutos do dia.
 */
export async function recordDrill(id: string, bpm: number, clean: boolean, minutes: number) {
  return db.transaction('rw', db.drills, db.days, async () => {
    const prev = await db.drills.get(id)
    const next = clean ? Math.min(240, bpm + 4) : bpm
    await db.drills.put({ id, bpm: next, best: Math.max(prev?.best ?? 0, clean ? bpm : 0), sessions: (prev?.sessions ?? 0) + 1, lastDay: dayKey() })
    const key = dayKey()
    const day = (await db.days.get(key)) ?? { day: key, xp: 0, minutes: 0 }
    const xp = clean ? 8 : 4
    await db.days.put({ ...day, xp: day.xp + xp, minutes: day.minutes + minutes })
    return { bpm: next, xp }
  })
}

export interface ProgressSummary {
  lessons: Map<string, LessonProgress>
  xp: number
  level: ReturnType<typeof levelFromXp>
  streak: number
  practicedToday: boolean
  todayXp: number
}

export function useProgress(): ProgressSummary | undefined {
  return useLiveQuery(async () => {
    const [lessons, days] = await Promise.all([db.lessons.toArray(), db.days.toArray()])
    const xp = days.reduce((s, d) => s + d.xp, 0)
    const today = days.find((d) => d.day === dayKey())
    return {
      lessons: new Map(lessons.map((l) => [l.lessonId, l])),
      xp,
      level: levelFromXp(xp),
      streak: streak(days.map((d) => d.day)),
      practicedToday: !!today,
      todayXp: today?.xp ?? 0,
    }
  })
}

const toBase64 = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const fromBase64 = (b64: string) => {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes])
}

type SongBackup = Omit<Song, 'id' | 'file'> & { file?: string }

/** Backup dos estudos: lições, dias, treino. */
export async function exportProgress() {
  const [lessons, days, drills, facts] = await Promise.all([db.lessons.toArray(), db.days.toArray(), db.drills.toArray(), db.facts.toArray()])
  return JSON.stringify({ app: 'fretlab', kind: 'progress', version: 3, exportedAt: new Date().toISOString(), lessons, days, drills, facts })
}

/** Backup da biblioteca: músicas com arquivo, sincronia do YouTube e volumes. */
export async function exportLibrary() {
  const [songs, playlists] = await Promise.all([db.songs.toArray(), db.playlists.toArray()])
  // `ref` = id original: os repertórios apontam para ele (no outro aparelho os ids mudam)
  const library: (SongBackup & { ref?: number })[] = await Promise.all(
    songs.map(async (song) => {
      const { file, id, ...rest } = song
      return { ...rest, ref: id, file: file ? await toBase64(file) : undefined }
    }),
  )
  const { librarySort, playerVolume } = useSettings.getState()
  return JSON.stringify({
    app: 'fretlab', kind: 'library', version: 2, exportedAt: new Date().toISOString(),
    songs: library,
    playlists: playlists.map(({ name, songIds, createdAt }) => ({ name, songRefs: songIds, createdAt })),
    settings: { librarySort, playerVolume },
  })
}

/** Importa qualquer backup do FretLab (estudos, biblioteca ou o antigo com os dois). Diz o que entrou. */
export async function importBackup(json: string) {
  const data = JSON.parse(json)
  if (data.app !== 'fretlab') throw new Error('Este arquivo não é um backup do FretLab.')
  const done: string[] = []
  if (Array.isArray(data.lessons)) {
    await db.transaction('rw', [db.lessons, db.days, db.drills, db.facts], async () => {
      await db.lessons.bulkPut(data.lessons)
      if (Array.isArray(data.days)) await db.days.bulkPut(data.days)
      if (Array.isArray(data.drills)) await db.drills.bulkPut(data.drills)
      if (Array.isArray(data.facts)) await db.facts.bulkPut(data.facts)
    })
    done.push('progresso dos estudos')
  }
  // biblioteca: não duplica música que já existe aqui (mesmo nome de arquivo e tamanho)
  if (Array.isArray(data.songs)) {
    const existing = new Map((await db.songs.toArray()).map((s) => [`${s.fileName}|${s.file?.size}|${s.title}`, s.id!]))
    // id original (no aparelho de origem) → id aqui
    const idOf = new Map<number, number>()
    let added = 0
    for (const { ref, ...raw } of data.songs as (SongBackup & { ref?: number })[]) {
      const file = raw.file ? fromBase64(raw.file) : undefined
      const key = `${raw.fileName}|${file?.size}|${raw.title}`
      let id = existing.get(key)
      if (id === undefined) {
        id = (await db.songs.add({ ...raw, file } as Song)) as number
        existing.set(key, id)
        added++
      }
      if (ref !== undefined) idOf.set(ref, id)
    }
    done.push(`${added} ${added === 1 ? 'música nova' : 'músicas novas'} na biblioteca`)
    // repertórios: os de mesmo nome são substituídos pela versão do backup
    if (Array.isArray(data.playlists)) {
      for (const pl of data.playlists as { name: string; songRefs: number[]; createdAt: number }[]) {
        const songIds = pl.songRefs.map((r) => idOf.get(r)).filter((x): x is number => x !== undefined)
        const same = await db.playlists.where('name').equals(pl.name).first()
        if (same) await db.playlists.update(same.id!, { songIds })
        else await db.playlists.add({ name: pl.name, songIds, createdAt: pl.createdAt })
      }
      done.push(`${data.playlists.length} ${data.playlists.length === 1 ? 'repertório' : 'repertórios'}`)
    }
    if (data.settings) {
      const { librarySort, playerVolume } = data.settings
      useSettings.getState().set({
        ...(['added', 'title', 'artist'].includes(librarySort) ? { librarySort } : {}),
        ...(typeof playerVolume === 'number' ? { playerVolume } : {}),
      })
    }
  }
  return done
}
