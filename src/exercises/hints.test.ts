import { describe, expect, it } from 'vitest'
import { makeInstrument } from '../theory/instrument'
import { pcName } from '../theory/notes'
import { findNoteHints, hearChordHints, nameNoteHints, quizHints, readNoteHints, rhythmHints, shapeText } from './hints'

const bass = makeInstrument('bass4')
const name = (pc: number, f?: boolean) => pcName(pc, f)

describe('dicas do professor', () => {
  it('apontam a casa certa a partir da corda solta', () => {
    const [, second] = findNoteHints(bass, 7, { string: 0, fret: 3 }, name) // G na corda Mi, casa 3
    expect(second).toContain('casa 3')
    expect(nameNoteHints(bass, { string: 1, fret: 3 }, name)[1]).toBe('Contando casa a casa: A → A# → B → C.')
  })

  it('descrevem a forma do intervalo', () => {
    expect(shapeText({ string: 0, fret: 3 }, { string: 1, fret: 5 })).toBe('na corda de cima, 2 casas à frente')
    expect(shapeText({ string: 0, fret: 3 }, { string: 2, fret: 5 })).toBe('2 cordas acima, 2 casas à frente')
  })

  it('o quiz elimina só alternativas erradas, e nunca todas', () => {
    for (let answer = 0; answer < 4; answer++) {
      const hints = quizHints(['a', 'b', 'c', 'd'], answer)
      expect(hints).toHaveLength(2)
      expect(hints.join()).not.toContain(`"${['a', 'b', 'c', 'd'][answer]}"`)
    }
    expect(quizHints(['sim', 'não'], 0)).toHaveLength(0)
  })

  it('ritmo e acorde dizem o que importa', () => {
    expect(rhythmHints([0, 1, 1.5, 3])[1]).toBe('Os ataques caem em: 1 · 2 · 2 e · 4.')
    expect(hearChordHints('min7')[1]).toBe('Ele tem terça menor e tem sétima (menor).')
    expect(readNoteHints(-2, 'treble', ['B', 'A', 'G'])[1]).toContain('B → A → G')
  })
})
