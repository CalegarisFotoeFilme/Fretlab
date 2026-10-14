import type * as AT from '@coderline/alphatab'
import { detectChord, findProgression, isDiatonic, romanOf, type ChordGuess, type Key } from '../theory/analysis'
import { estimateKey, type KeyGuess } from '../theory/key'
import { chordName, mod12, prefersFlats } from '../theory/notes'

/** Uma nota da partitura, já com compasso e posição. */
export interface SongNote {
  midi: number
  track: number
  bar: number
  /** posição no compasso (0..1) */
  pos: number
  /** duração em ticks do alphaTab (960 por semínima) */
  dur: number
  /** false = continuação ligada de uma nota anterior */
  onset: boolean
  string: number
  fret: number
}

export interface BarChord extends ChordGuess {
  name: string
  roman: string
  diatonic: boolean
}

export interface SongAnalysis {
  key: KeyGuess
  second: KeyGuess
  notes: SongNote[]
  /** notas agrupadas por compasso */
  byBar: SongNote[][]
  /** acordes do compasso, na ordem (um só quando o compasso é estável) */
  chords: BarChord[][]
  /** acordes usados, do mais ao menos frequente (em compassos) */
  usage: { chord: BarChord; bars: number }[]
  progression: { start: number; length: number; count: number } | null
}

/** Lê as notas de todas as faixas melódicas (a bateria fica de fora). */
export function collectSongNotes(score: AT.model.Score): SongNote[] {
  const out: SongNote[] = []
  score.tracks.forEach((track, ti) => {
    if (track.isPercussion) return
    for (const staff of track.staves) {
      if (staff.isPercussion) continue
      for (const bar of staff.bars) {
        const mb = bar.masterBar
        const len = mb.calculateDuration()
        for (const voice of bar.voices)
          for (const beat of voice.beats) {
            if (beat.isRest) continue
            const pos = len ? beat.playbackStart / len : 0
            for (const note of beat.notes) {
              if (note.isDead) continue
              out.push({
                midi: note.realValue,
                track: ti,
                bar: mb.index,
                pos,
                dur: beat.playbackDuration,
                onset: !note.isTieDestination,
                string: note.string,
                fret: note.fret,
              })
            }
          }
      }
    }
  })
  return out
}

/**
 * Peso de cada faixa na harmonia: base (acordes) e baixo definem o acorde; faixas de uma nota por vez
 * no agudo (solo, voz) pesam menos, para a melodia não virar "acorde".
 */
function trackWeights(notes: SongNote[]) {
  const stats = new Map<number, { onsets: Set<string>; notes: number; low: number }>()
  for (const n of notes) {
    if (!n.onset) continue
    const s = stats.get(n.track) ?? { onsets: new Set<string>(), notes: 0, low: 0 }
    s.onsets.add(`${n.bar}:${n.pos}`)
    s.notes++
    if (n.midi < 45) s.low++
    stats.set(n.track, s)
  }
  const w = new Map<number, number>()
  for (const [t, s] of stats) {
    const chordal = s.notes / Math.max(1, s.onsets.size) >= 1.5
    const bass = s.low / s.notes > 0.5
    w.set(t, chordal || bass ? 1 : 0.35)
  }
  return w
}

/** Histograma (peso = duração) e histograma do grave (a nota mais grave de cada ataque). */
function histograms(notes: SongNote[], weights?: Map<number, number>) {
  const all = new Array(12).fill(0)
  const bass = new Array(12).fill(0)
  const lowest = new Map<string, SongNote>()
  for (const n of notes) {
    all[mod12(n.midi)] += n.dur * (weights?.get(n.track) ?? 1)
    const k = `${n.track}:${n.pos}`
    const cur = lowest.get(k)
    if (!cur || n.midi < cur.midi) lowest.set(k, n)
  }
  for (const n of lowest.values()) bass[mod12(n.midi)] += n.dur * (n.midi < 45 ? 2 : 1)
  return { all, bass }
}

export function analyzeSong(score: AT.model.Score): SongAnalysis | null {
  const notes = collectSongNotes(score)
  if (!notes.length) return null
  const { all } = histograms(notes)
  const [key, second] = estimateKey(all)
  const k: Key = { root: key.root, mode: key.mode }
  const flats = prefersFlats(key.root, key.mode)

  const byBar: SongNote[][] = score.masterBars.map(() => [])
  for (const n of notes) byBar[n.bar]?.push(n)

  const label = (c: ChordGuess): BarChord => ({
    ...c,
    name: chordName(c.root, c.quality, flats),
    roman: romanOf(c.root, c.quality, k),
    diatonic: isDiatonic(c.root, c.quality, k),
  })
  const weights = trackWeights(notes)
  const guess = (ns: SongNote[]) => {
    const { all: h, bass } = histograms(ns, weights)
    const c = detectChord(h, bass)
    // trecho com notas demais fora do acorde (melodia solta, cromatismos): sem acorde
    return c && c.fit >= 0.6 ? label(c) : null
  }

  const chords = byBar.map((ns, bi) => {
    if (!ns.length) return []
    const whole = guess(ns)
    // compasso estável: um acorde explica quase tudo
    if (whole && whole.fit >= 0.85) return [whole]
    // senão, um acorde por tempo (riffs que trocam de acorde a cada tempo), juntando vizinhos iguais
    const mb = score.masterBars[bi]
    const beats = mb.timeSignatureDenominator === 4 ? mb.timeSignatureNumerator : 2
    const out: BarChord[] = []
    for (let b = 0; b < beats; b++) {
      const c = guess(ns.filter((n) => n.pos >= b / beats - 1e-6 && n.pos < (b + 1) / beats - 1e-6))
      // mesma fundamental do tempo anterior (G, G5, G7M…): continua o mesmo acorde
      if (c && c.root !== out.at(-1)?.root) out.push(c)
    }
    return out.length ? out : whole ? [whole] : []
  })

  const counts = new Map<string, { chord: BarChord; bars: number }>()
  for (const cs of chords)
    for (const c of cs) {
      const e = counts.get(c.name)
      if (e) e.bars++
      else counts.set(c.name, { chord: c, bars: 1 })
    }
  const usage = [...counts.values()].sort((a, b) => b.bars - a.bars)
  const progression = findProgression(chords.map((cs) => (cs.length ? cs.map((c) => c.name).join(' ') : null)))

  return { key, second, notes, byBar, chords, usage, progression }
}
