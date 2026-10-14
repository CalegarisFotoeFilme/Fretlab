import { Ear, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { playInterval, uiSound } from '../audio/engine'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { HearIntervalSpec } from '../curriculum/types'
import { useInstrument } from '../progress/settings'
import { INTERVALS } from '../theory/notes'
import { hearIntervalRound, type HearIntervalRound } from './generate'
import type { ExerciseProps } from './types'

/** O app toca duas notas e a pessoa diz o intervalo, só de ouvido. */
export function HearInterval({ spec, onRoundDone, round }: ExerciseProps<HearIntervalSpec>) {
  const inst = useInstrument()
  const [q, setQ] = useState<HearIntervalRound>(() => hearIntervalRound(inst, spec.intervals, spec.mode))
  const [answer, setAnswer] = useState<number | null>(null)
  const prevRound = useRef(round)

  const hear = (r = q) => playInterval(r.root, r.semis, r.harmonic)

  // a primeira rodada também começa tocando
  useEffect(() => {
    const t = setTimeout(() => hear(), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    const next = hearIntervalRound(inst, spec.intervals, spec.mode, q)
    setQ(next)
    setAnswer(null)
    const t = setTimeout(() => hear(next), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, inst, spec])

  const choose = (semis: number) => {
    if (answer !== null) return
    setAnswer(semis)
    const ok = semis === q.semis
    uiSound(ok ? 'ok' : 'miss')
    // depois de responder, ouve de novo em sequência para fixar o som com o nome
    setTimeout(() => playInterval(q.root, q.semis, false), 300)
    setTimeout(() => onRoundDone(ok ? 1 : 0), ok ? 1500 : 2400)
  }

  useHotkeys({ ...Object.fromEntries(q.options.map((s, i) => [String(i + 1), () => choose(s)])), ' ': () => hear() })
  const done = answer !== null

  return (
    <div className="mx-auto max-w-3xl flex flex-col items-center gap-6 text-center">
      <p className="eyebrow">Que intervalo você ouviu?</p>
      <button
        onClick={() => hear()}
        className="grid place-items-center size-40 rounded-full border-2 border-enclosure/60 bg-enclosure/10 text-enclosure hover:bg-enclosure/20 transition-colors"
        aria-label="Ouvir de novo"
      >
        <Ear className="size-16" aria-hidden />
      </button>
      <p className="text-pearl-dim">
        {q.harmonic ? 'As duas notas juntas (harmônico).' : 'Uma nota depois da outra, subindo (melódico).'} Clique ou aperte <Kbd>espaço</Kbd> para ouvir de novo.
      </p>
      <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-2.5">
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
      {done && (
        <p className="text-sm text-pearl-dim">
          Era {INTERVALS[q.semis].name.toLowerCase()} ({q.semis} {q.semis === 1 ? 'semitom' : 'semitons'}).{' '}
          <button className="underline text-enclosure" onClick={() => playInterval(q.root, q.semis, true)}>
            <Volume2 className="inline size-3.5" aria-hidden /> ouvir as duas juntas
          </button>
        </p>
      )}
    </div>
  )
}
