import { describe, expect, it } from 'vitest'
import { ALL_LESSONS, nextLesson } from '../curriculum'
import { makeInstrument, pcAt } from '../theory/instrument'
import { findNoteRound, hearIntervalRound, intervalOptions, intervalRound, intervalTargets, nameNoteRound, parsePattern, HAND_SPAN } from './generate'
import { midiAt } from '../theory/instrument'
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

describe('intervalos', () => {
  it('formas clássicas no braço', () => {
    const gtr = instruments[2]
    const root = { string: 0, fret: 3 } // G na 6ª corda
    expect(intervalTargets(gtr, root, 7)).toContainEqual({ string: 1, fret: 5 }) // 5ª: corda de cima, 2 casas à frente
    expect(intervalTargets(gtr, root, 12)).toContainEqual({ string: 2, fret: 5 }) // oitava: 2 cordas acima, 2 casas
    expect(intervalTargets(gtr, root, 4)).toContainEqual({ string: 1, fret: 2 }) // 3ª maior: corda de cima, 1 casa atrás
    // cruzando a corda Si (G → B), a forma da oitava muda: 3 casas em vez de 2
    expect(intervalTargets(gtr, { string: 3, fret: 2 }, 12)).toContainEqual({ string: 5, fret: 5 })
  })

  it('toda rodada tem uma forma tocável e certa', () => {
    for (const inst of instruments)
      for (let i = 0; i < 300; i++) {
        const r = intervalRound(inst, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [0, 1], { from: 1, to: 7 })
        expect(r.targets.length).toBeGreaterThan(0)
        for (const t of r.targets) {
          expect(midiAt(inst, t) - midiAt(inst, r.root)).toBe(r.semis)
          expect(Math.abs(t.fret - r.root.fret)).toBeLessThanOrEqual(HAND_SPAN)
        }
      }
  })

  it('opções incluem a resposta, sem repetir', () => {
    for (let i = 0; i < 200; i++) {
      const o = intervalOptions(7, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 6)
      expect(o).toContain(7)
      expect(new Set(o).size).toBe(6)
      const h = hearIntervalRound(instruments[0], [3, 4, 7], 'both')
      expect(h.options).toEqual([3, 4, 7])
      expect(h.options).toContain(h.semis)
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
      if (ex.type === 'play-interval' || ex.type === 'name-interval') {
        for (const inst of instruments) expect(() => intervalRound(inst, ex.intervals, ex.strings, ex.frets), `${l.id} (${inst.kind})`).not.toThrow()
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

  it('sugere a primeira lição sem estrela, na ordem da trilha', () => {
    expect(nextLesson(() => 0)?.id).toBe(ALL_LESSONS[0].id)
    // pular lições é permitido: a sugestão volta para a primeira que ficou para trás
    const done = new Set([ALL_LESSONS[0].id, ALL_LESSONS[2].id])
    expect(nextLesson((id) => (done.has(id) ? 1 : 0))?.id).toBe(ALL_LESSONS[1].id)
  })
})
