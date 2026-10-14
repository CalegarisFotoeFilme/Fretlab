import { useState } from 'react'
import type { QuizSpec, TheoryQuizSpec } from '../curriculum/types'
import { useNoteName } from '../progress/settings'
import { theoryQuestion } from './generate'
import { Quiz } from './Quiz'
import type { ExerciseProps } from './types'

/** Perguntas de teoria sorteadas (tons, acordes, graus), mostradas com a mesma cara do quiz. */
export function TheoryQuiz({ spec, ...props }: ExerciseProps<TheoryQuizSpec>) {
  const noteName = useNoteName()
  // gera um lote por tentativa; o Quiz percorre na ordem das rodadas
  const [quiz] = useState<QuizSpec>(() => ({ type: 'quiz', questions: Array.from({ length: 40 }, () => theoryQuestion(spec, noteName)) }))
  return <Quiz spec={quiz} {...props} />
}
