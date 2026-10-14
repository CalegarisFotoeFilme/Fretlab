import type { Instrument } from './instrument'
import { mod12, type Midi } from './notes'

/*
  Posição das notas na pauta. Guitarra e baixo são escritos uma oitava acima do som real:
  guitarra na clave de sol "8vb" e baixo na clave de fá "8vb" (o 8 embaixo da clave).
*/

export type Clef = 'treble' | 'bass'
export const clefFor = (inst: Instrument): Clef => (inst.kind === 'guitar6' ? 'treble' : 'bass')

const LETTER_OF_NATURAL: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 } // C D E F G A B → 0..6
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// linha do meio: B4 na clave de sol, D3 na clave de fá (em índice diatônico = letra + 7 × oitava)
const MIDDLE: Record<Clef, number> = { treble: 6 + 7 * 4, bass: 1 + 7 * 3 }

export interface StaffNote {
  /** passos diatônicos a partir da linha do meio (0); + sobe, cada passo = meio espaço */
  step: number
  accidental: 'sharp' | 'flat' | null
  /** nome escrito (letra + acidente) */
  name: string
}

/** Onde uma nota (som real, midi) aparece escrita na pauta do instrumento. */
export function staffNote(soundingMidi: Midi, clef: Clef, flats = false): StaffNote {
  const written = soundingMidi + 12
  const pc = mod12(written)
  const octave = Math.floor(written / 12) - 1
  let letter = LETTER_OF_NATURAL[pc]
  let accidental: StaffNote['accidental'] = null
  if (letter === undefined) {
    if (flats) {
      letter = LETTER_OF_NATURAL[mod12(pc + 1)]
      accidental = 'flat'
    } else {
      letter = LETTER_OF_NATURAL[mod12(pc - 1)]
      accidental = 'sharp'
    }
  }
  const step = letter + 7 * octave - MIDDLE[clef]
  return { step, accidental, name: LETTERS[letter] + (accidental === 'sharp' ? '#' : accidental === 'flat' ? 'b' : '') }
}

/** Linhas suplementares necessárias (posições pares fora das 5 linhas). */
export function ledgerSteps(step: number): number[] {
  const out: number[] = []
  for (let s = 6; s <= step; s += 2) out.push(s)
  for (let s = -6; s >= step; s -= 2) out.push(s)
  return out
}
