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

/** Intervalos em semitons (1 = segunda menor … 12 = oitava). */
export type IntervalPool = number[]

/** O app marca a fundamental; você toca (ou clica) o intervalo pedido, para cima. */
export interface PlayIntervalSpec {
  type: 'play-interval'
  input: 'tap' | 'play'
  intervals: IntervalPool
  /** cordas onde a fundamental pode cair */
  strings: StringSel
  /** casas onde a fundamental pode cair */
  frets: FretRange
}

/** Duas notas marcadas no braço: qual é o intervalo? (reconhecer a forma) */
export interface NameIntervalSpec {
  type: 'name-interval'
  intervals: IntervalPool
  strings: StringSel
  frets: FretRange
}

/** O app toca duas notas: qual é o intervalo? (ouvido) */
export interface HearIntervalSpec {
  type: 'hear-interval'
  intervals: IntervalPool
  /** melódico = uma depois da outra; harmônico = juntas */
  mode: 'melodic' | 'harmonic' | 'both'
}

export type ExerciseSpec = FindNoteSpec | NameNoteSpec | RhythmSpec | QuizSpec | PlayIntervalSpec | NameIntervalSpec | HearIntervalSpec

export type TeachBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tip'; text: string }
  | { kind: 'open-strings' }
  | { kind: 'fretboard'; pool: NotePool; strings: StringSel; frets: FretRange; caption: string; octaves?: boolean }
  | { kind: 'rhythm'; pattern: string; caption: string }
  | { kind: 'figures' }
  /** forma de um intervalo no braço, a partir de uma fundamental na corda indicada (0 = mais grave) */
  | { kind: 'interval'; semitones: number; string?: number; caption: string }

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
  /** De onde vem a abordagem pedagógica (crédito; o texto do app é original). */
  approach?: string
  lessons: Lesson[]
  comingSoon?: boolean
}
