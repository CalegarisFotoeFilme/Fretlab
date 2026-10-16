import { mod12, parseMidi, type Midi, type PitchClass } from './notes'

export type InstrumentKind = 'bass4' | 'bass5' | 'bass6' | 'guitar6'

export interface Tuning {
  id: string
  name: string
  /** Da corda mais grave para a mais aguda. */
  strings: string[]
}

export const TUNINGS: Record<InstrumentKind, Tuning[]> = {
  bass4: [
    { id: 'std', name: 'Padrão (E A D G)', strings: ['E1', 'A1', 'D2', 'G2'] },
    { id: 'dropD', name: 'Drop D', strings: ['D1', 'A1', 'D2', 'G2'] },
    { id: 'halfDown', name: 'Meio tom abaixo', strings: ['Eb1', 'Ab1', 'Db2', 'Gb2'] },
  ],
  bass5: [
    { id: 'std', name: 'Padrão (B E A D G)', strings: ['B0', 'E1', 'A1', 'D2', 'G2'] },
  ],
  bass6: [
    { id: 'std', name: 'Padrão (B E A D G C)', strings: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'] },
    { id: 'halfDown', name: 'Meio tom abaixo', strings: ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2', 'B2'] },
  ],
  guitar6: [
    { id: 'std', name: 'Padrão (E A D G B E)', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    { id: 'dropD', name: 'Drop D', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    { id: 'halfDown', name: 'Meio tom abaixo', strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
  ],
}

export const INSTRUMENT_LABEL: Record<InstrumentKind, string> = {
  bass4: 'Baixo 4 cordas',
  bass5: 'Baixo 5 cordas',
  bass6: 'Baixo 6 cordas',
  guitar6: 'Guitarra 6 cordas',
}

export interface Instrument {
  kind: InstrumentKind
  tuning: Tuning
  frets: number
  openMidi: Midi[] // grave → agudo
}

export function makeInstrument(kind: InstrumentKind, tuningId = 'std', frets?: number): Instrument {
  const tuning = TUNINGS[kind].find((t) => t.id === tuningId) ?? TUNINGS[kind][0]
  return {
    kind,
    tuning,
    frets: frets ?? (kind === 'guitar6' ? 22 : kind === 'bass6' ? 24 : 20),
    openMidi: tuning.strings.map(parseMidi),
  }
}

export const isBass = (i: Instrument) => i.kind !== 'guitar6'

/** Índice 0 = corda mais grave. */
export interface FretPos {
  string: number
  fret: number
}

export const midiAt = (inst: Instrument, p: FretPos): Midi => inst.openMidi[p.string] + p.fret
export const pcAt = (inst: Instrument, p: FretPos): PitchClass => mod12(midiAt(inst, p))

/** Número da corda do jeito que músicos falam: 1 = mais aguda. */
export const stringNumber = (inst: Instrument, idx: number) => inst.openMidi.length - idx

export function findPositions(inst: Instrument, pc: PitchClass, maxFret = inst.frets, minFret = 0): FretPos[] {
  const out: FretPos[] = []
  inst.openMidi.forEach((open, s) => {
    for (let f = minFret; f <= maxFret; f++) if (mod12(open + f) === mod12(pc)) out.push({ string: s, fret: f })
  })
  return out
}

export function findMidiPositions(inst: Instrument, midi: Midi): FretPos[] {
  return inst.openMidi
    .map((open, s) => ({ string: s, fret: midi - open }))
    .filter((p) => p.fret >= 0 && p.fret <= inst.frets)
}

export const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
export const DOUBLE_INLAYS = [12, 24]
