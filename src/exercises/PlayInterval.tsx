import { Mic, MicOff, SkipForward, Volume2 } from 'lucide-react'
import { Hint, useFact } from './Hint'
import { playIntervalHints } from './hints'
import { useCallback, useEffect, useRef, useState } from 'react'
import { playInterval, playNote, uiSound } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { PlayIntervalSpec } from '../curriculum/types'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, pcAt, stringNumber, type FretPos } from '../theory/instrument'
import { INTERVALS, mod12 } from '../theory/notes'
import { HAND_SPAN, intervalRound, type IntervalRound } from './generate'
import type { ExerciseProps } from './types'

/** Fundamental marcada no braço; a pessoa toca (ou clica) o intervalo pedido, para cima. */
export function PlayInterval({ spec, onRoundDone, round }: ExerciseProps<PlayIntervalSpec>) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()
  const [q, setQ] = useState<IntervalRound>(() => intervalRound(inst, spec.intervals, spec.strings, spec.frets))
  const [markers, setMarkers] = useState<Marker[]>([])
  const [locked, setLocked] = useState(false)
  const [forceTap, setForceTap] = useState(false)
  const playMode = spec.input === 'play' && !forceTap
  const prevRound = useRef(round)
  const rootMidi = midiAt(inst, q.root)
  const iv = INTERVALS[q.semis]
  useFact(`play-interval:${q.semis}`, `Tocar a ${iv.name.toLowerCase()}`)

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    setQ((prev) => intervalRound(inst, spec.intervals, spec.strings, spec.frets, prev))
    setMarkers([])
    setLocked(false)
  }, [round, inst, spec])

  const rootMarker: Marker = { ...q.root, tone: 'root', label: 'R' }
  const finish = useCallback(
    (correct: boolean, marks: Marker[]) => {
      setLocked(true)
      setMarkers(marks)
      uiSound(correct ? 'ok' : 'miss')
      setTimeout(() => playInterval(rootMidi, q.semis), 250)
      setTimeout(() => onRoundDone(correct ? 1 : 0), correct ? 1300 : 2200)
    },
    [onRoundDone, rootMidi, q.semis],
  )
  const reveal = (tone: Marker['tone']) => q.targets.map((t) => ({ ...t, tone, label: iv.short }))

  const onPick = (pos: FretPos) => {
    if (locked) return
    playNote(midiAt(inst, pos))
    if (pos.string === q.root.string && pos.fret === q.root.fret) return // tocar a fundamental só dá a referência
    const ok = midiAt(inst, pos) === rootMidi + q.semis
    if (ok) finish(true, [{ ...pos, tone: 'ok', label: iv.short }])
    else finish(false, [...reveal('ghost'), { ...pos, tone: 'miss', label: noteName(pcAt(inst, pos)) }])
  }

  // tocando no instrumento: vale a nota certa em qualquer oitava (a detecção às vezes salta oitava no grave)
  const { status, reading } = useAudioInput(playMode, {
    onNote: (midi) => {
      if (locked) return
      if (mod12(midi) === mod12(rootMidi + q.semis)) finish(true, reveal('ok'))
    },
  })

  useHotkeys({
    ' ': () => playNote(rootMidi),
    Escape: () => !locked && finish(false, reveal('ghost')),
  })

  const from = Math.max(0, Math.min(spec.frets.from, q.root.fret) - 1)
  const to = Math.min(inst.frets, Math.max(spec.frets.to, q.root.fret) + HAND_SPAN + 1)
  const heard = reading ? noteName(mod12(Math.round(reading.midi))) : null

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-center xl:gap-10">
      <div className="text-center xl:text-left flex flex-col gap-4">
        <p className="eyebrow">{playMode ? 'Toque no instrumento' : 'Clique no braço'}</p>
        <p className="text-2xl xl:text-3xl font-semibold">
          Toque a <span className="block font-display text-5xl xl:text-6xl font-black text-enclosure my-1">{iv.name.toLowerCase()}</span>
          <span className="block text-base xl:text-xl text-pearl-dim font-normal">
            acima de {noteName(mod12(rootMidi))} ({stringNumber(inst, q.root.string)}ª corda, casa {q.root.fret}) · {q.semis} {q.semis === 1 ? 'semitom' : 'semitons'}
          </span>
        </p>
        <p className="text-sm text-pearl-faint">Vale a forma na mesma corda ou nas cordas mais agudas, sem tirar a mão da posição.</p>
        <div className="flex flex-wrap gap-2 justify-center xl:justify-start">
          <Button variant="ghost" onClick={() => playNote(rootMidi)}>
            <Volume2 className="size-4" aria-hidden /> Ouvir a fundamental <Kbd>espaço</Kbd>
          </Button>
          {!playMode && (
            <Button variant="ghost" onClick={() => !locked && finish(false, reveal('ghost'))}>
              <SkipForward className="size-4" aria-hidden /> Mostrar <Kbd>esc</Kbd>
            </Button>
          )}
        </div>
        {!locked && <Hint key={round} lines={playIntervalHints(inst, q.root, q.semis, q.targets[0], noteName, mod12(rootMidi))} />}
        {playMode && (
          <div className="panel flex items-center justify-between gap-3 p-4">
            {status === 'on' ? (
              <>
                <span className="flex items-center gap-3">
                  <Mic className="size-5 text-led-green" aria-hidden />
                  <span>
                    <span className="block text-sm text-pearl-dim">Ouvindo…</span>
                    <span className="font-display text-3xl font-black" aria-live="polite">{heard ?? '—'}</span>
                  </span>
                </span>
                <Button variant="ghost" onClick={() => !locked && finish(false, reveal('ghost'))}>
                  <SkipForward className="size-4" aria-hidden /> Pular <Kbd>esc</Kbd>
                </Button>
              </>
            ) : status === 'starting' ? (
              <span className="text-pearl-dim">Ligando a entrada de áudio…</span>
            ) : (
              <>
                <span className="flex items-center gap-3 text-sm">
                  <MicOff className="size-5 text-led-red shrink-0" aria-hidden />
                  {status === 'denied' ? 'O navegador bloqueou o microfone. Libere o acesso nas permissões do site.' : 'Não foi possível abrir a entrada de áudio. Confira a pedaleira em Ajustes.'}
                </span>
                <Button variant="secondary" onClick={() => setForceTap(true)}>Responder no braço</Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <Fretboard
          inst={inst}
          from={from}
          to={to}
          markers={[rootMarker, ...markers]}
          leftHanded={leftHanded}
          onPick={playMode ? undefined : onPick}
          ariaLabel={`Fundamental na ${stringNumber(inst, q.root.string)}ª corda, casa ${q.root.fret}. Encontre a ${iv.name.toLowerCase()} acima dela.`}
        />
      </div>
    </div>
  )
}
