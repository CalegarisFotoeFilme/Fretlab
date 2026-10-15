import { Mic, Play, Volume2 } from 'lucide-react'
import { Hint } from './Hint'
import { rhythmHints } from './hints'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audioCtx, playNote, startMetronome, uiSound, type MetronomeHandle } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { RhythmStaff } from '../components/RhythmStaff'
import { Button } from '../components/ui'
import type { RhythmSpec } from '../curriculum/types'
import { useInstrument, useSettings } from '../progress/settings'
import { parsePattern } from './generate'
import { onsetBeats, scoreRhythm, totalBeats, type RhythmEvent, type RhythmScore, eventBeats } from './rhythmScore'
import type { ExerciseProps } from './types'
import { Kbd, useHotkeys } from '../components/useHotkeys'

type Phase = 'ready' | 'countin' | 'playing' | 'done'

/** Toca o padrão (para ouvir antes): cliques + corda grave nos ataques. */
export function previewPattern(events: RhythmEvent[], bpm: number, midi: number) {
  const spb = 60 / bpm
  const beats = totalBeats(events)
  const m = startMetronome(bpm, 4, undefined, { totalBeats: beats })
  // cada nota dura a sua figura (a pausa cala); a última decai sozinha
  let t = 0
  events.forEach((e, i) => {
    if (!e.rest) playNote(midi, m.startTime + t * spb, 0.7, false, i < events.length - 1 ? eventBeats(e) * spb : undefined)
    t += eventBeats(e)
  })
  setTimeout(() => m.stop(), (beats * spb + 0.5) * 1000)
}

export function Rhythm({ spec, onRoundDone, round }: ExerciseProps<RhythmSpec>) {
  const inst = useInstrument()
  const latencyMs = useSettings((s) => s.latencyMs)
  const events = useMemo(() => parsePattern(spec.patterns[round % spec.patterns.length]), [spec, round])
  const beats = totalBeats(events)
  const spb = 60 / spec.bpm
  const [phase, setPhase] = useState<Phase>('ready')
  const [playhead, setPlayhead] = useState<number | null>(null)
  const [result, setResult] = useState<RhythmScore | null>(null)
  const [countIn, setCountIn] = useState(0)
  const taps = useRef<number[]>([])
  const metro = useRef<MetronomeHandle | null>(null)
  const patternStart = useRef(0)
  const raf = useRef(0)
  const playMode = spec.input === 'play'

  // nova rodada → volta ao início
  const [seenRound, setSeenRound] = useState(round)
  if (seenRound !== round) {
    setSeenRound(round)
    setPhase('ready')
    setResult(null)
    setPlayhead(null)
  }

  const stopAll = useCallback(() => {
    metro.current?.stop()
    cancelAnimationFrame(raf.current)
  }, [])
  useEffect(() => stopAll, [stopAll])

  const start = () => {
    taps.current = []
    setResult(null)
    setPhase('countin')
    const m = startMetronome(spec.bpm, 4, (beat) => {
      if (beat < 4) setCountIn(4 - beat)
      if (beat === 4) setPhase('playing')
    }, { totalBeats: 4 + beats })
    metro.current = m
    patternStart.current = m.startTime + 4 * spb
    const tick = () => {
      const pos = (audioCtx().currentTime - patternStart.current) / spb
      setPlayhead(pos >= 0 ? pos : null)
      if (pos < beats + 0.35) raf.current = requestAnimationFrame(tick)
      else finish()
    }
    raf.current = requestAnimationFrame(tick)
  }

  const finish = () => {
    stopAll()
    setPlayhead(null)
    const expected = onsetBeats(events).map((b) => b * spb * 1000)
    const s = scoreRhythm(expected, taps.current)
    setResult(s)
    setPhase('done')
    uiSound(s.accuracy >= 0.8 ? 'ok' : 'miss')
  }

  const registerHit = useCallback(
    (time: number) => {
      const rel = (time - patternStart.current) * 1000 - latencyMs
      if (rel < -200) return // ainda na contagem
      taps.current.push(rel)
    },
    [latencyMs],
  )

  const tap = useCallback(() => {
    if (phase !== 'playing' && phase !== 'countin') return
    playNote(inst.openMidi[0] + 12, 0, 0.5)
    registerHit(audioCtx().currentTime)
  }, [phase, inst, registerHit])

  useEffect(() => {
    if (playMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tap, playMode])

  const { status } = useAudioInput(playMode, {
    onOnset: (t) => (phase === 'playing' || phase === 'countin') && registerHit(t),
  })

  useHotkeys({
    Enter: () => {
      if (phase === 'ready') start()
      else if (phase === 'done' && result) onRoundDone(result.accuracy)
    },
  })

  const hitsForStaff = result?.hits
  const perfect = result?.hits.filter((h) => h.grade === 'perfect' || h.grade === 'good').length ?? 0

  return (
    <div className="flex flex-col gap-5 max-w-[1200px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{spec.bpm} BPM · 4/4</p>
        <Button variant="ghost" onClick={() => previewPattern(events, spec.bpm, inst.openMidi[0] + 12)} disabled={phase === 'countin' || phase === 'playing'}>
          <Volume2 className="size-4" aria-hidden /> Ouvir
        </Button>
      </div>

      <div className="panel px-2 py-3">
        <RhythmStaff events={events} playhead={playhead} hits={hitsForStaff} marks={spec.marks?.[round % spec.patterns.length]} />
      </div>

      {phase !== 'done' && <Hint key={round} lines={rhythmHints(onsetBeats(events))} />}
      <div aria-live="polite" className="text-center min-h-8">
        {phase === 'countin' && <p className="font-display text-4xl font-black text-enclosure">{countIn}</p>}
        {phase === 'playing' && <p className="text-pearl-dim">{playMode ? 'Toque agora!' : 'Agora!'}</p>}
        {phase === 'done' && result && (
          <p>
            <span className="font-display text-3xl font-black">{Math.round(result.accuracy * 100)}%</span>
            <span className="block text-sm text-pearl-dim">
              {perfect}/{result.hits.length} no tempo
              {result.meanAbsOffsetMs > 0 && ` · desvio médio ${result.meanAbsOffsetMs} ms`}
              {result.extra > 0 && ` · ${result.extra} ${result.extra === 1 ? 'toque a mais' : 'toques a mais'}`}
            </span>
          </p>
        )}
      </div>

      {phase === 'ready' && (
        <p className="text-center text-pearl-dim -mt-2">
          O metrônomo conta 4 tempos antes. {playMode ? 'Depois, toque a corda solta mais grave no ritmo.' : 'Depois, marque cada nota no tempo certo.'}
        </p>
      )}
      {phase === 'ready' && (
        <Button size="lg" onClick={start}>
          <Play className="size-5" aria-hidden /> Começar <Kbd>enter</Kbd>
        </Button>
      )}

      {(phase === 'countin' || phase === 'playing') &&
        (playMode ? (
          <div className="panel p-6 text-center">
            <Mic className={`size-8 mx-auto ${status === 'on' ? 'text-led-green' : 'text-led-red'}`} aria-hidden />
            <p className="mt-2 text-pearl-dim">{status === 'on' ? 'Ouvindo os ataques…' : 'Entrada de áudio indisponível. Confira em Ajustes.'}</p>
          </div>
        ) : (
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              tap()
            }}
            className="h-36 rounded-[var(--radius-pedal)] bg-wood-800 border border-wood-600 shadow-[0_6px_0_var(--color-wood-950)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-wood-950)] font-display text-3xl font-black uppercase touch-manipulation select-none"
            aria-label="Tocar (ou aperte espaço)"
          >
            <span className="md:hidden">Toque aqui</span>
            <span className="hidden md:inline">Espaço</span>
            <span className="block font-sans text-sm font-normal text-pearl-faint normal-case">
              <span className="md:hidden">no ritmo das notas</span>
              <span className="hidden md:inline">aperte no ritmo das notas (ou clique aqui)</span>
            </span>
          </button>
        ))}

      {phase === 'done' && result && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={start}>
            Tentar de novo
          </Button>
          <Button size="lg" onClick={() => onRoundDone(result.accuracy)} autoFocus>
            Continuar <Kbd>enter</Kbd>
          </Button>
        </div>
      )}
    </div>
  )
}
