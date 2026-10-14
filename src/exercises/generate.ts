import type { FretRange, NotePool, NoteSetSource, NoteSetSpec, QuizQuestion, ShapeAnchor, StringSel, TheoryQuizSpec } from '../curriculum/types'
import { findPositions, midiAt, pcAt, type FretPos, type Instrument } from '../theory/instrument'
import {
  CHORDS, INTERVALS, NATURALS, SCALES, chordNotes, harmonicField, mod12, prefersFlats, scaleNotes,
  type ChordQuality, type PitchClass, type ScaleId,
} from '../theory/notes'
import type { Figure, RhythmEvent } from './rhythmScore'

export type Rng = () => number
export const pick = <T,>(arr: readonly T[], rng: Rng = Math.random) => arr[Math.floor(rng() * arr.length)]

export function shuffle<T>(arr: T[], rng: Rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function resolvePool(pool: NotePool): PitchClass[] {
  if (pool === 'naturals') return NATURALS
  if (pool === 'all') return Array.from({ length: 12 }, (_, i) => i)
  return pool
}

export function resolveStrings(inst: Instrument, sel: StringSel) {
  const n = inst.openMidi.length
  return sel === 'all' ? Array.from({ length: n }, (_, i) => i) : sel.filter((s) => s < n)
}

export interface FindNoteRound {
  pc: PitchClass
  strings: number[] // cordas onde vale responder
  targets: FretPos[]
}

/** Sorteia uma nota que exista nas cordas/casas pedidas, evitando repetir a anterior. */
export function findNoteRound(
  inst: Instrument, pool: NotePool, sel: StringSel, frets: FretRange, prev?: FindNoteRound, rng: Rng = Math.random,
): FindNoteRound {
  const strings = resolveStrings(inst, sel)
  // Se há mais de uma corda, cada rodada pede uma corda específica (exceto quando é "todas").
  const askString = sel !== 'all' && strings.length > 1
  for (let tries = 0; tries < 30; tries++) {
    const pc = pick(resolvePool(pool), rng)
    const chosen = askString ? [pick(strings, rng)] : strings
    const targets = findPositions(inst, pc, frets.to, frets.from).filter((p) => chosen.includes(p.string))
    if (!targets.length) continue
    if (prev && prev.pc === pc && tries < 29) continue
    return { pc, strings: chosen, targets }
  }
  throw new Error('Nenhuma nota disponível para esse exercício')
}

export interface NameNoteRound {
  pos: FretPos
  pc: PitchClass
  options: PitchClass[]
}

export function nameNoteRound(
  inst: Instrument, pool: NotePool, sel: StringSel, frets: FretRange, choices: number, prev?: NameNoteRound, rng: Rng = Math.random,
): NameNoteRound {
  const strings = resolveStrings(inst, sel)
  const allowed = resolvePool(pool)
  for (let tries = 0; tries < 50; tries++) {
    const pos = { string: pick(strings, rng), fret: frets.from + Math.floor(rng() * (frets.to - frets.from + 1)) }
    const pc = pcAt(inst, pos)
    if (!allowed.includes(pc)) continue
    if (prev && prev.pos.string === pos.string && prev.pos.fret === pos.fret && tries < 49) continue
    // distratores: vizinhos próximos confundem mais do que notas aleatórias
    const near = shuffle([1, -1, 2, -2, 3, 5, -5].map((d) => mod12(pc + d)), rng)
    const distractors = [...new Set(near)].filter((d) => d !== pc).slice(0, choices - 1)
    return { pos, pc, options: shuffle([pc, ...distractors], rng) }
  }
  throw new Error('Nenhuma posição disponível para esse exercício')
}

// ---------- Intervalos ----------

/** Quantas casas a mão alcança a partir da fundamental, para a forma ser tocável sem mudar de posição. */
export const HAND_SPAN = 4

/** Posições do intervalo (para cima) ao alcance da mão: na mesma corda ou nas mais agudas. */
export function intervalTargets(inst: Instrument, root: FretPos, semis: number, span = HAND_SPAN): FretPos[] {
  const want = midiAt(inst, root) + semis
  return inst.openMidi.flatMap((open, string) => {
    const fret = want - open
    const ok = string >= root.string && fret >= 0 && fret <= inst.frets && Math.abs(fret - root.fret) <= span
    return ok ? [{ string, fret }] : []
  })
}

export interface IntervalRound {
  root: FretPos
  semis: number
  /** onde o intervalo pode ser tocado a partir dessa fundamental */
  targets: FretPos[]
}

/** Sorteia fundamental e intervalo com pelo menos uma forma tocável, evitando repetir a rodada anterior. */
export function intervalRound(
  inst: Instrument, intervals: number[], sel: StringSel, frets: FretRange, prev?: IntervalRound, rng: Rng = Math.random,
): IntervalRound {
  const strings = resolveStrings(inst, sel)
  for (let tries = 0; tries < 80; tries++) {
    const semis = pick(intervals, rng)
    const root = { string: pick(strings, rng), fret: frets.from + Math.floor(rng() * (frets.to - frets.from + 1)) }
    const targets = intervalTargets(inst, root, semis)
    if (!targets.length) continue
    if (prev && prev.semis === semis && prev.root.string === root.string && prev.root.fret === root.fret && tries < 79) continue
    return { root, semis, targets }
  }
  throw new Error('Nenhum intervalo tocável para esse exercício')
}

/** Opções de resposta: a certa + vizinhas (as que mais confundem), no máximo `max`, em ordem crescente. */
export function intervalOptions(answer: number, pool: number[], max = 6, rng: Rng = Math.random): number[] {
  if (pool.length <= max) return [...pool].sort((a, b) => a - b)
  const others = shuffle(pool.filter((p) => p !== answer), rng).sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer))
  return [answer, ...others.slice(0, max - 1)].sort((a, b) => a - b)
}

export interface HearIntervalRound {
  root: number // midi
  semis: number
  harmonic: boolean
  options: number[]
}

/** Fundamental numa região confortável de ouvir para o instrumento (um pouco acima da corda mais grave). */
export function hearIntervalRound(inst: Instrument, intervals: number[], mode: 'melodic' | 'harmonic' | 'both', prev?: HearIntervalRound, rng: Rng = Math.random): HearIntervalRound {
  const low = Math.max(inst.openMidi[0] + 5, 40)
  for (let tries = 0; ; tries++) {
    const semis = pick(intervals, rng)
    if (prev && prev.semis === semis && intervals.length > 1 && tries < 20) continue
    const root = low + Math.floor(rng() * 10)
    const harmonic = mode === 'harmonic' || (mode === 'both' && rng() < 0.5)
    return { root, semis, harmonic, options: intervalOptions(semis, intervals, 6, rng) }
  }
}

// ---------- Ritmo ----------

const FIG: Record<string, Figure> = { w: 'whole', h: 'half', q: 'quarter', e: 'eighth', s: 'sixteenth' }

export function parsePattern(src: string): RhythmEvent[] {
  return src.trim().split(/\s+/).map((tok) => {
    const rest = tok.startsWith('r')
    const f = FIG[rest ? tok.slice(1) : tok]
    if (!f) throw new Error(`Figura inválida: ${tok}`)
    return rest ? { figure: f, rest: true } : { figure: f }
  })
}

// ---------- Escalas, arpejos e formas (desenhe no braço) ----------

export const setPcs = (root: PitchClass, set: NoteSetSource): PitchClass[] =>
  'scale' in set ? scaleNotes(root, set.scale) : chordNotes(root, set.chord)

export const setName = (set: NoteSetSource) => ('scale' in set ? SCALES[set.scale].name : CHORDS[set.chord].name)

export interface NoteSetRound {
  root: PitchClass
  set: NoteSetSource
  anchor: ShapeAnchor
  rootPos: FretPos
  from: number
  to: number
  /** todas as posições da escala/acorde dentro da posição */
  targets: FretPos[]
}

/** Posições (todas as cordas) de um conjunto de notas entre as casas `from` e `to`. */
export function setPositions(inst: Instrument, pcs: PitchClass[], from: number, to: number): FretPos[] {
  return pcs.flatMap((pc) => findPositions(inst, pc, to, from))
}

/** Sorteia fundamental + forma com a posição inteira dentro do braço e pelo menos 3 notas para achar. */
export function noteSetRound(inst: Instrument, spec: Pick<NoteSetSpec, 'shapes' | 'roots' | 'frets'>, prev?: NoteSetRound, rng: Rng = Math.random): NoteSetRound {
  const pool = resolvePool(spec.roots)
  for (let tries = 0; tries < 120; tries++) {
    const { set, anchor } = pick(spec.shapes, rng)
    if (anchor.string >= inst.openMidi.length) continue
    const root = pick(pool, rng)
    const frets = findPositions(inst, root, spec.frets.to, spec.frets.from).filter((p) => p.string === anchor.string)
    if (!frets.length) continue
    const rootPos = pick(frets, rng)
    const from = rootPos.fret + anchor.offset
    const to = from + anchor.width
    if (from < 0 || to > inst.frets) continue
    const targets = setPositions(inst, setPcs(root, set), from, to)
    if (targets.length < 3) continue
    if (prev && prev.root === root && prev.anchor === anchor && prev.rootPos.fret === rootPos.fret && tries < 119) continue
    return { root, set, anchor, rootPos, from, to, targets }
  }
  throw new Error('Nenhuma forma cabe no braço para esse exercício')
}

// ---------- Acordes e graus de ouvido ----------

export interface HearChordRound {
  root: number // midi
  quality: ChordQuality
  options: ChordQuality[]
}

export function hearChordRound(inst: Instrument, qualities: ChordQuality[], prev?: HearChordRound, rng: Rng = Math.random): HearChordRound {
  const low = Math.max(inst.openMidi[0] + 5, 43)
  let quality = pick(qualities, rng)
  if (prev && qualities.length > 1) while (quality === prev.quality && rng() < 0.7) quality = pick(qualities, rng)
  return { root: low + Math.floor(rng() * 8), quality, options: qualities }
}

/** Notas (midi) de um acorde a partir da fundamental, em posição fechada. */
export const chordMidis = (root: number, quality: ChordQuality) => CHORDS[quality].formula.map((s) => root + s)

export interface HearDegreeRound {
  key: PitchClass
  degree: number // 1..7
  options: number[]
}

export function hearDegreeRound(degrees: number[], prev?: HearDegreeRound, rng: Rng = Math.random): HearDegreeRound {
  let degree = pick(degrees, rng)
  if (prev && degrees.length > 1) while (degree === prev.degree && rng() < 0.7) degree = pick(degrees, rng)
  return { key: Math.floor(rng() * 12), degree, options: [...degrees].sort((a, b) => a - b) }
}

/** Acordes (midi, posição fechada a partir da região média) de um grau do campo harmônico. */
export function degreeChordMidis(key: PitchClass, mode: 'major' | 'minor', degree: number) {
  const d = harmonicField(key, mode)[degree - 1]
  const base = 48 + mod12(d.root - 0)
  return chordMidis(base > 55 ? base - 12 : base, d.quality)
}

// ---------- Quiz de teoria gerado ----------

export type NameFn = (pc: PitchClass, flats?: boolean) => string

const FUNCTIONS = ['tônica', 'subdominante', 'dominante'] as const

/** Uma pergunta de teoria sorteada (tons e acordes), com explicação. */
export function theoryQuestion(spec: Pick<TheoryQuizSpec, 'asks' | 'keys' | 'mode' | 'qualities'>, name: NameFn, rng: Rng = Math.random): QuizQuestion {
  const ask = pick(spec.asks, rng)
  const mode: 'major' | 'minor' = spec.mode === 'both' ? (rng() < 0.5 ? 'major' : 'minor') : spec.mode
  const key = pick(spec.keys, rng)
  const flats = prefersFlats(key, mode)
  const field = harmonicField(key, mode)
  const keyLabel = `${name(key, flats)} ${mode === 'major' ? 'maior' : 'menor'}`
  const cname = (d: (typeof field)[number]) => name(d.root, flats) + CHORDS[d.quality].symbol
  const options4 = <T,>(answer: T, others: T[]) => {
    const opts = shuffle([answer, ...shuffle(others.filter((o) => o !== answer), rng).slice(0, 3)], rng)
    return { options: opts, answer: opts.indexOf(answer) }
  }
  switch (ask) {
    case 'chord-of-degree': {
      const d = pick(field, rng)
      const o = options4(cname(d), field.map(cname))
      return { prompt: `Em ${keyLabel}, qual é o acorde do grau ${d.roman}?`, ...o, explain: `O campo de ${keyLabel}: ${field.map((f) => `${f.roman} = ${cname(f)}`).join(', ')}.` }
    }
    case 'degree-of-chord': {
      const d = pick(field, rng)
      const o = options4(d.roman, field.map((f) => f.roman))
      return { prompt: `Em ${keyLabel}, ${cname(d)} é qual grau?`, ...o, explain: `${cname(d)} nasce na ${d.degree}ª nota da escala de ${keyLabel}: grau ${d.roman}.` }
    }
    case 'function': {
      const d = pick(field, rng)
      const fn = (['tônica', 'subdominante', 'tônica', 'subdominante', 'dominante', 'tônica', 'dominante'] as const)[d.degree - 1]
      const opts = [...FUNCTIONS]
      return {
        prompt: `Em ${keyLabel}, que função tem ${cname(d)} (${d.roman})?`,
        options: opts,
        answer: opts.indexOf(fn),
        explain: 'I, iii e vi repousam (tônica); ii e IV afastam (subdominante); V e vii° criam tensão que pede a tônica (dominante).',
      }
    }
    case 'relative': {
      const rel = mode === 'major' ? mod12(key - 3) : mod12(key + 3)
      const relMode = mode === 'major' ? 'menor' : 'maior'
      const answer = `${name(rel, flats)} ${relMode}`
      const others = [mod12(key + 4), mod12(key - 4), mod12(key + 5), mod12(key + 7), mod12(key + 2)].map((pc) => `${name(pc, flats)} ${relMode}`)
      const o = options4(answer, others)
      return {
        prompt: `Qual é o relativo ${relMode} de ${keyLabel}?`,
        ...o,
        explain: `Relativos usam as mesmas notas. O relativo menor fica uma terça menor abaixo (3 casas); o maior, 3 casas acima.`,
      }
    }
    case 'spell-chord': {
      const quality: ChordQuality = pick(spec.qualities ?? (['maj', 'min'] as ChordQuality[]), rng)
      const spell = (r: PitchClass, q: ChordQuality) => chordNotes(r, q).map((pc) => name(pc, flats)).join(' – ')
      const answer = spell(key, quality)
      const others = (Object.keys(CHORDS) as ChordQuality[]).filter((q) => q !== quality && CHORDS[q].formula.length === CHORDS[quality].formula.length).map((q) => spell(key, q))
      const o = options4(answer, others.length >= 3 ? others : [...others, spell(mod12(key + 2), quality), spell(mod12(key + 7), quality)])
      const formula = CHORDS[quality].formula.map((s) => INTERVALS[s].short).join('-')
      return { prompt: `Quais notas formam ${name(key, flats)}${CHORDS[quality].symbol}?`, ...o, explain: `${CHORDS[quality].name}: fórmula ${formula} a partir de ${name(key, flats)}.` }
    }
    case 'scale-notes': {
      const scale: ScaleId = mode === 'major' ? 'major' : 'minor'
      const spell = (r: PitchClass, s: ScaleId) => scaleNotes(r, s).map((pc) => name(pc, flats)).join(' ')
      const answer = spell(key, scale)
      const o = options4(answer, [spell(key, scale === 'major' ? 'minor' : 'major'), spell(key, 'mixolydian'), spell(key, 'dorian'), spell(mod12(key + 7), scale)])
      return { prompt: `Quais são as notas da escala de ${keyLabel}?`, ...o, explain: `${SCALES[scale].name}: ${SCALES[scale].steps.map((s) => INTERVALS[s].short).join(' ')}.` }
    }
    case 'progression': {
      const romans = mode === 'major' ? [[1, 5, 6, 4], [2, 5, 1], [1, 4, 5, 1], [1, 6, 4, 5]] : [[1, 6, 3, 7], [1, 4, 5, 1], [1, 7, 6, 7]]
      const prog = pick(romans, rng)
      const label = prog.map((n) => field[n - 1].roman).join(' – ')
      const chords = (p: number[], f = field) => p.map((n) => cname(f[n - 1])).join(' – ')
      const answer = chords(prog)
      const others = [chords(prog, harmonicField(mod12(key + 7), mode)), chords(prog, harmonicField(mod12(key + 5), mode)), chords([...prog].reverse()), chords(prog.map((n) => (n % 7) + 1))]
      const o = options4(answer, others)
      return { prompt: `Em ${keyLabel}, quais acordes formam ${label}?`, ...o, explain: `Troque cada grau pelo acorde do campo: ${prog.map((n) => `${field[n - 1].roman} = ${cname(field[n - 1])}`).join(', ')}.` }
    }
  }
}
