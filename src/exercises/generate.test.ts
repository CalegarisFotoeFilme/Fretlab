import { describe, expect, it } from 'vitest'
import { ALL_LESSONS, WORLDS, nextLesson, worldsFor } from '../curriculum'
import { makeInstrument, pcAt } from '../theory/instrument'
import { degreeChordMidis, noteSetRound, setPcs, theoryQuestion, findNoteRound, hearIntervalRound, intervalOptions, intervalRound, intervalTargets, nameNoteRound, parsePattern, HAND_SPAN } from './generate'
import { midiAt } from '../theory/instrument'
import { pcName } from '../theory/notes'
import { onsetBeats, totalBeats } from './rhythmScore'

const allInstruments = [makeInstrument('bass4'), makeInstrument('bass5'), makeInstrument('guitar6')]
const instruments = allInstruments

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

describe('ritmo II', () => {
  it('lê pontuadas e tercinas', () => {
    const e = parsePattern('q. e te te te rs s.')
    expect(e.map((x) => [x.figure, !!x.dotted, !!x.triplet, !!x.rest])).toEqual([
      ['quarter', true, false, false],
      ['eighth', false, false, false],
      ['eighth', false, true, false],
      ['eighth', false, true, false],
      ['eighth', false, true, false],
      ['sixteenth', false, false, true],
      ['sixteenth', true, false, false],
    ])
    // ataques: 0, 1.5, 2, 2.333, 2.667 (a pausa não conta), 3.25
    expect(onsetBeats(parsePattern('q. e te te te rs s.')).map((b) => Math.round(b * 1000) / 1000)).toEqual([0, 1.5, 2, 2.333, 2.667, 3.25])
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

describe('escalas, arpejos e teoria', () => {
  it('desenhe no braço: todas as notas da posição e só elas', () => {
    const spec = {
      shapes: [{ set: { scale: 'minorPentatonic' as const }, anchor: { string: 0, offset: 0, width: 3 } }],
      roots: 'all' as const,
      frets: { from: 1, to: 9 },
    }
    for (const inst of instruments)
      for (let i = 0; i < 200; i++) {
        const r = noteSetRound(inst, spec)
        const pcs = setPcs(r.root, r.set)
        expect(pcAt(inst, r.rootPos)).toBe(r.root)
        expect(r.targets.length).toBeGreaterThanOrEqual(3)
        for (const t of r.targets) {
          expect(pcs).toContain(pcAt(inst, t))
          expect(t.fret).toBeGreaterThanOrEqual(r.from)
          expect(t.fret).toBeLessThanOrEqual(r.to)
        }
      }
    // pentatônica de Lá na caixa 1 do baixo (casas 5–8): 8 notas em 4 cordas
    const r = noteSetRound(instruments[0], { ...spec, roots: [9], frets: { from: 5, to: 5 } })
    expect(r.targets).toHaveLength(8)
  })

  it('quiz de teoria: a resposta marcada é a certa', () => {
    const name = (pc: number, flats?: boolean) => pcName(pc, flats)
    for (let i = 0; i < 300; i++) {
      const q = theoryQuestion({ asks: ['chord-of-degree', 'degree-of-chord', 'function', 'relative', 'spell-chord', 'scale-notes', 'progression'], keys: [0, 2, 5, 7, 9, 10], mode: 'both', qualities: ['maj', 'min', 'dom7', 'min7'] }, name)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(new Set(q.options).size).toBe(q.options.length)
    }
    // casos fixos
    const fixed = theoryQuestion({ asks: ['relative'], keys: [0], mode: 'major' }, name)
    expect(fixed.options[fixed.answer]).toBe('A menor')
    const v = theoryQuestion({ asks: ['spell-chord'], keys: [7], mode: 'major', qualities: ['dom7'] }, name)
    expect(v.options[v.answer]).toBe('G – B – D – F')
  })

  it('acordes dos graus ficam numa região média', () => {
    for (let k = 0; k < 12; k++)
      for (let d = 1; d <= 7; d++) {
        const m = degreeChordMidis(k, 'major', d)
        expect(Math.min(...m)).toBeGreaterThanOrEqual(36)
        expect(Math.max(...m)).toBeLessThanOrEqual(72)
      }
  })
})

describe('currículo', () => {
  it('todos os exercícios são válidos', () => {
    for (const w of WORLDS) for (const l of w.lessons) {
      // mundos de técnica valem só para o próprio instrumento
      const instruments = allInstruments.filter((i) => !w.instrument || (w.instrument === 'guitar') === (i.kind === 'guitar6'))
      const ex = l.exercise
      if (ex.type === 'rhythm-dictation') {
        ex.patterns.forEach((p) => expect(totalBeats(parsePattern(p)), `${l.id}: ${p}`).toBe(4))
        expect(new Set(ex.patterns).size, l.id).toBeGreaterThanOrEqual(4)
      }
      if (ex.type === 'rhythm') {
        ex.patterns.forEach((p) => expect(totalBeats(parsePattern(p)), `${l.id}: ${p}`).toBe(4))
      }
      if (ex.type === 'quiz') {
        ex.questions.forEach((q) => expect(q.answer).toBeLessThan(q.options.length))
        expect(l.rounds).toBeLessThanOrEqual(ex.questions.length)
      }
      if (ex.type === 'note-set') {
        for (const inst of instruments)
          for (const shape of ex.shapes)
            expect(() => noteSetRound(inst, { ...ex, shapes: [shape] }), `${l.id} (${inst.kind}) ${JSON.stringify(shape)}`).not.toThrow()
      }
      if (ex.type === 'theory-quiz') {
        for (let i = 0; i < 30; i++) expect(theoryQuestion(ex, (pc, f) => pcName(pc, f)).answer).toBeGreaterThanOrEqual(0)
      }
      if (ex.type === 'play-interval' || ex.type === 'name-interval') {
        for (const inst of instruments) expect(() => intervalRound(inst, ex.intervals, ex.strings, ex.frets), `${l.id} (${inst.kind})`).not.toThrow()
      }
      if (ex.type === 'read-note') {
        for (const inst of instruments) expect(() => nameNoteRound(inst, ex.pool, ex.strings, ex.frets, 4), `${l.id} (${inst.kind})`).not.toThrow()
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

  it('mundos de técnica aparecem só para o instrumento deles', () => {
    expect(worldsFor('bass4').map((w) => w.id)).toContain('tecnica-baixo')
    expect(worldsFor('bass4').map((w) => w.id)).not.toContain('tecnica-guitarra')
    expect(worldsFor('guitar6').map((w) => w.id)).toContain('tecnica-guitarra')
    expect(worldsFor('guitar6').map((w) => w.id)).not.toContain('tecnica-baixo')
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
