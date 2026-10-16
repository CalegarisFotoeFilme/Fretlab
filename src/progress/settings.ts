import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { makeInstrument, type InstrumentKind } from '../theory/instrument'
import { pcName, SOLFEGE, type PitchClass } from '../theory/notes'

export type NoteNaming = 'letters' | 'solfege'

interface Settings {
  instrument: InstrumentKind
  tuningId: string
  leftHanded: boolean
  naming: NoteNaming
  inputDeviceId: string | null
  sensitivity: number
  latencyMs: number // compensação de atraso da entrada (toque/instrumento)
  onboarded: boolean
  /** volume geral do player, o mesmo para todas as músicas (fica o último usado) */
  playerVolume: number
  /** ordem da biblioteca */
  librarySort: 'added' | 'title' | 'artist' | 'group'
  /** áudio do player: sintetizador ou gravação do YouTube (vale para as próximas músicas) */
  playerSource: 'midi' | 'video'
  /** biblioteca em cards ou em linhas */
  libraryView: 'cards' | 'list'
  /** filtros da biblioteca: instrumento e afinação (null = qualquer) */
  libraryInstrument: 'any' | 'bass' | 'guitar'
  libraryTuning: string | null
  set: (patch: Partial<Omit<Settings, 'set'>>) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      instrument: 'bass4',
      tuningId: 'std',
      leftHanded: false,
      naming: 'letters',
      inputDeviceId: null,
      sensitivity: 0.01,
      latencyMs: 0,
      onboarded: false,
      playerVolume: 1,
      librarySort: 'added',
      playerSource: 'midi',
      libraryView: 'cards',
      libraryInstrument: 'any',
      libraryTuning: null,
      set: (patch) => set(patch),
    }),
    { name: 'fretlab-settings' },
  ),
)

export function useInstrument() {
  const kind = useSettings((s) => s.instrument)
  const tuningId = useSettings((s) => s.tuningId)
  return makeInstrument(kind, tuningId)
}

/** Nome da nota conforme a preferência (C ou Dó). */
export function useNoteName() {
  const naming = useSettings((s) => s.naming)
  return (pc: PitchClass, flats = false) => {
    const n = pcName(pc, flats)
    if (naming === 'letters') return n
    return SOLFEGE[n[0]] + n.slice(1).replace('#', '♯').replace('b', '♭')
  }
}
