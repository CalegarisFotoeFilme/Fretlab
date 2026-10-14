import { describe, expect, it } from 'vitest'
import { detectChord, findProgression, fittingScales, functionOf, isDiatonic, restingNote, romanOf } from './analysis'

const A = 9
const C = 0
const E = 4
const F = 5
const G = 7

/** Histograma a partir de pares [classe de altura, peso]. */
const hist = (...pairs: [number, number][]) => {
  const h = new Array(12).fill(0)
  for (const [pc, w] of pairs) h[pc] += w
  return h
}

describe('análise harmônica', () => {
  it('reconhece tríades, power chords e tétrades', () => {
    expect(detectChord(hist([A, 4], [C, 2], [E, 2]))).toMatchObject({ root: A, quality: 'min' })
    expect(detectChord(hist([E, 4], [11, 3]))).toMatchObject({ root: E, quality: 'pow' }) // E5
    expect(detectChord(hist([G, 3], [11, 2], [2, 2], [F, 2]))).toMatchObject({ root: G, quality: 'dom7' })
    // uma nota de passagem curta não vira sétima
    expect(detectChord(hist([C, 4], [E, 3], [G, 3], [11, 0.3]))).toMatchObject({ root: C, quality: 'maj' })
    expect(detectChord(hist())).toBeNull()
  })

  it('o baixo desempata acordes com as mesmas notas', () => {
    // C E G A: C6 ou Am7 — com A no baixo, Am7
    const h = hist([C, 2], [E, 2], [G, 2], [A, 2])
    expect(detectChord(h, hist([A, 4]))).toMatchObject({ root: A, quality: 'min7' })
  })

  it('dá o grau e a função do acorde', () => {
    const cMaj = { root: C, mode: 'major' } as const
    const aMin = { root: A, mode: 'minor' } as const
    expect(romanOf(A, 'min', cMaj)).toBe('vi')
    expect(romanOf(G, 'dom7', cMaj)).toBe('V7')
    expect(romanOf(10, 'maj', cMaj)).toBe('bVII') // Bb em Dó: empréstimo modal
    expect(romanOf(F, 'maj', aMin)).toBe('VI')
    expect(romanOf(E, 'maj', aMin)).toBe('V') // dominante maior na menor harmônica
    expect(romanOf(E, 'pow', aMin)).toBe('V5')
    expect(isDiatonic(10, 'maj', cMaj)).toBe(false)
    expect(isDiatonic(F, 'maj', aMin)).toBe(true)
    expect(functionOf(G, cMaj)).toBe('dominante')
    expect(functionOf(F, cMaj)).toBe('subdominante')
    expect(functionOf(A, cMaj)).toBe('tônica')
  })

  it('acha a nota de repouso', () => {
    const r = restingNote([
      { midi: 64, dur: 1, pos: 0 },
      { midi: 62, dur: 1, pos: 0.25 },
      { midi: 60, dur: 2, pos: 0.5 },
    ])
    expect(r?.midi).toBe(60)
  })

  it('sugere escalas que contêm as notas', () => {
    const h = hist([A, 3], [C, 2], [2, 1], [E, 2], [G, 1]) // A C D E G
    const fits = fittingScales(h, [A, C])
    expect(fits[0]).toMatchObject({ root: A, scale: 'minorPentatonic' })
    expect(fits.some((f) => f.root === C && f.scale === 'majorPentatonic')).toBe(true)
    expect(fits.every((f) => f.fit >= 0.97)).toBe(true)
    // com o tom de contexto (Si menor), uma nota só não sugere pentatônica maior primeiro
    const bMinor = [11, 1, 2, 4, 6, 7, 9]
    const one = fittingScales(hist([11, 4], [2, 0.4], [6, 0.4]), [11], bMinor)
    expect(one[0]).toMatchObject({ root: 11, scale: 'minorPentatonic' })
  })

  it('encontra a progressão que se repete', () => {
    const bars = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', null, 'E']
    expect(findProgression(bars)).toEqual({ start: 0, length: 4, count: 3 })
    expect(findProgression(['E5', 'E5', 'E5'])).toBeNull()
  })
})
