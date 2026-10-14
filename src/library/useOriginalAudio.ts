import type * as AT from '@coderline/alphatab'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { applySoundFont } from './alphatab'
import { fetchSongsterrSync, loadYouTube, toFlatSyncPoints, type SongsterrSync, type SyncVideo, type YTPlayer } from './songsterrSync'

export type OriginalAudioState =
  | { status: 'off' }
  | { status: 'loading'; message: string }
  | { status: 'on'; sync: SongsterrSync; video: SyncVideo; warning: string | null }
  | { status: 'error'; message: string }

/** Esvazia a caixa do vídeo. */
function clearHost(host: HTMLElement | null) {
  while (host?.firstChild) host.firstChild.remove()
}

/** Chama o player do YouTube sem quebrar se ele já tiver sido destruído. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/** Entrega o controle da reprodução ao player do YouTube (o vídeo vira o relógio do alphaTab). */
function attachExternalMedia(output: AT.synth.IExternalMediaSynthOutput, player: YTPlayer, playingState: number, guard: { until: number }) {
  output.handler = {
    get backingTrackDuration() {
      return safe(() => player.getDuration() * 1000, 0)
    },
    get playbackRate() {
      return safe(() => player.getPlaybackRate(), 1)
    },
    set playbackRate(v: number) {
      safe(() => player.setPlaybackRate(v), undefined)
    },
    get masterVolume() {
      return safe(() => player.getVolume() / 100, 1)
    },
    set masterVolume(v: number) {
      safe(() => player.setVolume(v * 100), undefined)
    },
    // no YouTube, buscar num vídeo parado faz ele começar a tocar: se não estava tocando, pausa de novo
    seekTo: (ms: number) =>
      safe(() => {
        const wasPlaying = player.getPlayerState() === playingState
        guard.until = Date.now() + 800
        player.seekTo(ms / 1000, true)
        if (!wasPlaying) player.pauseVideo()
      }, undefined),
    play: () => safe(() => player.playVideo(), undefined),
    pause: () => safe(() => player.pauseVideo(), undefined),
  }
}

/**
 * Liga/desliga o áudio original (YouTube) no player: o alphaTab passa para o modo "mídia externa",
 * o vídeo vira o relógio e os pontos do Songsterr alinham cada compasso da tab ao vídeo.
 */
export function useOriginalAudio(
  apiRef: RefObject<AT.AlphaTabApi | null>,
  videoHost: RefObject<HTMLDivElement | null>,
  songsterrUrl?: string,
  /** sincronia já salva na música (usada sem buscar no Songsterr) e onde salvar a nova */
  saved?: SongsterrSync,
  onFetched?: (sync: SongsterrSync) => void,
) {
  const [state, setState] = useState<OriginalAudioState>({ status: 'off' })
  const yt = useRef<YTPlayer | null>(null)
  const timer = useRef(0)
  const cache = useRef<SongsterrSync | null>(null)

  const teardown = () => {
    clearInterval(timer.current)
    yt.current?.destroy()
    yt.current = null
    clearHost(videoHost.current)
  }
  useEffect(
    () => () => {
      clearInterval(timer.current)
      yt.current?.destroy()
    },
    [],
  )

  /** Recria a MIDI e espera ela carregar (o tickCache traz a ordem dos compassos tocados). */
  const reloadMidi = (api: AT.AlphaTabApi) =>
    new Promise<void>((resolve) => {
      const done = () => {
        api.midiLoaded.off(done)
        resolve()
      }
      api.midiLoaded.on(done)
      api.loadMidiForScore()
      setTimeout(done, 4000)
    })

  const enable = async (videoIndex = 0) => {
    const api = apiRef.current
    const at = window.alphaTab
    if (!api || !at || !api.score || !songsterrUrl) return
    try {
      setState({ status: 'loading', message: 'Buscando o vídeo e a sincronia no Songsterr…' })
      let sync = cache.current ?? saved ?? null
      if (!sync) {
        sync = await fetchSongsterrSync(songsterrUrl)
        onFetched?.(sync)
      }
      cache.current = sync
      const video = sync.videos[videoIndex]
      if (!video) throw new Error('Essa música não tem vídeo sincronizado no Songsterr.')

      api.stop()
      teardown()
      api.settings.player.playerMode = at.PlayerMode.EnabledExternalMedia
      api.updateSettings()
      await reloadMidi(api)

      // ordem dos compassos tocados (com repetições) × pontos do Songsterr
      const played = (api.tickCache?.masterBars ?? []).map((m) => ({ index: m.masterBar.index }))
      api.score.applyFlatSyncPoints(toFlatSyncPoints(played, video.points))
      api.updateSyncPoints()
      const diff = Math.abs(played.length - video.points.length)
      const warning =
        diff > 1
          ? `A tab tem ${played.length} compassos tocados e a sincronia do Songsterr tem ${video.points.length}: o arquivo deve ser de outra revisão. Baixe o Guitar Pro de novo no Songsterr para alinhar.`
          : null

      setState({ status: 'loading', message: 'Abrindo o player do YouTube…' })
      const YT = await loadYouTube()
      const guard = { until: 0 }
      const el = document.createElement('div')
      videoHost.current?.appendChild(el)
      await new Promise<void>((resolve, reject) => {
        const player = new YT.Player(el, {
          videoId: video.videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
          events: {
            onReady: () => resolve(),
            onError: () => reject(new Error('O YouTube não deixou tocar esse vídeo aqui. Tente outra versão.')),
            // controles do próprio vídeo também mandam na tab
            onStateChange: (e: { data: number }) => {
              // logo depois de um seek feito pelo app, o "tocando" é do próprio seek: ignora
              if (Date.now() < guard.until) return
              const playing = api.playerState === at.synth.PlayerState.Playing
              if (e.data === YT.PlayerState.PLAYING && !playing) api.play()
              if ((e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) && playing) api.pause()
            },
          },
        })
        yt.current = player
      })

      const player = yt.current!
      const output = api.player?.output as AT.synth.IExternalMediaSynthOutput | undefined
      if (!output) throw new Error('O player da tab não aceitou mídia externa.')
      attachExternalMedia(output, player, YT.PlayerState.PLAYING, guard)
      // o vídeo é o relógio: a tab segue o tempo dele
      // o YouTube informa o tempo em degraus: entre leituras iguais, avança pelo relógio (cursor sem piscar)
      let lastYt = -1
      let lastAt = 0
      timer.current = window.setInterval(() => {
        if (safe(() => player.getPlayerState(), -1) !== YT.PlayerState.PLAYING) {
          lastYt = -1
          return
        }
        const t = player.getCurrentTime() * 1000
        const now = performance.now()
        if (t !== lastYt) {
          lastYt = t
          lastAt = now
          output.updatePosition(t)
        } else output.updatePosition(t + (now - lastAt) * safe(() => player.getPlaybackRate(), 1))
      }, 40)
      setState({ status: 'on', sync, video, warning })
    } catch (e) {
      teardown()
      await disable(false)
      setState({ status: 'error', message: (e as Error).message })
    }
  }

  const disable = async (reset = true) => {
    const api = apiRef.current
    const at = window.alphaTab
    // para antes de destruir o vídeo: no modo mídia externa, parar a tab manda o vídeo pausar
    api?.stop()
    teardown()
    if (api && at && api.settings.player.playerMode !== at.PlayerMode.EnabledSynthesizer) {
      api.settings.player.playerMode = at.PlayerMode.EnabledSynthesizer
      api.updateSettings()
      // o sintetizador foi recriado: sem caminho padrão (SoundFont próprio ou claude.ai), entrega os timbres de novo
      if (!api.settings.player.soundFont) await applySoundFont(api)
      await reloadMidi(api)
    }
    if (reset) setState({ status: 'off' })
  }

  const sync = state.status === 'on' ? state.sync : null
  return { state, enable, disable, videos: sync?.videos ?? [], trackNames: sync?.trackNames ?? [] }
}
