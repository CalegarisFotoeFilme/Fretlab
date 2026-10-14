import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { uiSound } from '../audio/engine'
import { Button } from '../components/ui'
import type { QuizSpec } from '../curriculum/types'
import { shuffle } from './generate'
import type { ExerciseProps } from './types'
import { Kbd, useHotkeys } from '../components/useHotkeys'

export function Quiz({ spec, onRoundDone, round }: ExerciseProps<QuizSpec>) {
  // ordem das perguntas sorteada uma vez por tentativa
  const order = useMemo(() => shuffle(spec.questions.map((_, i) => i)), [spec])
  const q = spec.questions[order[round % order.length]]
  const [answer, setAnswer] = useState<{ round: number; choice: number } | null>(null)
  const chosen = answer?.round === round ? answer.choice : null
  const correct = chosen === q.answer

  const choose = (i: number) => {
    if (chosen !== null) return
    setAnswer({ round, choice: i })
    uiSound(i === q.answer ? 'ok' : 'miss')
  }

  useHotkeys({
    ...Object.fromEntries(q.options.map((_, i) => [String(i + 1), () => choose(i)])),
    Enter: () => chosen !== null && onRoundDone(correct ? 1 : 0),
  })

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <p className="eyebrow text-center">Pergunta</p>
      <h2 className="font-sans text-2xl font-bold text-center leading-snug">{q.prompt}</h2>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const state =
            chosen === null ? '' : i === q.answer ? 'ring-2 ring-led-green' : i === chosen ? 'ring-2 ring-led-red' : 'opacity-50'
          return (
            <Button key={i} variant="secondary" size="lg" className={`justify-start text-left text-base ${state}`} onClick={() => choose(i)} aria-pressed={chosen === i}>
              <Kbd>{i + 1}</Kbd> {opt}
            </Button>
          )
        })}
      </div>
      {chosen !== null && (
        <div className="panel p-4 flex gap-3" role="status">
          {correct ? <Check className="size-5 text-led-green shrink-0" aria-hidden /> : <X className="size-5 text-led-red shrink-0" aria-hidden />}
          <div>
            <p className="font-semibold">{correct ? 'Isso!' : 'Quase.'}</p>
            <p className="text-pearl-dim">{q.explain}</p>
          </div>
        </div>
      )}
      {chosen !== null && (
        <Button size="lg" onClick={() => onRoundDone(correct ? 1 : 0)} autoFocus>
          Continuar <Kbd>enter</Kbd>
        </Button>
      )}
    </div>
  )
}
