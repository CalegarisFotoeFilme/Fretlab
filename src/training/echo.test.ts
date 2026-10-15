import { describe, expect, it } from 'vitest'
import { parsePattern } from '../exercises/generate'
import { onsetBeats } from '../exercises/rhythmScore'
import { GROOVES, checkEcho, expectedPcs, levelPhrase, phraseBeats } from './echo'

describe('ouvir e repetir', () => {
  it('frases geradas: um grau por ataque, 1 ou 2 compassos', () => {
    for (let level = 1; level <= 10; level++)
      for (let i = 0; i < 40; i++) {
        const p = levelPhrase(level)
        expect(p.degrees.length, p.pattern).toBe(onsetBeats(parsePattern(p.pattern)).length)
        expect(phraseBeats(p)).toBe(level >= 6 ? 8 : 4)
        expect(p.degrees[0]).toBe(0)
      }
  })
  it('grooves prontos: um grau (e um símbolo) por ataque, compassos inteiros', () => {
    for (const p of [...GROOVES.bass, ...GROOVES.guitar]) {
      const n = onsetBeats(parsePattern(p.pattern)).length
      expect(p.degrees.length, p.title).toBe(n)
      if (p.marks) expect(p.marks.length, p.title).toBe(n)
      expect(phraseBeats(p) % 4, p.title).toBe(0)
    }
  })
  it('confere a ordem em qualquer oitava e aponta a primeira nota errada', () => {
    const exp = expectedPcs({ title: '', pattern: 'q q q q', degrees: [0, null, 7, 12] }, 9) // A, (ghost), E, A
    expect(exp).toEqual([9, 4, 9])
    expect(checkEcho(exp, [45, 52])).toEqual({ ok: 2, miss: null, done: false })
    expect(checkEcho(exp, [57, 40, 33]).done).toBe(true)
    expect(checkEcho(exp, [45, 53])).toEqual({ ok: 1, miss: 1, done: false })
  })
})
