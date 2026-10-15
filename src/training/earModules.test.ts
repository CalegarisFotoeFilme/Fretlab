import { describe, expect, it } from 'vitest'
import { ALL_EAR, EAR_MODULES, nextEarQuestion } from './earModules'

describe('treino de intervalos de ouvido', () => {
  it('seis módulos de dois intervalos, sem repetir intervalo', () => {
    expect(EAR_MODULES).toHaveLength(6)
    for (const m of EAR_MODULES) expect([m.intervals.length, m.labels.length]).toEqual([2, 2])
    expect(new Set(ALL_EAR.intervals).size).toBe(12)
    expect(ALL_EAR.labels).toHaveLength(12)
  })
  it('não repete o mesmo intervalo três vezes seguidas', () => {
    const q = nextEarQuestion([4, 7], 'melodic', [4, 4], () => 0)
    expect(q.semis).toBe(7)
    expect(q.harmonic).toBe(false)
  })
  it('modo juntas é sempre harmônico', () => {
    for (let i = 0; i < 20; i++) expect(nextEarQuestion([1, 6], 'harmonic', []).harmonic).toBe(true)
  })
})
