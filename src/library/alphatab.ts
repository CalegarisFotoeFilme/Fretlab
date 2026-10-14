import type * as AT from '@coderline/alphatab'

// O alphaTab é carregado pelo build UMD em /vendor (copiado no postinstall), assim fontes,
// soundfont e o worker são encontrados pelo mesmo caminho do script.
const BASE = '/vendor/alphatab/'

declare global {
  interface Window {
    alphaTab?: typeof AT
  }
}

let loading: Promise<typeof AT> | null = null

export function loadAlphaTab(): Promise<typeof AT> {
  if (window.alphaTab) return Promise.resolve(window.alphaTab)
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `${BASE}alphaTab.min.js`
    s.async = true
    s.onload = () => (window.alphaTab ? resolve(window.alphaTab) : reject(new Error('alphaTab não carregou')))
    s.onerror = () => {
      loading = null
      reject(new Error('Não foi possível carregar o leitor de tablaturas.'))
    }
    document.head.appendChild(s)
  })
  return loading
}

/** URLs absolutas: o worker do alphaTab roda a partir de um blob e não resolve caminhos relativos. */
export function alphaTabPaths() {
  const abs = (p: string) => new URL(BASE + p, window.location.origin).href
  return { script: abs('alphaTab.min.js'), fonts: abs('font/'), soundFont: abs('soundfont/sonivox.sf2') }
}

export interface ScoreNote {
  midi: number
  weight: number
}

/** Coleta as notas de uma faixa (ignorando percussão), com peso pela duração. */
export function collectNotes(track: AT.model.Track): ScoreNote[] {
  const out: ScoreNote[] = []
  if (track.isPercussion) return out
  for (const staff of track.staves) {
    if (staff.isPercussion) continue
    for (const bar of staff.bars)
      for (const voice of bar.voices)
        for (const beat of voice.beats)
          for (const note of beat.notes) {
            if (note.isDead || note.isTieDestination) continue
            out.push({ midi: note.realValue, weight: Math.max(1, beat.playbackDuration) })
          }
  }
  return out
}

/** "metallica-enter-sandman-tab-s19" → { title, artist } com melhor palpite. */
export function parseSongsterrUrl(url: string): { title: string; artist: string } | null {
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith('songsterr.com')) return null
    const slug = u.pathname.split('/').filter(Boolean).at(-1) ?? ''
    const clean = slug.replace(/-(?:bass-|drum-|guitar-)?tab-s\d+.*$/, '').replace(/-s\d+$/, '')
    const words = clean.split('-').filter(Boolean).map((w) => w[0]?.toUpperCase() + w.slice(1))
    if (!words.length) return null
    return { title: words.join(' '), artist: '' }
  } catch {
    return null
  }
}

/** Abre o Songsterr numa janela ao lado (metade direita da tela). */
export function openSongsterr(url: string) {
  const w = Math.round(window.screen.availWidth / 2)
  const h = window.screen.availHeight
  window.open(url, 'fretlab-songsterr', `popup,width=${w},height=${h},left=${w},top=0`)
}
