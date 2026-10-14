import { Volume2 } from 'lucide-react'
import { Hint } from './Hint'
import { nameNoteHints } from './hints'
import { useEffect, useRef, useState } from 'react'
import { playNote, uiSound } from '../audio/engine'
import { Fretboard } from '../components/Fretboard'
import { Button } from '../components/ui'
import type { NameNoteSpec } from '../curriculum/types'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, stringNumber } from '../theory/instrument'
import { nameNoteRound, type NameNoteRound } from './generate'
import type { ExerciseProps } from './types'
import { Kbd, useHotkeys } from '../components/useHotkeys'

export function NameNote({ spec, onRoundDone, round }: ExerciseProps<NameNoteSpec>) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()
  const [q, setQ] = useState<NameNoteRound>(() => nameNoteRound(inst, spec.pool, spec.strings, spec.frets, spec.choices))
  const [answer, setAnswer] = useState<number | null>(null)
  const prevRound = useRef(round)

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    setQ((prev) => nameNoteRound(inst, spec.pool, spec.strings, spec.frets, spec.choices, prev))
    setAnswer(null)
  }, [round, inst, spec])

  const choose = (pc: number) => {
    if (answer !== null) return
    setAnswer(pc)
    const ok = pc === q.pc
    uiSound(ok ? 'ok' : 'miss')
    playNote(midiAt(inst, q.pos))
    setTimeout(() => onRoundDone(ok ? 1 : 0), ok ? 650 : 1500)
  }

  useHotkeys(Object.fromEntries(q.options.map((pc, i) => [String(i + 1), () => choose(pc)])))
  useHotkeys({ ' ': () => playNote(midiAt(inst, q.pos)) })

  const from = Math.max(0, Math.min(spec.frets.from, q.pos.fret - 2))
  const to = Math.max(spec.frets.to, Math.min(from + 5, inst.frets), q.pos.fret)
  const where = `${stringNumber(inst, q.pos.string)}ª corda, ${q.pos.fret === 0 ? 'solta' : `casa ${q.pos.fret}`}`

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center xl:gap-10">
      <div className="-mx-4 overflow-x-auto px-4 xl:order-1">
        <Fretboard
          inst={inst}
          from={from}
          to={to}
          leftHanded={leftHanded}
          markers={[{ ...q.pos, tone: answer === null ? 'target' : answer === q.pc ? 'ok' : 'miss', label: answer === null ? '?' : noteName(q.pc) }]}
          ariaLabel={`Nota marcada: ${where}`}
        />
      </div>
      <div className="flex flex-col gap-4 xl:order-2 -order-1">
        <div className="text-center xl:text-left">
          <p className="eyebrow">Que nota é essa?</p>
          <p className="mt-2 text-xl xl:text-3xl font-semibold">{where}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((pc, i) => {
            const state = answer === null ? '' : pc === q.pc ? 'ring-2 ring-led-green' : pc === answer ? 'ring-2 ring-led-red opacity-80' : 'opacity-50'
            return (
              <Button key={pc} variant="secondary" size="lg" className={`font-display text-3xl font-black ${state}`} onClick={() => choose(pc)}>
                <Kbd>{i + 1}</Kbd> {noteName(pc)}
              </Button>
            )
          })}
        </div>
        <Button variant="ghost" onClick={() => playNote(midiAt(inst, q.pos))}>
          <Volume2 className="size-4" aria-hidden /> Ouvir a nota <Kbd>espaço</Kbd>
        </Button>
        {answer === null && <Hint key={round} lines={nameNoteHints(inst, q.pos, noteName)} />}
      </div>
    </div>
  )
}
