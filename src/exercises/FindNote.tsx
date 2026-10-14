import { Mic, MicOff, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { playNote, uiSound } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button } from '../components/ui'
import type { FindNoteSpec } from '../curriculum/types'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, pcAt, stringNumber, type FretPos } from '../theory/instrument'
import { mod12, pcName } from '../theory/notes'
import { findNoteRound, type FindNoteRound } from './generate'
import type { ExerciseProps } from './types'
import { Kbd, useHotkeys } from '../components/useHotkeys'

export function FindNote({ spec, onRoundDone, round }: ExerciseProps<FindNoteSpec>) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()
  const [q, setQ] = useState<FindNoteRound>(() => findNoteRound(inst, spec.pool, spec.strings, spec.frets))
  const [markers, setMarkers] = useState<Marker[]>([])
  const [locked, setLocked] = useState(false)
  const [forceTap, setForceTap] = useState(false)
  const playMode = spec.input === 'play' && !forceTap
  const prevRound = useRef(round)

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    setQ((prev) => findNoteRound(inst, spec.pool, spec.strings, spec.frets, prev))
    setMarkers([])
    setLocked(false)
  }, [round, inst, spec])

  const finish = useCallback(
    (correct: boolean, marks: Marker[]) => {
      setLocked(true)
      setMarkers(marks)
      uiSound(correct ? 'ok' : 'miss')
      setTimeout(() => onRoundDone(correct ? 1 : 0), correct ? 650 : 1500)
    },
    [onRoundDone],
  )

  const reveal = (tone: Marker['tone']) => q.targets.map((t) => ({ ...t, tone, label: noteName(q.pc) }))

  const onPick = (pos: FretPos) => {
    if (locked) return
    playNote(midiAt(inst, pos))
    const ok = pcAt(inst, pos) === q.pc && q.strings.includes(pos.string)
    if (ok) finish(true, [{ ...pos, tone: 'ok', label: noteName(q.pc) }])
    else finish(false, [...reveal('ghost'), { ...pos, tone: 'miss', label: noteName(pcAt(inst, pos)) }])
  }

  const { status, reading } = useAudioInput(playMode, {
    onNote: (midi) => {
      if (locked) return
      if (mod12(midi) === q.pc) finish(true, reveal('ok'))
    },
  })

  useHotkeys({ Escape: () => playMode && !locked && finish(false, reveal('ghost')) })

  const stringLabel =
    q.strings.length === 1
      ? `na corda ${noteName(pcAt(inst, { string: q.strings[0], fret: 0 }))} (${stringNumber(inst, q.strings[0])}ª)`
      : 'em qualquer corda'
  const heard = reading ? noteName(mod12(Math.round(reading.midi))) : null

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-center xl:gap-10">
      <div className="text-center xl:text-left flex flex-col gap-4">
        <p className="eyebrow">{playMode ? 'Toque no instrumento' : 'Clique no braço'}</p>
        <p className="mt-2 text-2xl font-semibold">
          Encontre <span className="font-display text-5xl font-black text-enclosure align-middle mx-1">{noteName(q.pc)}</span>
          <span className="block text-base text-pearl-dim font-normal mt-1">{stringLabel}</span>
        </p>
        {!playMode && <p className="hidden xl:block text-sm text-pearl-faint">Teclado: Tab entra no braço, setas andam pelas casas, Enter responde.</p>}
        {playMode && (
          <div className="panel flex items-center justify-between gap-3 p-4">
            {status === 'on' ? (
              <>
                <span className="flex items-center gap-3">
                  <Mic className="size-5 text-led-green" aria-hidden />
                  <span>
                    <span className="block text-sm text-pearl-dim">Ouvindo…</span>
                    <span className="font-display text-3xl font-black" aria-live="polite">
                      {heard ?? '—'}
                    </span>
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
                  {status === 'denied'
                    ? 'O navegador bloqueou o microfone. Libere o acesso nas permissões do site.'
                    : 'Não foi possível abrir a entrada de áudio. Confira a pedaleira em Ajustes.'}
                </span>
                <Button variant="secondary" onClick={() => setForceTap(true)}>
                  Responder no braço
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <Fretboard
          inst={inst}
          from={spec.frets.from}
          to={spec.frets.to}
          markers={markers}
          activeStrings={q.strings}
          leftHanded={leftHanded}
          onPick={playMode ? undefined : onPick}
          ariaLabel={`Encontre ${pcName(q.pc)} ${stringLabel}`}
        />
      </div>
    </div>
  )
}
