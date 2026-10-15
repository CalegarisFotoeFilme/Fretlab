import { useCallback, useRef } from 'react'
import { recordFact } from '../progress/facts'
import type { ExerciseSpec } from '../curriculum/types'
import { FactContext, HINT_CAP, HintContext } from './Hint'
import { FindNote } from './FindNote'
import { HearChord, HearDegree } from './HearChord'
import { HearInterval } from './HearInterval'
import { NameInterval } from './NameInterval'
import { NameNote } from './NameNote'
import { NoteSet } from './NoteSet'
import { PlayInterval } from './PlayInterval'
import { Quiz } from './Quiz'
import { ReadNote } from './ReadNote'
import { Rhythm } from './Rhythm'
import { RhythmDictation } from './RhythmDictation'
import { TheoryQuiz } from './TheoryQuiz'

/** Escolhe o componente do exercício pelo tipo (usado nas lições e no Treino do Dia). */
export function ExerciseView({ spec, round, onRoundDone, lessonId }: { spec: ExerciseSpec; round: number; onRoundDone: (score: number) => void; lessonId?: string }) {
  // rodada com dica vale no máximo 75%
  const hinted = useRef(-1)
  // fato perguntado nesta rodada (o exercício informa com useFact)
  const fact = useRef<{ key: string; label: string } | null>(null)
  const reportFact = useCallback((key: string, label: string) => {
    fact.current = { key, label }
  }, [])
  const props = {
    round,
    onRoundDone: (score: number) => {
      const final = hinted.current === round ? Math.min(score, HINT_CAP) : score
      // com dica conta como erro: o fato ainda não está firme
      if (lessonId && fact.current) void recordFact({ ...fact.current, lessonId }, final >= 0.99)
      onRoundDone(final)
    },
  }
  return (
    <HintContext.Provider value={() => (hinted.current = round)}>
      <FactContext.Provider value={reportFact}>
        <Exercise spec={spec} {...props} />
      </FactContext.Provider>
    </HintContext.Provider>
  )
}

function Exercise({ spec, round, onRoundDone }: { spec: ExerciseSpec; round: number; onRoundDone: (score: number) => void }) {
  const props = { round, onRoundDone }
  switch (spec.type) {
    case 'find-note':
      return <FindNote spec={spec} {...props} />
    case 'name-note':
      return <NameNote spec={spec} {...props} />
    case 'quiz':
      return <Quiz spec={spec} {...props} />
    case 'rhythm':
      return <Rhythm spec={spec} {...props} />
    case 'play-interval':
      return <PlayInterval spec={spec} {...props} />
    case 'name-interval':
      return <NameInterval spec={spec} {...props} />
    case 'hear-interval':
      return <HearInterval spec={spec} {...props} />
    case 'note-set':
      return <NoteSet spec={spec} {...props} />
    case 'hear-chord':
      return <HearChord spec={spec} {...props} />
    case 'hear-degree':
      return <HearDegree spec={spec} {...props} />
    case 'theory-quiz':
      return <TheoryQuiz spec={spec} {...props} />
    case 'rhythm-dictation':
      return <RhythmDictation spec={spec} {...props} />
    case 'read-note':
      return <ReadNote spec={spec} {...props} />
  }
}
