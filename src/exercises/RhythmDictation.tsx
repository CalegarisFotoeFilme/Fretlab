import { Ear } from 'lucide-react'
import { Hint } from './Hint'
import { dictationHints } from './hints'
import { useEffect, useRef, useState } from 'react'
import { uiSound } from '../audio/engine'
import { RhythmStaff } from '../components/RhythmStaff'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { RhythmDictationSpec } from '../curriculum/types'
import { useInstrument } from '../progress/settings'
import { dictationRound, parsePattern, type DictationRound } from './generate'
import { previewPattern } from './Rhythm'
import type { ExerciseProps } from './types'

/** Ditado rítmico: ouvir um compasso e escolher a partitura certa entre até quatro. */
export function RhythmDictation({ spec, onRoundDone, round }: ExerciseProps<RhythmDictationSpec>) {
  const inst = useInstrument()
  const [q, setQ] = useState<DictationRound>(() => dictationRound(spec.patterns))
  const [chosen, setChosen] = useState<string | null>(null)
  const prev = useRef(round)
  const hear = (r = q) => previewPattern(parsePattern(r.answer), spec.bpm, inst.openMidi[0] + 12)

  useEffect(() => {
    const t = setTimeout(() => hear(), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (prev.current === round) return
    prev.current = round
    const next = dictationRound(spec.patterns, q)
    setQ(next)
    setChosen(null)
    const t = setTimeout(() => hear(next), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, spec])

  const choose = (p: string) => {
    if (chosen !== null) return
    setChosen(p)
    const ok = p === q.answer
    uiSound(ok ? 'ok' : 'miss')
    setTimeout(() => onRoundDone(ok ? 1 : 0), ok ? 1200 : 2400)
  }
  useHotkeys({ ...Object.fromEntries(q.options.map((p, i) => [String(i + 1), () => choose(p)])), ' ': () => hear() })

  return (
    <div className="mx-auto max-w-5xl flex flex-col items-center gap-5">
      <p className="eyebrow">Ditado rítmico: que ritmo você ouviu?</p>
      <button onClick={() => hear()} className="flex items-center gap-3 rounded-full border-2 border-enclosure/60 bg-enclosure/10 px-6 py-3 text-enclosure hover:bg-enclosure/20" aria-label="Ouvir de novo">
        <Ear className="size-6" aria-hidden /> Ouvir de novo <Kbd>espaço</Kbd>
      </button>
      <p className="text-sm text-pearl-dim">Um compasso de contagem (cliques) e depois o ritmo, numa nota só, a {spec.bpm} BPM.</p>
      <div className="grid w-full gap-3 md:grid-cols-2">
        {q.options.map((p, i) => {
          const state = chosen === null ? 'border-wood-700 hover:border-enclosure/60' : p === q.answer ? 'border-led-green ring-2 ring-led-green' : p === chosen ? 'border-led-red ring-2 ring-led-red' : 'border-wood-700 opacity-50'
          return (
            <button key={p} onClick={() => choose(p)} className={`panel relative p-3 text-left transition-colors ${state}`} aria-label={`Opção ${i + 1}`}>
              <span className="absolute left-3 top-3">
                <Kbd>{i + 1}</Kbd>
              </span>
              <RhythmStaff events={parsePattern(p)} showCounts={false} />
            </button>
          )
        })}
      </div>
      {chosen === null && (
        <Hint key={round} lines={dictationHints(parsePattern(q.answer).filter((e) => !e.rest).length, !parsePattern(q.answer)[0]?.rest)} />
      )}
    </div>
  )
}
