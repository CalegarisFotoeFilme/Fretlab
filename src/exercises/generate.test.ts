import { describe, expect, it } from 'vitest'
import { ALL_LESSONS, isUnlocked, nextLesson } from '../curriculum'
import { makeInstrument, pcAt } from '../theory/instrument'
import { findNoteRound, nameNoteRound, parsePattern } from './generate'
import { totalBeats } from './rhythmScore'

const instruments = [makeInstrument('bass4'), makeInstrument('bass5'), makeInstrument('guitar6')]

describe('geradores', () => {
  it('find-note sempre tem alvo nas cordas pedidas', () => {
    for (const inst of instruments) {
      for (let i = 0; i < 200; i++) {
        const r = findNoteRound(inst, 'all', [0, 1], { from: 0, to: 12 })
        expect(r.targets.length).toBeGreaterThan(0)
        expect(r.strings).toHaveLength(1)
        r.targets.forEach((t) => {
          expect(pcAt(inst, t)).toBe(r.pc)
          expect(r.strings).toContain(t.string)
        })
      }
    }
  })

  it('name-note inclui a resposta certa entre opções únicas', () => {
    for (let i = 0; i < 200; i++) {
      const r = nameNoteRound(instruments[2], 'all', 'all', { from: 0, to: 12 }, 4)
      expect(r.options).toContain(r.pc)
      expect(new Set(r.options).size).toBe(4)
    }
  })
})

describe('currículo', () => {
  it('todos os exercícios são válidos', () => {
    for (const l of ALL_LESSONS) {
      const ex = l.exercise
      if (ex.type === 'rhythm') {
        ex.patterns.forEach((p) => expect(totalBeats(parsePattern(p)), `${l.id}: ${p}`).toBe(4))
      }
      if (ex.type === 'quiz') {
        ex.questions.forEach((q) => expect(q.answer).toBeLessThan(q.options.length))
        expect(l.rounds).toBeLessThanOrEqual(ex.questions.length)
      }
      if (ex.type === 'find-note' || ex.type === 'name-note') {
        for (const inst of instruments) {
          expect(() =>
            ex.type === 'find-note'
              ? findNoteRound(inst, ex.pool, ex.strings, ex.frets)
              : nameNoteRound(inst, ex.pool, ex.strings, ex.frets, ex.choices),
          ).not.toThrow()
        }
      }
    }
  })

  it('ids são únicos', () => {
    expect(new Set(ALL_LESSONS.map((l) => l.id)).size).toBe(ALL_LESSONS.length)
  })

  it('desbloqueia em ordem', () => {
    const none = () => 0
    expect(isUnlocked(ALL_LESSONS[0].id, none)).toBe(true)
    expect(isUnlocked(ALL_LESSONS[1].id, none)).toBe(false)
    expect(nextLesson(none)?.id).toBe(ALL_LESSONS[0].id)
    const firstThree = new Set(ALL_LESSONS.slice(0, 3).map((l) => l.id))
    expect(isUnlocked('w2-pulso', (id) => (firstThree.has(id) ? 1 : 0))).toBe(true)
  })
})
