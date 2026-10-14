import type { ExerciseSpec } from '../curriculum/types'
import { FindNote } from './FindNote'
import { HearChord, HearDegree } from './HearChord'
import { HearInterval } from './HearInterval'
import { NameInterval } from './NameInterval'
import { NameNote } from './NameNote'
import { NoteSet } from './NoteSet'
import { PlayInterval } from './PlayInterval'
import { Quiz } from './Quiz'
import { Rhythm } from './Rhythm'
import { RhythmDictation } from './RhythmDictation'
import { TheoryQuiz } from './TheoryQuiz'

/** Escolhe o componente do exercício pelo tipo (usado nas lições e no Treino do Dia). */
export function ExerciseView({ spec, round, onRoundDone }: { spec: ExerciseSpec; round: number; onRoundDone: (score: number) => void }) {
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
  }
}
