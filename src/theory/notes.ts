// Núcleo de teoria: notas, intervalos, escalas e acordes em classes de altura (0–11).

export type PitchClass = number // 0 = C … 11 = B
export type Midi = number

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const
export const NATURALS: PitchClass[] = [0, 2, 4, 5, 7, 9, 11]

/** Nomes em solfejo, usados como apoio na interface em PT-BR. */
export const SOLFEGE: Record<string, string> = {
  C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si',
}

export const mod12 = (n: number) => ((n % 12) + 12) % 12

export function pcName(pc: PitchClass, preferFlats = false): string {
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)]
}

export function isNatural(pc: PitchClass) {
  return NATURALS.includes(mod12(pc))
}

/** "C#", "Db", "Bb" → classe de altura. Aceita também "Dó", "Ré" etc. */
export function parsePc(name: string): PitchClass {
  const solf = Object.entries(SOLFEGE).find(([, v]) => v.toLowerCase() === name.toLowerCase())
  if (solf) return parsePc(solf[0])
  const m = /^([A-Ga-g])([#b♯♭]*)$/.exec(name.trim())
  if (!m) throw new Error(`Nota inválida: ${name}`)
  const base = SHARP_NAMES.indexOf(m[1].toUpperCase() as (typeof SHARP_NAMES)[number])
  let acc = 0
  for (const ch of m[2]) acc += ch === '#' || ch === '♯' ? 1 : -1
  return mod12(base + acc)
}

/** "E2", "A#3" → MIDI. Convenção: C4 = 60. */
export function parseMidi(name: string): Midi {
  const m = /^([A-Ga-g][#b]*)(-?\d)$/.exec(name.trim())
  if (!m) throw new Error(`Nota inválida: ${name}`)
  return parsePc(m[1]) + (Number(m[2]) + 1) * 12
}

export function midiName(midi: Midi, preferFlats = false) {
  return `${pcName(midi, preferFlats)}${Math.floor(midi / 12) - 1}`
}

export const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
export const freqToMidiFloat = (freq: number) => 69 + 12 * Math.log2(freq / 440)

// ---------- Intervalos ----------

export interface IntervalInfo {
  semitones: number
  short: string
  name: string
}

export const INTERVALS: IntervalInfo[] = [
  { semitones: 0, short: '1', name: 'Uníssono' },
  { semitones: 1, short: 'b2', name: 'Segunda menor' },
  { semitones: 2, short: '2', name: 'Segunda maior' },
  { semitones: 3, short: 'b3', name: 'Terça menor' },
  { semitones: 4, short: '3', name: 'Terça maior' },
  { semitones: 5, short: '4', name: 'Quarta justa' },
  { semitones: 6, short: 'b5', name: 'Trítono' },
  { semitones: 7, short: '5', name: 'Quinta justa' },
  { semitones: 8, short: 'b6', name: 'Sexta menor' },
  { semitones: 9, short: '6', name: 'Sexta maior' },
  { semitones: 10, short: 'b7', name: 'Sétima menor' },
  { semitones: 11, short: '7', name: 'Sétima maior' },
  { semitones: 12, short: '8', name: 'Oitava' },
]

export const intervalBetween = (from: PitchClass, to: PitchClass) => INTERVALS[mod12(to - from)]

// ---------- Escalas ----------

export const SCALES = {
  major: { name: 'Maior', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Menor natural', steps: [0, 2, 3, 5, 7, 8, 10] },
  majorPentatonic: { name: 'Pentatônica maior', steps: [0, 2, 4, 7, 9] },
  minorPentatonic: { name: 'Pentatônica menor', steps: [0, 3, 5, 7, 10] },
  blues: { name: 'Blues', steps: [0, 3, 5, 6, 7, 10] },
  dorian: { name: 'Dórico', steps: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: { name: 'Mixolídio', steps: [0, 2, 4, 5, 7, 9, 10] },
} as const
export type ScaleId = keyof typeof SCALES

export function scaleNotes(root: PitchClass, scale: ScaleId): PitchClass[] {
  return SCALES[scale].steps.map((s) => mod12(root + s))
}

// ---------- Acordes ----------

export const CHORDS = {
  maj: { symbol: '', name: 'Maior', formula: [0, 4, 7] },
  min: { symbol: 'm', name: 'Menor', formula: [0, 3, 7] },
  dim: { symbol: '°', name: 'Diminuto', formula: [0, 3, 6] },
  aug: { symbol: '+', name: 'Aumentado', formula: [0, 4, 8] },
  maj7: { symbol: '7M', name: 'Maior com sétima maior', formula: [0, 4, 7, 11] },
  dom7: { symbol: '7', name: 'Dominante', formula: [0, 4, 7, 10] },
  min7: { symbol: 'm7', name: 'Menor com sétima', formula: [0, 3, 7, 10] },
  m7b5: { symbol: 'm7(b5)', name: 'Meio-diminuto', formula: [0, 3, 6, 10] },
} as const
export type ChordQuality = keyof typeof CHORDS

export function chordNotes(root: PitchClass, quality: ChordQuality): PitchClass[] {
  return CHORDS[quality].formula.map((s) => mod12(root + s))
}

export function chordName(root: PitchClass, quality: ChordQuality, preferFlats = false) {
  return pcName(root, preferFlats) + CHORDS[quality].symbol
}

// ---------- Campo harmônico ----------

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export interface Degree {
  degree: number // 1..7
  roman: string
  root: PitchClass
  quality: ChordQuality
}

/** Tríades (ou tétrades) diatônicas da escala maior/menor. */
export function harmonicField(root: PitchClass, mode: 'major' | 'minor' = 'major', sevenths = false): Degree[] {
  const notes = scaleNotes(root, mode)
  return notes.map((r, i) => {
    const third = mod12(notes[(i + 2) % 7] - r)
    const fifth = mod12(notes[(i + 4) % 7] - r)
    const seventh = mod12(notes[(i + 6) % 7] - r)
    let quality: ChordQuality
    if (!sevenths) quality = fifth === 6 ? 'dim' : third === 3 ? 'min' : 'maj'
    else if (fifth === 6) quality = 'm7b5'
    else if (third === 3) quality = 'min7'
    else quality = seventh === 11 ? 'maj7' : 'dom7'
    const minorish = third === 3
    const roman = (minorish ? ROMAN[i].toLowerCase() : ROMAN[i]) + (fifth === 6 ? '°' : '')
    return { degree: i + 1, roman, root: r, quality }
  })
}

/** Tonalidades que preferem bemóis na grafia. */
export function prefersFlats(keyRoot: PitchClass, mode: 'major' | 'minor' = 'major') {
  const relMajor = mode === 'major' ? keyRoot : mod12(keyRoot + 3)
  return [5, 10, 3, 8, 1, 6].includes(relMajor)
}
