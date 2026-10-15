import { describe, expect, it } from 'vitest'
import { FACT_STEPS, dueFacts, nextFact } from './facts'

const DAY = 24 * 3600 * 1000
const fact = { key: 'pos:bass4:1:3', label: 'C · 3ª corda, casa 3', lessonId: 'w1-x' }

describe('revisão por fato errado', () => {
  it('acerto sem erro anterior não guarda nada', () => {
    expect(nextFact(undefined, fact, true, 0)).toBeNull()
  })
  it('erro volta hoje; acertos vencidos sobem 1, 3, 7 dias e depois sai', () => {
    let f = nextFact(undefined, fact, false, 0)!
    expect(f.due).toBe(0)
    let now = 0
    for (const [i, days] of FACT_STEPS.entries()) {
      f = nextFact(f, fact, true, now)!
      expect(f.box, `degrau ${i}`).toBe(i + 1)
      expect(f.due).toBe(now + days * DAY)
      now = f.due
    }
    expect(nextFact(f, fact, true, now)).toBeNull()
  })
  it('acertar antes de vencer não pula etapas; errar volta ao início', () => {
    const f = nextFact(nextFact(undefined, fact, false, 0)!, fact, true, 0)!
    expect(nextFact(f, fact, true, 1000)!.box).toBe(1)
    const miss = nextFact(f, fact, false, 2000)!
    expect([miss.box, miss.misses, miss.due]).toEqual([0, 2, 2000])
  })
  it('vencidos, os mais errados primeiro', () => {
    const a = { ...fact, key: 'a', misses: 1, box: 0, due: 0, lastAt: 0 }
    const b = { ...fact, key: 'b', misses: 3, box: 0, due: 0, lastAt: 0 }
    const c = { ...fact, key: 'c', misses: 5, box: 1, due: DAY, lastAt: 0 }
    expect(dueFacts([a, b, c], 10).map((f) => f.key)).toEqual(['b', 'a'])
  })
})
