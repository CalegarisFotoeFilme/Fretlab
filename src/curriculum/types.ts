import type { ChordQuality, PitchClass, ScaleId } from '../theory/notes'

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

/** Conjunto de notas a partir de uma fundamental: uma escala ou um acorde (arpejo). */
export type NoteSetSource = { scale: ScaleId } | { chord: ChordQuality }

/**
 * Onde fica a "caixa" (posição) em relação à fundamental: a fundamental cai na corda `string`
 * (0 = mais grave), e a posição vai da casa (fundamental + offset) até (+ width).
 */
export interface ShapeAnchor {
  string: number
  offset: number
  width: number
  /** nome da forma, ex.: "forma de E" */
  name?: string
}

/** Encontrar todas as notas de uma escala/acorde dentro de uma posição do braço. */
export interface NoteSetSpec {
  type: 'note-set'
  input: 'tap' | 'play'
  shapes: { set: NoteSetSource; anchor: ShapeAnchor }[]
  roots: NotePool
  /** casas onde a fundamental pode cair na corda âncora */
  frets: FretRange
}

/** Ouvir um acorde e dizer o tipo (maior, menor, 7…). */
export interface HearChordSpec {
  type: 'hear-chord'
  qualities: ChordQuality[]
  /** arpejado (nota a nota) em vez de plaqueado */
  arpeggio?: boolean
}

/** Ouvir a tônica e depois outro acorde do campo: qual é o grau? */
export interface HearDegreeSpec {
  type: 'hear-degree'
  mode: 'major' | 'minor'
  /** graus possíveis (1..7) */
  degrees: number[]
}

/** Ditado rítmico: o app toca um ritmo, a pessoa escolhe a partitura certa. */
export interface RhythmDictationSpec {
  type: 'rhythm-dictation'
  bpm: number
  /** padrões possíveis (notação de RhythmSpec); cada rodada sorteia um e mostra até 4 opções */
  patterns: string[]
}

/** Ler uma nota na pauta (clave do instrumento) e responder pelo nome, no braço ou tocando. */
export interface ReadNoteSpec {
  type: 'read-note'
  answer: 'name' | 'fretboard' | 'play'
  pool: NotePool
  strings: StringSel
  frets: FretRange
}

export type TheoryAsk = 'chord-of-degree' | 'degree-of-chord' | 'function' | 'relative' | 'spell-chord' | 'scale-notes' | 'progression'

/** Perguntas de teoria geradas a cada rodada (tons e acordes sorteados). */
export interface TheoryQuizSpec {
  type: 'theory-quiz'
  asks: TheoryAsk[]
  keys: PitchClass[]
  mode: 'major' | 'minor' | 'both'
  /** tipos de acorde para 'spell-chord' */
  qualities?: ChordQuality[]
}

export type ExerciseSpec =
  | FindNoteSpec
  | NameNoteSpec
  | RhythmSpec
  | QuizSpec
  | PlayIntervalSpec
  | NameIntervalSpec
  | HearIntervalSpec
  | NoteSetSpec
  | HearChordSpec
  | HearDegreeSpec
  | TheoryQuizSpec
  | RhythmDictationSpec
  | ReadNoteSpec

export type TeachBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tip'; text: string }
  | { kind: 'open-strings' }
  | { kind: 'fretboard'; pool: NotePool; strings: StringSel; frets: FretRange; caption: string; octaves?: boolean }
  | { kind: 'rhythm'; pattern: string; caption: string }
  | { kind: 'figures' }
  /** forma de um intervalo no braço, a partir de uma fundamental na corda indicada (0 = mais grave) */
  | { kind: 'interval'; semitones: number; string?: number; caption: string }
  /** fórmula de uma escala/acorde: notas, graus, passos (T/S) e som */
  | { kind: 'formula'; set: NoteSetSource; root: PitchClass; caption?: string }
  /** mapa das notas de uma escala/acorde no braço, com a fundamental destacada (e a posição, se houver) */
  | { kind: 'map'; set: NoteSetSource; root: PitchClass; from?: number; to?: number; anchor?: ShapeAnchor; caption: string }
  /** campo harmônico de um tom, com funções e som */
  | { kind: 'field'; root: PitchClass; mode: 'major' | 'minor'; sevenths?: boolean; caption?: string }
  /** notas na pauta, na clave do instrumento: as cordas soltas ou as notas naturais de uma corda */
  | { kind: 'staff'; notes: 'open-strings' | { string: number; frets: number[] }; caption: string }

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
