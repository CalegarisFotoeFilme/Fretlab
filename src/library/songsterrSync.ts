import type * as AT from '@coderline/alphatab'
import { isDesktop } from './desktop'

/*
  Áudio original (YouTube) sincronizado com a tab, como no Songsterr.
  O Songsterr guarda, para cada revisão de uma música, vídeos do YouTube e o instante (em segundos)
  em que cada compasso tocado começa no vídeo. Com esses pontos, o alphaTab usa o vídeo como relógio
  (modo "mídia externa") e o cursor da tab acompanha a gravação real.

  A API do Songsterr não libera acesso de outros sites (CORS): por isso só funciona no app para Mac,
  onde a requisição sai pelo Rust (plugin HTTP, liberado só para songsterr.com/api).
*/

export type VideoFeature = 'original' | 'alternative' | 'backing' | 'solo'

export interface SyncVideo {
  videoId: string
  feature: VideoFeature
  /** início de cada compasso tocado no vídeo, em segundos (com repetições expandidas) */
  points: number[]
  /** faixas (índices do Songsterr) que estão fora do áudio, nos vídeos de "backing" */
  mutedTracks: number[]
}

export interface SongsterrSync {
  songId: number
  revisionId: number
  title: string
  trackNames: string[]
  videos: SyncVideo[]
}

/** Só em desenvolvimento: dados de sincronia injetados para testar o fluxo no navegador (sem CORS). */
const devFixture = (): SongsterrSync | null => {
  if (!import.meta.env.DEV) return null
  try {
    const raw = sessionStorage.getItem('fretlab.syncFixture')
    return raw ? (JSON.parse(raw) as SongsterrSync) : null
  } catch {
    return null
  }
}

/** O áudio original sincronizado está disponível aqui? (app para Mac) */
export const syncAvailable = () => isDesktop() || !!devFixture()

/** "…-tab-s455" → 455 */
export function songsterrSongId(url: string): number | null {
  const m = /-s(\d+)(?:t\d+)?(?:[/?#]|$)/.exec(url)
  return m ? Number(m[1]) : null
}

interface RawVideo {
  videoId: string
  feature: string | null
  points: number[]
  status: string
  tracks: number[] | null
}

async function getJson<T>(url: string): Promise<T> {
  const { fetch } = await import('@tauri-apps/plugin-http')
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Songsterr respondeu ${r.status}`)
  return (await r.json()) as T
}

/** Busca a revisão atual da música e os vídeos sincronizados dela. */
export async function fetchSongsterrSync(songsterrUrl: string): Promise<SongsterrSync> {
  const fixture = devFixture()
  if (fixture) return fixture
  if (!isDesktop()) throw new Error('O áudio original sincronizado só funciona no app para Mac (o Songsterr bloqueia o acesso pelo navegador).')
  const songId = songsterrSongId(songsterrUrl)
  if (!songId) throw new Error('Não achei o número da música no link do Songsterr.')
  const meta = await getJson<{ revisionId: number; title: string; tracks?: { name?: string; title?: string }[] }>(`https://www.songsterr.com/api/meta/${songId}`)
  const raw = await getJson<RawVideo[]>(`https://www.songsterr.com/api/video-points/${songId}/${meta.revisionId}/list`)
  const videos = raw
    .filter((v) => v.status === 'done' && v.videoId && v.points?.length)
    .map((v) => ({
      videoId: v.videoId,
      feature: (v.feature ?? 'original') as VideoFeature,
      points: v.points,
      mutedTracks: v.tracks ?? [],
    }))
    // o original primeiro, depois alternativos, playbacks e solos
    .sort((a, b) => ORDER.indexOf(a.feature) - ORDER.indexOf(b.feature))
  return { songId, revisionId: meta.revisionId, title: meta.title, trackNames: (meta.tracks ?? []).map((t) => t.name ?? t.title ?? ''), videos }
}

const ORDER: VideoFeature[] = ['original', 'alternative', 'backing', 'solo']

export function videoLabel(v: SyncVideo, trackNames: string[]) {
  if (v.feature === 'original') return 'Gravação original'
  if (v.feature === 'alternative') return 'Versão alternativa'
  if (v.feature === 'solo') return 'Só a faixa (solo)'
  const without = v.mutedTracks.map((t) => trackNames[t]).filter(Boolean)
  return without.length ? `Playback sem ${without.join(', ')}` : 'Playback (sem uma faixa)'
}

/**
 * Converte os pontos do Songsterr (um por compasso tocado, em ordem) para sync points do alphaTab
 * (compasso + ocorrência na repetição). `played` é a ordem de execução dos compassos (tickCache).
 */
export function toFlatSyncPoints(played: { index: number }[], points: number[]): AT.model.FlatSyncPoint[] {
  const seen = new Map<number, number>()
  const out: AT.model.FlatSyncPoint[] = []
  played.forEach((mb, i) => {
    if (i >= points.length) return
    const occurrence = seen.get(mb.index) ?? 0
    seen.set(mb.index, occurrence + 1)
    out.push({ barIndex: mb.index, barOccurence: occurrence, barPosition: 0, millisecondOffset: Math.round(points[i] * 1000) })
  })
  return out
}

// ---------- YouTube IFrame API ----------

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlaybackRate(): number
  setPlaybackRate(rate: number): void
  getVolume(): number
  setVolume(v: number): void
  getPlayerState(): number
  destroy(): void
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number; PAUSED: number; ENDED: number } }
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytLoading: Promise<NonNullable<Window['YT']>> | null = null
/** Carrega a API do player do YouTube (uma vez). */
export function loadYouTube(): Promise<NonNullable<Window['YT']>> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  ytLoading ??= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.onerror = () => {
      ytLoading = null
      reject(new Error('Não foi possível carregar o player do YouTube.'))
    }
    document.head.appendChild(s)
  })
  return ytLoading
}
