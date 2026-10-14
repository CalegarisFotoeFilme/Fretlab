import type * as AT from '@coderline/alphatab'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Gauge, Hourglass, Pause, Play, Repeat, Square, Timer, Video, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAudioInput } from '../audio/useInput'
import { SongTheory } from '../components/SongTheory'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { Button, Segmented } from '../components/ui'
import { alphaTabPaths, applySoundFont, customSoundFont, loadAlphaTab, openSongsterr } from '../library/alphatab'
import { isDesktop } from '../library/desktop'
import { analyzeSong } from '../library/songAnalysis'
import { syncAvailable, videoLabel } from '../library/songsterrSync'
import { useOriginalAudio } from '../library/useOriginalAudio'
import { db } from '../progress/db'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { mod12 } from '../theory/notes'

type View = 'tab' | 'both'
/** O que soa no player: a banda toda ou só a faixa escolhida (com bateria ou metrônomo de apoio). */
type Mix = 'band' | 'solo' | 'drums' | 'click'

const MIXES: { value: Mix; label: string; hint: string; kbd: string }[] = [
  { value: 'band', label: 'Banda', hint: 'Todas as faixas', kbd: '1' },
  { value: 'solo', label: 'Só a faixa', hint: 'Só a faixa escolhida', kbd: '2' },
  { value: 'drums', label: 'Faixa + bateria', hint: 'A faixa escolhida com a bateria', kbd: '3' },
  { value: 'click', label: 'Faixa + metrônomo', hint: 'A faixa escolhida com o metrônomo', kbd: '4' },
]

export function SongPage() {
  const { id } = useParams()
  const song = useLiveQuery(() => db.songs.get(Number(id)), [id])
  const inst = useInstrument()
  const kind = useSettings((s) => s.instrument)

  const host = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const apiRef = useRef<AT.AlphaTabApi | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<AT.model.Score | null>(null)
  const [track, setTrack] = useState<AT.model.Track | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [looping, setLooping] = useState(false)
  const [metronome, setMetronome] = useState(false)
  const [muteMine, setMuteMine] = useState(false)
  // modo espera (estilo Simply Piano): a cada nota da sua faixa, o player para até você tocá-la
  const [waitMode, setWaitMode] = useState(false)
  const [waitingFor, setWaitingFor] = useState<number[] | null>(null)
  const waitRef = useRef(false)
  const expectedRef = useRef<Set<number> | null>(null)
  const lastWaitedRef = useRef<AT.model.Beat | null>(null)
  const noteName = useNoteName()
  // áudio original do YouTube sincronizado com a tab (app para Mac)
  const videoHost = useRef<HTMLDivElement>(null)
  const original = useOriginalAudio(apiRef, videoHost, song?.songsterrUrl, song?.sync, (sync) => {
    if (song?.id) void db.songs.update(song.id, { sync })
  })
  const videoOn = original.state.status === 'on' || original.state.status === 'loading'
  // vídeo: grande, pequeno ou oculto (só o som; lembrado neste navegador)
  const [videoSize, setVideoSize] = useState<'big' | 'small' | 'hidden'>(() => {
    try {
      return (localStorage.getItem('fretlab.player.video') as 'big' | 'small' | 'hidden' | null) ?? 'small'
    } catch {
      return 'small'
    }
  })
  const changeVideoSize = (v: 'big' | 'small' | 'hidden') => {
    setVideoSize(v)
    try {
      localStorage.setItem('fretlab.player.video', v)
    } catch {
      // sem armazenamento local: só não lembra
    }
  }
  const [mix, setMix] = useState<Mix>('band')
  // controles flutuantes: expandidos ou só a barra compacta (lembra a escolha neste navegador)
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem('fretlab.player.expanded') !== '0'
    } catch {
      return true
    }
  })
  const toggleExpanded = () => {
    const v = !expanded
    setExpanded(v)
    try {
      localStorage.setItem('fretlab.player.expanded', v ? '1' : '0')
    } catch {
      // sem armazenamento local: só não lembra
    }
  }
  const [view, setView] = useState<View>('tab')
  const [time, setTime] = useState({ cur: 0, end: 0 })
  // compasso em análise (segue o cursor) e metrônomo visual: tempo atual e tempos do compasso
  const [bar, setBar] = useState(0)
  const [beat, setBeat] = useState<{ n: number; of: number; id: number } | null>(null)
  const analysis = useMemo(() => (score ? analyzeSong(score) : null), [score])

  // O Dexie devolve um Blob novo a cada leitura: usa uma chave estável para não recriar o player.
  const fileKey = song?.file ? `${song.id}:${song.fileName}:${song.file.size}` : null
  const songRef = useRef(song)
  useEffect(() => {
    songRef.current = song
  })

  useEffect(() => {
    const file = songRef.current?.file
    if (!fileKey || !file || !host.current) return
    let disposed = false
    let instance: AT.AlphaTabApi | null = null
    ;(async () => {
      try {
        const at = await loadAlphaTab()
        if (disposed || !host.current) return
        const paths = alphaTabPaths()
        const hasCustomSf = !!(await customSoundFont())
        if (disposed || !host.current) return
        instance = new at.AlphaTabApi(host.current, {
          core: { fontDirectory: paths.fonts, scriptFile: paths.script },
          player: {
            playerMode: at.PlayerMode.EnabledSynthesizer,
            // com SoundFont próprio, o padrão nem é baixado (applySoundFont entrega os bytes)
            soundFont: hasCustomSf ? null : paths.soundFont,
            scrollElement: scroller.current ?? undefined,
            enableUserInteraction: true,
          },
          display: {
            staveProfile: at.StaveProfile.Tab,
            resources: {
              mainGlyphColor: '#efe7da',
              secondaryGlyphColor: '#bcae9b',
              staffLineColor: '#66493a',
              barSeparatorColor: '#8a7a68',
              barNumberColor: '#8a7a68',
              scoreInfoColor: '#efe7da',
            },
          },
        } as AT.json.SettingsJson)
        const inst = instance
        apiRef.current = inst
        inst.scoreLoaded.on((s) => {
          setScore(s)
          const pick = pickTrack(s, kind)
          setTrack(pick)
          inst.renderTracks([pick])
          // título e artista reais do arquivo, se o nome atual veio do nome do arquivo
          const cur = songRef.current
          if (cur && cur.title === cur.fileName?.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) {
            void db.songs.update(cur.id!, { title: s.title || cur.title, artist: s.artist || cur.artist })
          }
        })
        inst.playerReady.on(() => {
          setReady(true)
          // volumes salvos desta música
          const mix = songRef.current?.mix
          if (mix) {
            inst.masterVolume = mix.master
            for (const [i, v] of Object.entries(mix.tracks)) {
              const t = inst.score?.tracks[Number(i)]
              if (t) inst.changeTrackVolume([t], v)
            }
          }
        })
        // tempos por compasso (fórmula de compasso de onde o cursor está), para o metrônomo visual
        let beatsPerBar = 4
        inst.playedBeatChanged.on((b) => {
          setBar(b.voice.bar.masterBar.index)
          beatsPerBar = b.voice.bar.masterBar.timeSignatureNumerator
          // modo espera: nota nova da faixa escolhida → pausa e espera a nota certa no instrumento
          if (!waitRef.current || b.isRest || b === lastWaitedRef.current) return
          const pcs = [...new Set(b.notes.filter((n) => !n.isTieDestination && !n.isDead).map((n) => mod12(n.realValue)))]
          if (!pcs.length || b.voice.bar.staff.track.isPercussion) return
          lastWaitedRef.current = b
          expectedRef.current = new Set(pcs)
          inst.pause()
          setWaitingFor(pcs)
        })
        inst.beatMouseDown.on((b) => setBar(b.voice.bar.masterBar.index))
        // metrônomo visual: os eventos do click chegam junto com o som, mesmo com o volume do metrônomo zerado
        inst.midiEventsPlayedFilter = [at.midi.MidiEventType.AlphaTabMetronome]
        let tick = 0
        inst.midiEventsPlayed.on((e) => {
          for (const ev of e.events) {
            const m = ev as AT.midi.AlphaTabMetronomeEvent
            if (!m.isMetronome) continue
            setBeat({ n: m.metronomeNumerator, of: Math.max(beatsPerBar, m.metronomeNumerator + 1), id: ++tick })
          }
        })
        inst.error.on((e) => setError(`Erro no leitor de tablatura: ${e.message}`))
        inst.playerStateChanged.on((e) => {
          setPlaying(e.state === 1)
          if (e.state !== 1) setBeat(null)
        })
        let last = 0
        inst.playerPositionChanged.on((e) => {
          if (Math.abs(e.currentTime - last) > 250 || e.currentTime < last) {
            last = e.currentTime
            setTime({ cur: e.currentTime, end: e.endTime })
          }
        })
        if (hasCustomSf || !paths.soundFont) void applySoundFont(inst).catch(() => setError('Não foi possível carregar os timbres do player.'))
        const bytes = new Uint8Array(await file.arrayBuffer())
        const name = songRef.current?.fileName ?? ''
        if (/\.midi?$/i.test(name)) {
          // MIDI do Songsterr: convertido aqui, direto para o modelo do alphaTab
          const { midiToScore } = await import('../library/midiImport')
          if (disposed) return
          inst.renderScore(midiToScore(at, bytes, name).score)
        } else inst.load(bytes)
        void db.songs.update(Number(id), { lastOpenedAt: Date.now() })
      } catch (e) {
        setError((e as Error).message)
      }
    })()
    return () => {
      disposed = true
      instance?.destroy()
      apiRef.current = null
    }
    // recria só quando o arquivo muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey])

  /** Aplica solo/mudo no player a partir do modo, da faixa escolhida e de "Tirar faixa". */
  const applyMix = (m: Mix, t: AT.model.Track | null, mute: boolean, click = metronome) => {
    const api = apiRef.current
    const all = api?.score?.tracks
    if (!api || !all || !t) return
    api.changeTrackSolo(all, false)
    api.changeTrackMute(all, false)
    if (m !== 'band') api.changeTrackSolo([t, ...(m === 'drums' ? all.filter((x) => x.isPercussion && x !== t) : [])], true)
    if (mute) api.changeTrackMute([t], true)
    api.metronomeVolume = click ? 1 : 0
    api.countInVolume = click ? 1 : 0
  }
  const changeMix = (m: Mix) => {
    setMix(m)
    // "Faixa + metrônomo" liga o metrônomo; sair dele volta ao estado do botão
    const click = m === 'click' || (mix !== 'click' && metronome)
    setMetronome(click)
    applyMix(m, track, muteMine, click)
  }
  const goToBar = (i: number) => {
    setBar(i)
    const api = apiRef.current
    const mb = api?.score?.masterBars[i]
    if (api && mb && !playing) api.tickPosition = mb.start
  }
  const selectTrack = (t: AT.model.Track) => {
    setTrack(t)
    apiRef.current?.renderTracks([t])
    applyMix(mix, t, muteMine)
  }
  // volumes: geral e por faixa, salvos na música
  const levels = song?.mix ?? { master: 1, tracks: {} }
  // grava em cima do valor atual do banco (mexer rápido em dois sliders não perde nada)
  const saveMix = (change: (m: { master: number; tracks: Record<number, number> }) => void) => {
    if (!song?.id) return
    void db.songs
      .where('id')
      .equals(song.id)
      .modify((s) => {
        const m = s.mix ?? { master: 1, tracks: {} }
        change(m)
        s.mix = m
      })
  }
  const changeMaster = (v: number) => {
    const api = apiRef.current
    if (api) api.masterVolume = v
    saveMix((m) => {
      m.master = v
    })
  }
  const changeTrackVolume = (t: AT.model.Track, v: number) => {
    apiRef.current?.changeTrackVolume([t], v)
    saveMix((m) => {
      m.tracks[t.index] = v
    })
  }
  const changeSpeed = (v: number) => {
    const s = Math.min(1.5, Math.max(0.25, Math.round(v * 100) / 100))
    setSpeed(s)
    const api = apiRef.current
    if (api) api.playbackSpeed = s
  }
  const toggleLoop = () => {
    const v = !looping
    setLooping(v)
    const api = apiRef.current
    if (api) api.isLooping = v
  }
  const toggleMetronome = () => {
    const v = !metronome
    setMetronome(v)
    applyMix(mix, track, muteMine, v)
  }
  const toggleWait = () => {
    const v = !waitMode
    setWaitMode(v)
    waitRef.current = v
    expectedRef.current = null
    lastWaitedRef.current = null
    setWaitingFor(null)
  }
  // ouvindo o instrumento enquanto o modo espera estiver ligado; qualquer nota esperada (acorde) libera
  const { status: inputStatus } = useAudioInput(waitMode, {
    onNote: (midi) => {
      if (!expectedRef.current?.has(mod12(midi))) return
      expectedRef.current = null
      setWaitingFor(null)
      apiRef.current?.play()
    },
  })
  const toggleMute = () => {
    const v = !muteMine
    setMuteMine(v)
    applyMix(mix, track, v)
  }
  const changeView = (v: View) => {
    setView(v)
    const api = apiRef.current
    if (!api || !window.alphaTab) return
    api.settings.display.staveProfile = v === 'tab' ? window.alphaTab.StaveProfile.Tab : window.alphaTab.StaveProfile.ScoreTab
    api.updateSettings()
    api.render()
  }

  useHotkeys({
    ' ': () => ready && apiRef.current?.playPause(),
    Escape: () => apiRef.current?.stop(),
    l: toggleLoop,
    m: toggleMetronome,
    t: toggleMute,
    w: toggleWait,
    c: toggleExpanded,
    v: () => videoOn && changeVideoSize(videoSize === 'hidden' ? 'small' : 'hidden'),
    o: () => {
      if (!syncAvailable() || !song?.songsterrUrl) return
      void (videoOn ? original.disable() : original.enable())
    },
    '[': () => goToBar(Math.max(0, bar - 1)),
    ']': () => goToBar(Math.min((score?.masterBars.length ?? 1) - 1, bar + 1)),
    ...Object.fromEntries(MIXES.map((x) => [x.kbd, () => changeMix(x.value)])),
    '-': () => changeSpeed(speed - 0.05),
    '=': () => changeSpeed(speed + 0.05),
    '+': () => changeSpeed(speed + 0.05),
  })

  if (song === undefined) return null
  if (song === null || !song.file) {
    return (
      <div className="p-8">
        <p>Essa música não tem arquivo Guitar Pro.</p>
        <Link to="/musicas" className="text-enclosure underline">Voltar para Músicas</Link>
      </div>
    )
  }

  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms / 1000) % 60)).padStart(2, '0')}`

  const mixLabel = MIXES.find((x) => x.value === mix)!.label

  return (
    <div className="flex flex-col xl:flex-row xl:h-dvh">
      {/* partitura, com os controles flutuando por cima */}
      <section className="relative flex-1 min-w-0 flex flex-col xl:h-dvh">
        <header className="flex items-center gap-3 px-4 md:px-8 pt-6 pb-3">
          <Link to="/musicas" className="grid place-items-center size-11 -ml-2 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Voltar para Músicas">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-black uppercase truncate">{song.title}</h1>
            <p className="text-pearl-dim truncate">{song.artist || 'Artista desconhecido'}</p>
          </div>
          {/* metrônomo visual em destaque, fora dos controles minimizáveis */}
          <div className="flex items-center gap-3 rounded-2xl border border-wood-700/70 bg-wood-950/60 px-4 py-2.5">
            <BeatLights beat={beat} />
            <span className="hidden md:block font-mono text-xs text-pearl-faint leading-tight text-right">
              compasso
              <br />
              <span className="text-lg font-bold text-pearl">{bar + 1}</span>
            </span>
          </div>
          {song.songsterrUrl && (
            <Button variant="secondary" onClick={() => openSongsterr(song.songsterrUrl!)}>
              <ExternalLink className="size-4" aria-hidden /> Songsterr ao lado
            </Button>
          )}
        </header>
        <div ref={scroller} className={`relative z-0 isolate flex-1 overflow-auto px-4 md:px-8 min-h-[60vh] ${expanded ? 'pb-[28rem]' : 'pb-48 md:pb-28'}`}>
          {error && <p className="panel p-4 text-led-red">{error}</p>}
          {!score && !error && <p className="text-pearl-dim py-10 text-center">Carregando a tablatura…</p>}
          {song.origin === 'midi' && score && (
            <p className="mb-3 text-sm text-pearl-faint">
              Tablatura convertida do MIDI. Para ficar idêntica à do Songsterr (com palm mute, harmônicos e dedilhado), importe o arquivo Guitar Pro.
            </p>
          )}
          <div ref={host} className="alphatab-host" />
        </div>

        <div
          // oculto = fora da tela (não some do DOM: o YouTube continua tocando o som)
          className={`absolute z-20 aspect-video overflow-hidden rounded-xl border border-wood-700 bg-black shadow-2xl ${videoOn ? '' : 'hidden'} ${
            videoSize === 'hidden' ? '-left-[10000px] top-0 w-64' : videoSize === 'small' ? 'left-4 top-24 w-64' : 'left-4 top-24 w-[min(520px,45%)]'
          }`}
          aria-hidden={videoSize === 'hidden'}
        >
          <div ref={videoHost} className="size-full" />
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            <button onClick={() => changeVideoSize(videoSize === 'big' ? 'small' : 'big')} className="rounded-md bg-black/70 px-2 py-0.5 text-xs text-pearl">
              {videoSize === 'big' ? 'diminuir' : 'aumentar'}
            </button>
            <button onClick={() => changeVideoSize('hidden')} className="rounded-md bg-black/70 px-2 py-0.5 text-xs text-pearl" aria-label="Ocultar o vídeo (o som continua)">
              ocultar
            </button>
          </div>
        </div>

        <div className="fixed inset-x-2 bottom-[4.75rem] z-20 md:absolute md:inset-x-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-[min(820px,calc(100%-2rem))]">
          {expanded && (
            <div id="player-controls" className="mb-2 max-h-[60dvh] overflow-y-auto rounded-2xl border border-wood-700 bg-wood-900/95 backdrop-blur p-4 shadow-2xl grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-4">
                  <h2 className="eyebrow mb-2">Áudio <Kbd>O</Kbd></h2>
                  {syncAvailable() && song.songsterrUrl ? (
                    <>
                      <Segmented<string>
                        label="Áudio"
                        value={videoOn ? 'video' : 'midi'}
                        onChange={(v) => void (v === 'video' ? original.enable() : original.disable())}
                        options={[
                          { value: 'midi', label: 'Sintetizador (MIDI)' },
                          { value: 'video', label: 'Gravação (YouTube)' },
                        ]}
                      />
                      {original.state.status === 'on' && original.videos.length > 1 && (
                        <select
                          className="mt-2 w-full min-h-10 rounded-xl bg-wood-900 border border-wood-700 px-3 text-sm"
                          aria-label="Versão do vídeo"
                          value={original.videos.indexOf(original.state.video)}
                          onChange={(e) => void original.enable(Number(e.target.value))}
                        >
                          {original.videos.map((v, i) => (
                            <option key={v.videoId} value={i}>
                              {videoLabel(v, original.trackNames)}
                            </option>
                          ))}
                        </select>
                      )}
                      {original.state.status === 'loading' && <p className="mt-2 text-xs text-pearl-dim">{original.state.message}</p>}
                      {original.state.status === 'error' && <p className="mt-2 text-xs text-led-red">{original.state.message}</p>}
                      {original.state.status === 'on' && original.state.warning && <p className="mt-2 text-xs text-led-amber">{original.state.warning}</p>}
                      {original.state.status === 'on' && (
                        <p className="mt-2 text-xs text-pearl-faint">A gravação manda no tempo: velocidade e loop continuam valendo; os modos de faixa e o metrônomo são do sintetizador.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-pearl-faint">
                      {isDesktop()
                        ? 'Para tocar com a gravação original, a música precisa do link do Songsterr (as baixadas pela janela do Songsterr já vêm com ele).'
                        : 'Tocar com a gravação original (YouTube) sincronizada funciona no app para Mac.'}
                    </p>
                  )}
                </div>
                <label className="block">
                  <span className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold"><Gauge className="size-4" aria-hidden /> Velocidade</span>
                    <span className="font-mono">{Math.round(speed * 100)}% <Kbd>−</Kbd> <Kbd>+</Kbd></span>
                  </span>
                  <input type="range" min={0.25} max={1.5} step={0.05} value={speed} onChange={(e) => changeSpeed(Number(e.target.value))} className="w-full accent-[var(--color-enclosure)] mt-2" />
                </label>
                <label className="mt-3 block">
                  <span className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold"><Volume2 className="size-4" aria-hidden /> Volume geral</span>
                    <span className="font-mono">{Math.round(levels.master * 100)}%</span>
                  </span>
                  <input type="range" min={0} max={1} step={0.05} value={levels.master} onChange={(e) => changeMaster(Number(e.target.value))} className="w-full accent-[var(--color-enclosure)] mt-2" aria-label="Volume geral" />
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0.5, 0.75, 1].map((v) => (
                    <button key={v} onClick={() => changeSpeed(v)} className={`min-h-9 px-3 rounded-lg text-sm font-semibold ${speed === v ? 'bg-wood-700 text-pearl' : 'text-pearl-dim hover:bg-wood-800'}`}>
                      {v * 100}%
                    </button>
                  ))}
                </div>

                <h2 className="eyebrow mt-4 mb-2">O que tocar</h2>
                <div role="radiogroup" aria-label="O que tocar" className="grid grid-cols-2 gap-1.5">
                  {MIXES.map((x) => (
                    <button
                      key={x.value}
                      role="radio"
                      aria-checked={mix === x.value}
                      title={x.hint}
                      onClick={() => changeMix(x.value)}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-semibold flex items-center justify-between gap-2 transition-colors ${
                        mix === x.value ? 'border-enclosure/70 bg-enclosure/15 text-enclosure' : 'border-wood-700 text-pearl-dim hover:text-pearl hover:bg-wood-800'
                      }`}
                    >
                      {x.label} <Kbd>{x.kbd}</Kbd>
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <Toggle on={looping} onClick={toggleLoop} icon={<Repeat className="size-4" aria-hidden />} label="Loop" kbd="L" />
                  <Toggle on={metronome} onClick={toggleMetronome} icon={<Timer className="size-4" aria-hidden />} label="Metrônomo" kbd="M" />
                  <Toggle on={muteMine} onClick={toggleMute} icon={<VolumeX className="size-4" aria-hidden />} label="Tirar faixa" kbd="T" />
                  <Toggle on={waitMode} onClick={toggleWait} icon={<Hourglass className="size-4" aria-hidden />} label="Modo espera" kbd="W" />
                </div>
                {waitMode && (
                  <p className="mt-2 text-xs text-pearl-dim">
                    Modo espera: a cada nota da faixa escolhida o player para até você tocá-la no instrumento (ligue a pedaleira em Ajustes). Junte com "Tirar faixa" para ouvir só a banda.
                    {inputStatus === 'denied' && <span className="text-led-red"> O navegador bloqueou o microfone.</span>}
                    {inputStatus === 'error' && <span className="text-led-red"> Não foi possível abrir a entrada de áudio.</span>}
                  </p>
                )}
                <p className="mt-3 text-xs text-pearl-faint">
                  Para praticar um trecho: arraste sobre os compassos na tablatura, ligue o loop e escolha o que tocar. "Tirar faixa" silencia a sua parte para você tocar por cima.
                </p>
              </div>

              {score && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="eyebrow">Faixas</h2>
                    <Segmented<View> label="Notação" value={view} onChange={changeView} options={[{ value: 'tab', label: 'Tab' }, { value: 'both', label: 'Tab + partitura' }]} />
                  </div>
                  <ul className="grid gap-1">
                    {score.tracks.map((t) => {
                      const vol = levels.tracks[t.index] ?? 1
                      return (
                        <li key={t.index} className="grid grid-cols-[minmax(0,1fr)_120px_3rem] items-center gap-2">
                          <button
                            onClick={() => selectTrack(t)}
                            className={`text-left min-h-10 px-3 rounded-lg text-sm truncate ${track?.index === t.index ? 'bg-wood-700 text-pearl font-semibold' : 'text-pearl-dim hover:bg-wood-800'}`}
                          >
                            {t.name || `Faixa ${t.index + 1}`}
                            {t.isPercussion && <span className="ml-2 eyebrow">bateria</span>}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.05}
                            value={vol}
                            onChange={(e) => changeTrackVolume(t, Number(e.target.value))}
                            className="w-full accent-[var(--color-enclosure)]"
                            aria-label={`Volume de ${t.name || `Faixa ${t.index + 1}`}`}
                            disabled={videoOn}
                          />
                          <span className="font-mono text-xs text-pearl-faint text-right">{Math.round(vol * 100)}%</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* barra compacta: sempre visível */}
          <div className="flex items-center gap-2 rounded-2xl border border-wood-700 bg-wood-900/95 backdrop-blur p-2 shadow-2xl">
            <Button onClick={() => apiRef.current?.playPause()} disabled={!ready} className="min-w-28 shrink-0 whitespace-nowrap" aria-label={playing ? 'Pausar' : 'Tocar'}>
              {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
              <span className="hidden sm:inline">{ready ? (playing ? 'Pausar' : 'Tocar') : 'Carregando…'}</span> <Kbd>espaço</Kbd>
            </Button>
            <button onClick={() => apiRef.current?.stop()} className="grid place-items-center size-11 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Parar e voltar ao início" title="Parar (Esc)">
              <Square className="size-4" aria-hidden />
            </button>
            <span className="hidden sm:inline px-1 font-mono text-xs text-pearl-faint">{fmt(time.cur)} / {fmt(time.end)}</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => changeSpeed(speed - 0.05)} className="hidden md:grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Diminuir velocidade">−</button>
              <span className="font-mono text-sm w-12 text-center" title="Velocidade">{Math.round(speed * 100)}%</span>
              <button onClick={() => changeSpeed(speed + 0.05)} className="hidden md:grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Aumentar velocidade">+</button>
              <MiniToggle on={looping} onClick={toggleLoop} label="Loop (L)" icon={<Repeat className="size-4" aria-hidden />} />
              <MiniToggle on={metronome} onClick={toggleMetronome} label="Metrônomo (M)" icon={<Timer className="size-4" aria-hidden />} />
              <MiniToggle on={waitMode} onClick={toggleWait} label="Modo espera (W)" icon={<Hourglass className="size-4" aria-hidden />} />
              {/* vídeo do YouTube: mostrar/ocultar fica na barra, sem cobrir a tab */}
              {videoOn && (
                <MiniToggle
                  on={videoSize !== 'hidden'}
                  onClick={() => changeVideoSize(videoSize === 'hidden' ? 'small' : 'hidden')}
                  label={videoSize === 'hidden' ? 'Mostrar o vídeo (V)' : 'Ocultar o vídeo (V)'}
                  icon={<Video className="size-4" aria-hidden />}
                />
              )}
              {waitingFor && (
                <span className="rounded-lg bg-enclosure/15 px-2 py-1 text-sm font-bold text-enclosure animate-pulse" role="status">
                  Toque {waitingFor.map((pc) => noteName(pc)).join(' / ')}
                </span>
              )}
              <span className="hidden lg:inline max-w-40 truncate rounded-lg bg-wood-950/70 px-2 py-1 text-xs font-semibold text-pearl-dim" title="O que tocar (1–4)">
                {videoOn ? 'Gravação (YouTube)' : mixLabel}
              </span>
              <button
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-controls="player-controls"
                className="flex items-center gap-1.5 min-h-11 rounded-xl px-2.5 text-sm font-semibold text-pearl-dim hover:text-pearl hover:bg-wood-800"
                title={expanded ? 'Minimizar controles (C)' : 'Mais controles: faixas, o que tocar (C)'}
              >
                {expanded ? <ChevronDown className="size-4" aria-hidden /> : <ChevronUp className="size-4" aria-hidden />}
                <span className="hidden md:inline">{expanded ? 'Menos' : 'Faixas e mais'}</span> <Kbd>C</Kbd>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* lateral: só a teoria (os controles flutuam sobre a partitura) */}
      {score && analysis && (
        <aside className="xl:w-[440px] 2xl:w-[560px] shrink-0 border-t xl:border-t-0 xl:border-l border-wood-700/70 bg-wood-950/60 xl:h-dvh xl:overflow-y-auto p-5 pb-36 xl:pb-5">
          <SongTheory analysis={analysis} score={score} track={track} bar={Math.min(bar, score.masterBars.length - 1)} onBar={goToBar} inst={inst} />
        </aside>
      )}
    </div>
  )
}

/** Botão pequeno de liga/desliga para a barra compacta. */
function MiniToggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`grid place-items-center size-9 rounded-lg transition-colors ${on ? 'bg-enclosure/15 text-enclosure' : 'text-pearl-dim hover:text-pearl hover:bg-wood-800'}`}
    >
      {icon}
    </button>
  )
}

/** Metrônomo visual: uma luz por tempo; o tempo forte pisca maior, os tempos já tocados ficam acesos. */
function BeatLights({ beat }: { beat: { n: number; of: number; id: number } | null }) {
  const of = beat?.of ?? 4
  return (
    <div className="flex items-center gap-2.5" aria-hidden title="Metrônomo visual">
      {Array.from({ length: Math.min(of, 12) }, (_, i) => {
        const lit = beat !== null && i <= beat.n
        const now = beat !== null && i === beat.n
        const strong = i === 0
        return (
          <span
            key={now ? `${i}-${beat!.id}` : i}
            className={`rounded-full transition-colors ${strong ? 'size-7' : 'size-5'} ${
              lit ? (strong ? 'bg-enclosure' : 'bg-pearl') : 'bg-wood-700'
            } ${now ? (strong ? 'beat-flash-strong' : 'beat-flash') : ''}`}
          />
        )
      })}
    </div>
  )
}

function Toggle({ on, onClick, icon, label, kbd }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string; kbd?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-11 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
        on ? 'border-enclosure/70 bg-enclosure/15 text-enclosure' : 'border-wood-700 text-pearl-dim hover:text-pearl hover:bg-wood-800'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span className={on ? 'led text-enclosure size-1.5' : 'led-off size-1.5'} aria-hidden />
        {icon}
      </span>
      <span>
        {label} {kbd && <Kbd>{kbd}</Kbd>}
      </span>
    </button>
  )
}

/** Escolhe a faixa que combina com o instrumento configurado. */
function pickTrack(score: AT.model.Score, kind: string): AT.model.Track {
  const melodic = score.tracks.filter((t) => !t.isPercussion)
  const isBassTrack = (t: AT.model.Track) => /bass|baixo/i.test(t.name) || Math.min(...(t.staves[0]?.tuning ?? [99])) < 36
  const wantBass = kind !== 'guitar6'
  return melodic.find((t) => isBassTrack(t) === wantBass) ?? melodic[0] ?? score.tracks[0]
}
