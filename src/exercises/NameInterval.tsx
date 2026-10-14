import { Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { playInterval, uiSound } from '../audio/engine'
import { Fretboard } from '../components/Fretboard'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { NameIntervalSpec } from '../curriculum/types'
import { useInstrument, useSettings } from '../progress/settings'
import { midiAt, type FretPos } from '../theory/instrument'
import { INTERVALS } from '../theory/notes'
import { HAND_SPAN, intervalOptions, intervalRound, pick, type IntervalRound } from './generate'
import type { ExerciseProps } from './types'

interface Round extends IntervalRound {
  shown: FretPos
  options: number[]
}

const makeRound = (inst: ReturnType<typeof useInstrument>, spec: NameIntervalSpec, prev?: Round): Round => {
  const r = intervalRound(inst, spec.intervals, spec.strings, spec.frets, prev)
  return { ...r, shown: pick(r.targets), options: intervalOptions(r.semis, spec.intervals, 6) }
}

/** Duas notas marcadas no braço (fundamental e outra): reconhecer o intervalo pela forma. */
export function NameInterval({ spec, onRoundDone, round }: ExerciseProps<NameIntervalSpec>) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const [q, setQ] = useState<Round>(() => makeRound(inst, spec))
  const [answer, setAnswer] = useState<number | null>(null)
  const prevRound = useRef(round)
  const rootMidi = midiAt(inst, q.root)

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    setQ((prev) => makeRound(inst, spec, prev))
    setAnswer(null)
  }, [round, inst, spec])

  const hear = () => playInterval(rootMidi, q.semis)
  const choose = (semis: number) => {
    if (answer !== null) return
    setAnswer(semis)
    const ok = semis === q.semis
    uiSound(ok ? 'ok' : 'miss')
    setTimeout(hear, 250)
    setTimeout(() => onRoundDone(ok ? 1 : 0), ok ? 1300 : 2200)
  }

  useHotkeys({ ...Object.fromEntries(q.options.map((s, i) => [String(i + 1), () => choose(s)])), ' ': hear })

  const from = Math.max(0, Math.min(q.root.fret, q.shown.fret) - 2)
  const to = Math.min(inst.frets, Math.max(from + HAND_SPAN + 3, q.shown.fret + 2))
  const done = answer !== null

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center xl:gap-10">
      <div className="-mx-4 overflow-x-auto px-4 xl:order-1">
        <Fretboard
          inst={inst}
          from={from}
          to={to}
          leftHanded={leftHanded}
          markers={[
            { ...q.root, tone: 'root', label: 'R' },
            { ...q.shown, tone: !done ? 'target' : answer === q.semis ? 'ok' : 'miss', label: done ? INTERVALS[q.semis].short : '?' },
          ]}
          ariaLabel="Fundamental (R) e outra nota marcadas no braço"
        />
      </div>
      <div className="flex flex-col gap-4 xl:order-2 -order-1">
        <div className="text-center xl:text-left">
          <p className="eyebrow">Que intervalo é esse?</p>
          <p className="mt-2 text-xl xl:text-2xl font-semibold">Da fundamental (R) até a nota marcada, para cima.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {q.options.map((s, i) => {
            const state = !done ? '' : s === q.semis ? 'ring-2 ring-led-green' : s === answer ? 'ring-2 ring-led-red opacity-80' : 'opacity-50'
            return (
              <Button key={s} variant="secondary" size="lg" className={`justify-start text-left ${state}`} onClick={() => choose(s)}>
                <Kbd>{i + 1}</Kbd>
                <span className="font-mono font-bold w-7">{INTERVALS[s].short}</span>
                <span className="text-sm">{INTERVALS[s].name}</span>
              </Button>
            )
          })}
        </div>
        <Button variant="ghost" onClick={hear}>
          <Volume2 className="size-4" aria-hidden /> Ouvir as duas notas <Kbd>espaço</Kbd>
        </Button>
      </div>
    </div>
  )
}
