import type * as AT from '@coderline/alphatab'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, Gauge, Pause, Play, Repeat, Square, Timer, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { playSequence } from '../audio/engine'
import { Fretboard } from '../components/Fretboard'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { Button, Segmented } from '../components/ui'
import { alphaTabPaths, collectNotes, loadAlphaTab, openSongsterr } from '../library/alphatab'
import { db } from '../progress/db'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findPositions } from '../theory/instrument'
import { estimateKey, histogramOf, type KeyGuess } from '../theory/key'
import { chordName, chordNotes, harmonicField, intervalBetween, mod12, prefersFlats, scaleNotes } from '../theory/notes'

type View = 'tab' | 'both'

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
  const [view, setView] = useState<View>('tab')
  const [time, setTime] = useState({ cur: 0, end: 0 })

  const file = song?.file
  const songRef = useRef(song)
  useEffect(() => {
    songRef.current = song
  })

  useEffect(() => {
    if (!file || !host.current) return
    let disposed = false
    let instance: AT.AlphaTabApi | null = null
    ;(async () => {
      try {
        const at = await loadAlphaTab()
        if (disposed || !host.current) return
        instance = new at.AlphaTabApi(host.current, {
          core: { fontDirectory: alphaTabPaths.fonts, scriptFile: alphaTabPaths.script },
          player: {
            playerMode: at.PlayerMode.EnabledSynthesizer,
            soundFont: alphaTabPaths.soundFont,
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
        inst.playerReady.on(() => setReady(true))
        inst.playerStateChanged.on((e) => setPlaying(e.state === 1))
        let last = 0
        inst.playerPositionChanged.on((e) => {
          if (Math.abs(e.currentTime - last) > 250 || e.currentTime < last) {
            last = e.currentTime
            setTime({ cur: e.currentTime, end: e.endTime })
          }
        })
        inst.load(new Uint8Array(await file.arrayBuffer()))
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
  }, [file])

  const selectTrack = (t: AT.model.Track) => {
    if (muteMine && track) {
      apiRef.current?.changeTrackMute([track], false)
      apiRef.current?.changeTrackMute([t], true)
    }
    setTrack(t)
    apiRef.current?.renderTracks([t])
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
    const api = apiRef.current
    if (api) {
      api.metronomeVolume = v ? 1 : 0
      api.countInVolume = v ? 1 : 0
    }
  }
  const toggleMute = () => {
    const v = !muteMine
    setMuteMine(v)
    const api = apiRef.current
    if (api && track) api.changeTrackMute([track], v)
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

  return (
    <div className="flex flex-col xl:flex-row xl:h-dvh">
      {/* partitura */}
      <section className="flex-1 min-w-0 flex flex-col xl:h-dvh">
        <header className="flex items-center gap-3 px-4 md:px-8 pt-6 pb-3">
          <Link to="/musicas" className="grid place-items-center size-11 -ml-2 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Voltar para Músicas">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-black uppercase truncate">{song.title}</h1>
            <p className="text-pearl-dim truncate">{song.artist || 'Artista desconhecido'}</p>
          </div>
          {song.songsterrUrl && (
            <Button variant="secondary" onClick={() => openSongsterr(song.songsterrUrl!)}>
              <ExternalLink className="size-4" aria-hidden /> Songsterr ao lado
            </Button>
          )}
        </header>
        <div ref={scroller} className="flex-1 overflow-auto px-4 md:px-8 pb-28 xl:pb-8 min-h-[60vh]">
          {error && <p className="panel p-4 text-led-red">{error}</p>}
          {!score && !error && <p className="text-pearl-dim py-10 text-center">Carregando a tablatura…</p>}
          <div ref={host} className="alphatab-host" />
        </div>
      </section>

      {/* barra lateral: transporte, faixas e teoria */}
      <aside className="xl:w-[400px] 2xl:w-[440px] shrink-0 border-t xl:border-t-0 xl:border-l border-wood-700/70 bg-wood-950/60 xl:h-dvh xl:overflow-y-auto">
        <div className="p-5 flex flex-col gap-5">
          <div className="panel p-4">
            <div className="flex items-center gap-2">
              <Button size="lg" className="flex-1" onClick={() => apiRef.current?.playPause()} disabled={!ready}>
                {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
                {ready ? (playing ? 'Pausar' : 'Tocar') : 'Carregando som…'} <Kbd>espaço</Kbd>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => apiRef.current?.stop()} aria-label="Parar e voltar ao início" title="Parar (Esc)">
                <Square className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="mt-2 font-mono text-xs text-pearl-faint text-right">
              {fmt(time.cur)} / {fmt(time.end)}
            </p>

            <label className="mt-3 block">
              <span className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold"><Gauge className="size-4" aria-hidden /> Velocidade</span>
                <span className="font-mono">{Math.round(speed * 100)}% <Kbd>−</Kbd> <Kbd>+</Kbd></span>
              </span>
              <input type="range" min={0.25} max={1.5} step={0.05} value={speed} onChange={(e) => changeSpeed(Number(e.target.value))} className="w-full accent-[var(--color-enclosure)] mt-2" />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[0.5, 0.75, 1].map((v) => (
                <button key={v} onClick={() => changeSpeed(v)} className={`min-h-9 px-3 rounded-lg text-sm font-semibold ${speed === v ? 'bg-wood-700 text-pearl' : 'text-pearl-dim hover:bg-wood-800'}`}>
                  {v * 100}%
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Toggle on={looping} onClick={toggleLoop} icon={<Repeat className="size-4" aria-hidden />} label="Loop" kbd="L" />
              <Toggle on={metronome} onClick={toggleMetronome} icon={<Timer className="size-4" aria-hidden />} label="Metrônomo" kbd="M" />
              <Toggle on={muteMine} onClick={toggleMute} icon={<VolumeX className="size-4" aria-hidden />} label="Tirar faixa" />
            </div>
            <p className="mt-3 text-xs text-pearl-faint">
              Para repetir um trecho, arraste sobre os compassos na tablatura e ligue o loop. "Tirar faixa" silencia a sua parte para você tocar por cima.
            </p>
          </div>

          {score && (
            <div className="panel p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="eyebrow">Faixas</h2>
                <Segmented<View> label="Notação" value={view} onChange={changeView} options={[{ value: 'tab', label: 'Tab' }, { value: 'both', label: 'Tab + partitura' }]} />
              </div>
              <ul className="grid gap-1">
                {score.tracks.map((t) => (
                  <li key={t.index}>
                    <button
                      onClick={() => selectTrack(t)}
                      className={`w-full text-left min-h-10 px-3 rounded-lg text-sm ${track?.index === t.index ? 'bg-wood-700 text-pearl font-semibold' : 'text-pearl-dim hover:bg-wood-800'}`}
                    >
                      {t.name || `Faixa ${t.index + 1}`}
                      {t.isPercussion && <span className="ml-2 eyebrow">bateria</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {score && <SongTheory score={score} inst={inst} />}
        </div>
      </aside>
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

function SongTheory({ score, inst }: { score: AT.model.Score; inst: ReturnType<typeof useInstrument> }) {
  const noteName = useNoteName()
  const leftHanded = useSettings((s) => s.leftHanded)
  const guesses = useMemo<KeyGuess[]>(() => {
    const notes = score.tracks.flatMap((t) => collectNotes(t))
    return notes.length ? estimateKey(histogramOf(notes)).slice(0, 2) : []
  }, [score])
  const [scale, setScale] = useState<'full' | 'penta'>('penta')
  if (!guesses.length) return null
  const key = guesses[0]
  const flats = prefersFlats(key.root, key.mode)
  const pcs = scaleNotes(key.root, scale === 'penta' ? (key.mode === 'major' ? 'majorPentatonic' : 'minorPentatonic') : key.mode)
  const markers = pcs.flatMap((pc) =>
    findPositions(inst, pc, 12).map((p) => ({ ...p, tone: pc === key.root ? ('root' as const) : ('neutral' as const), label: intervalBetween(key.root, pc).short })),
  )
  const field = harmonicField(key.root, key.mode)
  const keyLabel = (k: KeyGuess) => `${noteName(k.root, prefersFlats(k.root, k.mode))} ${k.mode === 'major' ? 'maior' : 'menor'}`

  return (
    <div className="panel p-4">
      <h2 className="eyebrow">Teoria desta música</h2>
      <p className="mt-2 font-display text-4xl font-black uppercase">{keyLabel(key)}</p>
      <p className="text-sm text-pearl-dim">
        Tom provável, calculado pelas notas da música. Segunda opção: {keyLabel(guesses[1])}.
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Escala no braço (graus)</span>
        <Segmented label="Escala" value={scale} onChange={setScale} options={[{ value: 'penta', label: 'Pentatônica' }, { value: 'full', label: 'Completa' }]} />
      </div>
      <div className="mt-2 -mx-2 overflow-x-auto">
        <Fretboard inst={inst} to={12} markers={markers} leftHanded={leftHanded} orientation="horizontal" />
      </div>

      <h3 className="mt-4 text-sm font-semibold">Campo harmônico</h3>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {field.map((d) => (
          <button
            key={d.degree}
            onClick={() => playSequence(chordNotes(d.root, d.quality).map((pc) => 52 + mod12(pc - 4)), 0.1)}
            className="rounded-lg border border-wood-700 px-2 py-1.5 text-left hover:border-enclosure/60 hover:bg-wood-800"
            title="Ouvir o acorde"
          >
            <span className="block font-mono text-[10px] text-pearl-faint">{d.roman}</span>
            <span className="font-display text-xl font-black">{chordName(d.root, d.quality, flats)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
