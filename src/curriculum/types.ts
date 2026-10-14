import type { PitchClass } from '../theory/notes'

/** Índices de corda a partir da mais grave (0). 'all' = todas. */
export type StringSel = 'all' | number[]
export type NotePool = 'naturals' | 'all' | PitchClass[]
export interface FretRange {
  from: number
  to: number
}

export interface FindNoteSpec {
  type: 'find-note'
  input: 'tap' | 'play'
  pool: NotePool
  strings: StringSel
  frets: FretRange
}

export interface NameNoteSpec {
  type: 'name-note'
  pool: NotePool
  strings: StringSel
  frets: FretRange
  choices: number
}

export interface RhythmSpec {
  type: 'rhythm'
  input: 'tap' | 'play'
  bpm: number
  /** Notação compacta: w h q e s; prefixo r = pausa. Ex.: "q e e rq q" */
  patterns: string[]
}

export interface QuizQuestion {
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export interface QuizSpec {
  type: 'quiz'
  questions: QuizQuestion[]
}

export type ExerciseSpec = FindNoteSpec | NameNoteSpec | RhythmSpec | QuizSpec

export type TeachBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tip'; text: string }
  | { kind: 'open-strings' }
  | { kind: 'fretboard'; pool: NotePool; strings: StringSel; frets: FretRange; caption: string; octaves?: boolean }
  | { kind: 'rhythm'; pattern: string; caption: string }
  | { kind: 'figures' }

export interface Lesson {
  id: string
  title: string
  summary: string
  teach: TeachBlock[]
  exercise: ExerciseSpec
  rounds: number
}

export interface World {
  id: string
  title: string
  tagline: string
  lessons: Lesson[]
  comingSoon?: boolean
}
