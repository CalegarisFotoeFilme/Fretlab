import type * as AT from '@coderline/alphatab'
import type { Song } from '../progress/db'
import { readSongBytes } from '../progress/songs'
import { loadAlphaTab } from './alphatab'

/*
  O que cada música tem para o instrumento: faixas, se são de baixo ou guitarra e a afinação.
  Lido do arquivo uma vez e guardado na música (filtros e etiquetas da biblioteca).
*/

export type Family = 'bass' | 'guitar' | 'other'

export interface TrackMeta {
  name: string
  family: Family
  /** afinação em MIDI, da corda mais grave para a mais aguda */
  tuning: number[]
  /** instrumento General MIDI da faixa (ausente nas leituras antigas: a música é relida) */
  program?: number
}

/**
 * Classifica uma faixa. O Songsterr escreve piano, teclado e sintetizador também como tablatura
 * (com afinações inventadas), então quem decide é o instrumento General MIDI: 24–31 guitarras,
 * 32–39 baixos. Sem essa informação, vale o nome e a corda mais grave.
 */
export function trackFamily(name: string, tuning: number[], program?: number): Family {
  if (!tuning.length) return 'other'
  if (program !== undefined && program >= 0) {
    if (program >= 32 && program <= 39) return 'bass'
    if (program >= 24 && program <= 31) return 'guitar'
    return /\b(bass|baixo)\b/i.test(name) ? 'bass' : /guit|violão/i.test(name) ? 'guitar' : 'other'
  }
  if (/bass|baixo/i.test(name) || Math.min(...tuning) < 36) return 'bass'
  return tuning.length >= 6 && tuning.length <= 8 ? 'guitar' : 'other'
}

export function tracksOf(score: AT.model.Score): TrackMeta[] {
  return score.tracks
    .filter((t) => !t.isPercussion && !t.staves[0]?.isPercussion)
    .map((t) => {
      const tuning = [...(t.staves[0]?.tuning ?? [])].sort((a, b) => a - b)
      const program = t.playbackInfo?.program ?? -1
      return { name: t.name, family: trackFamily(t.name, tuning, program), tuning, program }
    })
}

/** Lê as faixas do arquivo da música (Guitar Pro ou MIDI do Songsterr). */
export async function readTracksMeta(song: Song): Promise<TrackMeta[]> {
  const at = await loadAlphaTab()
  const bytes = await readSongBytes(song)
  if (/\.midi?$/i.test(song.fileName ?? '')) {
    const { midiToScore } = await import('./midiImport')
    return tracksOf(midiToScore(at, bytes, song.fileName).score)
  }
  return tracksOf(at.importer.ScoreLoader.loadScoreFromBytes(bytes))
}

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const name = (midi: number) => NAMES[((midi % 12) + 12) % 12]

/** afinações padrão (grave → agudo) por número de cordas */
const STANDARD: Record<'bass' | 'guitar', Record<number, number[]>> = {
  bass: { 4: [28, 33, 38, 43], 5: [23, 28, 33, 38, 43], 6: [23, 28, 33, 38, 43, 48] },
  guitar: { 6: [40, 45, 50, 55, 59, 64], 7: [35, 40, 45, 50, 55, 59, 64], 8: [30, 35, 40, 45, 50, 55, 59, 64] },
}
const DEFAULT_STRINGS = { bass: 4, guitar: 6 }

/**
 * Nome da afinação como os músicos falam: "E padrão", "Eb padrão", "Drop D", com o número de cordas
 * quando foge do comum; afinações sem nome viram a lista de notas ("C G C F").
 */
export function tuningLabel(family: Family, tuning: number[]): string {
  const notes = tuning.map(name).join(' ')
  if (family === 'other') return notes
  const std = STANDARD[family][tuning.length]
  if (!std) return notes
  const extra = tuning.length !== DEFAULT_STRINGS[family] ? ` · ${tuning.length} cordas` : ''
  const diff = tuning.map((m, i) => m - std[i])
  const k = diff[1]
  const rest = diff.slice(1).every((d) => d === k)
  // "E padrão" deslocado k semitons (Eb, D…): o nome é o da corda E transposta
  if (rest && diff[0] === k) return `${name(std[std.findIndex((m) => m % 12 === 4)] + k)} padrão${extra}`
  // drop: só a mais grave um tom abaixo do resto
  if (rest && diff[0] === k - 2) return `Drop ${name(tuning[0])}${extra}`
  return notes
}

/** Afinações das faixas de um instrumento numa música (sem repetir). */
export function songTunings(song: Song, family: 'bass' | 'guitar'): string[] {
  return [...new Set((song.tracks ?? []).filter((t) => t.family === family).map((t) => tuningLabel(t.family, t.tuning)))]
}
