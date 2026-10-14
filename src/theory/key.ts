import { mod12, type PitchClass } from './notes'

// Perfis de Krumhansl-Kessler: quanto cada grau "pertence" a uma tonalidade.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

export interface KeyGuess {
  root: PitchClass
  mode: 'major' | 'minor'
  score: number
}

function correlation(a: number[], b: number[]) {
  const ma = a.reduce((s, v) => s + v, 0) / a.length
  const mb = b.reduce((s, v) => s + v, 0) / b.length
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  return da && db ? num / Math.sqrt(da * db) : 0
}

/** Estima a tonalidade a partir de um histograma de classes de altura (peso por duração). */
export function estimateKey(histogram: number[]): KeyGuess[] {
  const out: KeyGuess[] = []
  for (let r = 0; r < 12; r++) {
    const rotated = histogram.map((_, i) => histogram[mod12(i + r)])
    out.push({ root: r, mode: 'major', score: correlation(rotated, MAJOR) })
    out.push({ root: r, mode: 'minor', score: correlation(rotated, MINOR) })
  }
  return out.sort((a, b) => b.score - a.score)
}

export function histogramOf(notes: { midi: number; weight?: number }[]) {
  const h = new Array(12).fill(0)
  for (const n of notes) h[mod12(n.midi)] += n.weight ?? 1
  return h
}
