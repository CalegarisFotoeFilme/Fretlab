import type { FretRange, NotePool, StringSel } from '../curriculum/types'
import { findPositions, pcAt, type FretPos, type Instrument } from '../theory/instrument'
import { NATURALS, mod12, type PitchClass } from '../theory/notes'
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
