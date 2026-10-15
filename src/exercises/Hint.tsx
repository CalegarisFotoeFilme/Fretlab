import { Lightbulb } from 'lucide-react'
import { createContext, useContext, useEffect, useState } from 'react'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'

/*
  Dica do "professor": cada clique (ou H) revela a próxima dica da rodada, da mais leve
  (orienta o raciocínio) à mais forte (quase a resposta). Usar dica limita a rodada a 75%:
  ajuda a aprender sem virar atalho para as estrelas.
*/

export const HINT_CAP = 0.75

/** Avisado pelo ExerciseView: a rodada atual usou dica. */
export const HintContext = createContext<() => void>(() => {})

/** O exercício informa o fato que está sendo perguntado (para a revisão por fato errado). */
export const FactContext = createContext<(key: string, label: string) => void>(() => {})
/** Informa o fato da rodada atual: chave estável e um rótulo curto para a lista do Treino. */
export function useFact(key: string, label: string) {
  const report = useContext(FactContext)
  useEffect(() => report(key, label), [report, key, label])
}

/** Dicas da rodada. Use `key={round}` no componente para recomeçar a cada rodada. */
export function Hint({ lines, className = '' }: { lines: string[]; className?: string }) {
  const markUsed = useContext(HintContext)
  const [shown, setShown] = useState(0)
  const next = () => {
    if (shown >= lines.length) return
    setShown(shown + 1)
    markUsed()
  }
  useHotkeys({ h: next })
  if (!lines.length) return null
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {shown > 0 && (
        <ol className="flex flex-col gap-1.5 rounded-xl border border-led-amber/30 bg-led-amber/5 p-3 text-sm text-pearl/90" aria-live="polite">
          {lines.slice(0, shown).map((l, i) => (
            <li key={i} className="flex gap-2">
              <Lightbulb className="size-4 shrink-0 text-led-amber mt-0.5" aria-hidden />
              {l}
            </li>
          ))}
        </ol>
      )}
      {shown < lines.length && (
        <Button variant="ghost" onClick={next} className="self-center xl:self-start">
          <Lightbulb className="size-4" aria-hidden /> {shown ? 'Outra dica' : 'Dica'} <Kbd>H</Kbd>
        </Button>
      )}
    </div>
  )
}
