import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LessonProgress, type Song } from './db'
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

/** Backup completo: progresso, treino e a biblioteca de músicas (arquivos, sincronia e volumes). */
export async function exportProgress() {
  const [lessons, days, drills, songs] = await Promise.all([db.lessons.toArray(), db.days.toArray(), db.drills.toArray(), db.songs.toArray()])
  const library: SongBackup[] = await Promise.all(
    songs.map(async (song) => {
      const { file, ...rest } = song
      delete rest.id
      return { ...rest, file: file ? await toBase64(file) : undefined }
    }),
  )
  return JSON.stringify({ app: 'fretlab', version: 3, exportedAt: new Date().toISOString(), lessons, days, drills, songs: library })
}

export async function importProgress(json: string) {
  const data = JSON.parse(json)
  if (data.app !== 'fretlab') throw new Error('Este arquivo não é um backup do FretLab.')
  await db.transaction('rw', db.lessons, db.days, db.drills, async () => {
    await db.lessons.bulkPut(data.lessons)
    await db.days.bulkPut(data.days)
    if (Array.isArray(data.drills)) await db.drills.bulkPut(data.drills)
  })
  // biblioteca: não duplica música que já existe aqui (mesmo nome de arquivo e tamanho)
  if (Array.isArray(data.songs)) {
    const existing = new Set((await db.songs.toArray()).map((s) => `${s.fileName}|${s.file?.size}`))
    for (const raw of data.songs as SongBackup[]) {
      const file = raw.file ? fromBase64(raw.file) : undefined
      if (existing.has(`${raw.fileName}|${file?.size}`)) continue
      await db.songs.add({ ...raw, file } as Song)
    }
  }
}
