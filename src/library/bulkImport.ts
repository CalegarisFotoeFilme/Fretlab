import { create } from 'zustand'
import { db } from '../progress/db'
import { updateSong } from '../progress/songs'
import { onSongsterrReport, songsterrEval, songsterrGo } from './desktop'
import { fetchSongsterrSync } from './songsterrSync'

/*
  Importar os favoritos do Songsterr (app para Mac): a janela do Songsterr (com o login do usuário)
  lê a lista de favoritos e, música por música, abre a página e aciona o download do Guitar Pro.
  O download entra na biblioteca pelo caminho normal (AppShell) e aqui a sincronia do YouTube já é
  buscada e salva, para a música ficar pronta.

  Escolha do usuário, ciente do risco: os termos do Songsterr vetam automatizar recursos pagos;
  por isso vai uma música de cada vez, com pausa entre elas.
*/

export interface FavoriteSong {
  id: number
  title: string
  artist: string
}

type Status = 'idle' | 'listing' | 'running' | 'done' | 'stopped' | 'error'

interface BulkState {
  status: Status
  songs: FavoriteSong[]
  index: number
  current: FavoriteSong | null
  imported: number
  skipped: number
  failed: string[]
  message: string | null
}

export const useBulkImport = create<BulkState>(() => ({
  status: 'idle', songs: [], index: 0, current: null, imported: 0, skipped: 0, failed: [], message: null,
}))
const set = (patch: Partial<BulkState>) => useBulkImport.setState(patch)

const PAUSE_MS = 3000
const SONG_TIMEOUT_MS = 75000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------- conversa com a página do Songsterr ----------

/** Envia um objeto de volta ao FretLab (navegação interceptada pelo app). */
const REPORT = `const __report = (o) => { location.href = 'https://fretlab.invalid/r?d=' + encodeURIComponent(JSON.stringify(o)) };`

let waiting: ((data: Record<string, unknown>) => void) | null = null
let unlisten: (() => void) | null = null
async function ensureListener() {
  unlisten ??= await onSongsterrReport((d) => waiting?.(d as Record<string, unknown>))
}
/** Roda um script na página e espera a resposta (ou o tempo acabar). */
async function ask(script: string, timeoutMs: number): Promise<Record<string, unknown> | null> {
  await ensureListener()
  const answer = new Promise<Record<string, unknown> | null>((resolve) => {
    const t = setTimeout(() => {
      waiting = null
      resolve(null)
    }, timeoutMs)
    waiting = (d) => {
      clearTimeout(t)
      waiting = null
      resolve(d)
    }
  })
  await songsterrEval(`(async () => { ${REPORT} try { ${script} } catch (e) { __report({ type: 'error', message: String(e) }) } })()`)
  return answer
}

const FAVORITES_SCRIPT = `
  const r = await fetch('/api/favorites', { credentials: 'include', headers: { accept: 'application/json' } })
  if (!r.ok) return __report({ type: 'error', message: 'Songsterr respondeu ' + r.status + (r.status === 401 ? ' (faça login na janela do Songsterr)' : '') })
  const list = await r.json()
  __report({ type: 'favorites', songs: list.map((s) => ({ id: s.songId ?? s.id, title: s.title ?? '', artist: s.artist ?? s.artistName ?? '' })) })
`

/** Espera a página da música carregar e clica em Download → Guitar Pro. */
const downloadScript = (songId: number) => `
  const wait = async (test, ms) => { const t = Date.now(); while (Date.now() - t < ms) { const v = test(); if (v) return v; await new Promise((r) => setTimeout(r, 300)) } return null }
  const onPage = await wait(() => /-s${songId}(?:t\\d+)?$/.test(location.pathname), 30000)
  if (!onPage) return __report({ type: 'click', ok: false, reason: 'a página da música não abriu' })
  const btn = await wait(() => document.querySelector('#c-export'), 30000)
  if (!btn) return __report({ type: 'click', ok: false, reason: 'botão de download não apareceu' })
  btn.click()
  const gp = await wait(() => document.querySelector('#control-export-gp'), 15000)
  if (!gp) return __report({ type: 'click', ok: false, reason: 'opção Guitar Pro não apareceu (sem Plus?)' })
  gp.click()
  __report({ type: 'click', ok: true })
`

// ---------- avisos do AppShell quando um download vira música ----------

let onImported: ((id: number) => void) | null = null
/** O AppShell chama isto depois de importar um download. Devolve true se a importação em massa cuidou dele. */
export function bulkTookImport(id: number) {
  if (!onImported) return false
  onImported(id)
  return true
}

let stopRequested = false
export function stopBulkImport() {
  stopRequested = true
  set({ message: 'Parando depois da música atual…' })
}

/** Lê os favoritos e importa os que ainda não estão na biblioteca. */
export async function startBulkImport() {
  if (['listing', 'running'].includes(useBulkImport.getState().status)) return
  stopRequested = false
  set({ status: 'listing', songs: [], index: 0, current: null, imported: 0, skipped: 0, failed: [], message: 'Abrindo o Songsterr e lendo seus favoritos…' })
  try {
    await songsterrGo('https://www.songsterr.com/')
    await sleep(5000)
    const res = await ask(FAVORITES_SCRIPT, 30000)
    if (!res || res.type !== 'favorites') {
      return set({ status: 'error', message: (res?.message as string) ?? 'Não foi possível ler os favoritos. Confira se você está logado na janela do Songsterr e tente de novo.' })
    }
    const songs = (res.songs as FavoriteSong[]).filter((s) => Number.isFinite(s.id))
    set({ status: 'running', songs, message: null })

    for (let i = 0; i < songs.length; i++) {
      if (stopRequested) return set({ status: 'stopped', current: null, message: 'Importação interrompida.' })
      const s = songs[i]
      set({ index: i, current: s })
      // já está na biblioteca (link da mesma música): pula
      const have = await db.songs.filter((x) => !!x.songsterrUrl && new RegExp(`-s${s.id}(?:t\\d+)?(?:$|[/?#])`).test(x.songsterrUrl)).first()
      if (have?.file) {
        set({ skipped: useBulkImport.getState().skipped + 1 })
        continue
      }
      const imported = new Promise<number | null>((resolve) => {
        const t = setTimeout(() => {
          onImported = null
          resolve(null)
        }, SONG_TIMEOUT_MS)
        onImported = (id) => {
          clearTimeout(t)
          onImported = null
          resolve(id)
        }
      })
      await songsterrGo(`https://www.songsterr.com/a/wa/song?id=${s.id}`)
      await sleep(1500)
      const click = await ask(downloadScript(s.id), 70000)
      if (!click?.ok) {
        onImported = null
        set({ failed: [...useBulkImport.getState().failed, `${s.title} (${(click?.reason as string) ?? 'sem resposta'})`] })
        continue
      }
      const id = await imported
      if (id === null) {
        set({ failed: [...useBulkImport.getState().failed, `${s.title} (o download não chegou)`] })
        continue
      }
      // nome certo (o arquivo às vezes vem com outro título) e sincronia do YouTube já salva
      const patch: Parameters<typeof updateSong>[1] = {}
      if (s.title) Object.assign(patch, { title: s.title, artist: s.artist })
      const song = await db.songs.get(id)
      if (song?.songsterrUrl) {
        try {
          Object.assign(patch, { sync: await fetchSongsterrSync(song.songsterrUrl) })
        } catch {
          // música sem vídeo sincronizado no Songsterr: fica só a tab
        }
      }
      await updateSong(id, patch)
      set({ imported: useBulkImport.getState().imported + 1 })
      await sleep(PAUSE_MS)
    }
    set({ status: 'done', current: null, message: null })
  } catch (e) {
    set({ status: 'error', message: String(e) })
  } finally {
    onImported = null
  }
}
