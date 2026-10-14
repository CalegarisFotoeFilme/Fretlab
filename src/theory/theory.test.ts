import { describe, expect, it } from 'vitest'
import {
  chordName, chordNotes, harmonicField, intervalBetween, midiName, parseMidi, parsePc, pcName, scaleNotes,
} from './notes'
import { findMidiPositions, findPositions, makeInstrument, midiAt, pcAt, stringNumber } from './instrument'

describe('notas', () => {
  it('converte nomes', () => {
    expect(parsePc('C#')).toBe(1)
    expect(parsePc('Db')).toBe(1)
    expect(parsePc('Cb')).toBe(11)
    expect(parsePc('Lá')).toBe(9)
    expect(parseMidi('A4')).toBe(69)
    expect(parseMidi('E1')).toBe(28)
    expect(midiName(40)).toBe('E2')
    expect(pcName(10, true)).toBe('Bb')
  })

  it('mede intervalos', () => {
    expect(intervalBetween(parsePc('C'), parsePc('G')).name).toBe('Quinta justa')
    expect(intervalBetween(parsePc('A'), parsePc('C')).short).toBe('b3')
  })
})

describe('escalas e acordes', () => {
  it('monta escalas', () => {
    expect(scaleNotes(parsePc('G'), 'major').map((n) => pcName(n))).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#'])
    expect(scaleNotes(parsePc('A'), 'minorPentatonic').map((n) => pcName(n))).toEqual(['A', 'C', 'D', 'E', 'G'])
  })

  it('monta tríades', () => {
    expect(chordNotes(parsePc('A'), 'min').map((n) => pcName(n))).toEqual(['A', 'C', 'E'])
    expect(chordName(parsePc('B'), 'dim')).toBe('B°')
  })

  it('gera o campo harmônico', () => {
    const g = harmonicField(parsePc('G'))
    expect(g.map((d) => chordName(d.root, d.quality))).toEqual(['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#°'])
    expect(g.map((d) => d.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    const c7 = harmonicField(0, 'major', true)
    expect(c7.map((d) => d.quality)).toEqual(['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'])
    const am = harmonicField(parsePc('A'), 'minor')
    expect(am.map((d) => chordName(d.root, d.quality))).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'])
  })
})

describe('braço', () => {
  const bass = makeInstrument('bass4')
  const guitar = makeInstrument('guitar6')

  it('encontra notas por corda/casa', () => {
    expect(pcName(pcAt(bass, { string: 1, fret: 3 }))).toBe('C') // corda Lá, casa 3
    expect(midiAt(guitar, { string: 5, fret: 0 })).toBe(64) // Mi aguda = E4
    expect(stringNumber(guitar, 5)).toBe(1)
  })

  it('lista todas as posições de uma nota', () => {
    const cs = findPositions(bass, parsePc('C'), 12)
    expect(cs).toContainEqual({ string: 0, fret: 8 })
    expect(cs).toContainEqual({ string: 2, fret: 10 })
    expect(findMidiPositions(guitar, parseMidi('E4')).length).toBeGreaterThanOrEqual(4)
  })

  it('suporta baixo de 5 cordas e afinações', () => {
    expect(midiAt(makeInstrument('bass5'), { string: 0, fret: 0 })).toBe(23)
    expect(pcName(pcAt(makeInstrument('guitar6', 'dropD'), { string: 0, fret: 0 }))).toBe('D')
  })
})
