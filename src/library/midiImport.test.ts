import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import type * as AT from '@coderline/alphatab'
import { midiToGuitarPro, splitDuration } from './midiImport'

const require = createRequire(import.meta.url)
const at = require(require.resolve('@coderline/alphatab').replace(/alphaTab\.[^/]*$/, 'alphaTab.js')) as typeof AT

/** Monta um MIDI no formato do Songsterr: cabeçalho com nome + uma trilha por corda (canal = corda). */
function songsterrLikeMidi() {
  const m = new Midi()
  m.header.setTempo(120)
  m.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] })
  const head = m.addTrack()
  head.name = 'Cliff Burton | Aria Pro II | Bass'
  const ppq = m.header.ppq
  // corda E (canal 3): E1, G1 ; corda A (canal 2): A1 (colcheias)
  const e = m.addTrack()
  e.channel = 3
  e.instrument.number = 33
  e.addNote({ midi: 28, ticks: 0, durationTicks: ppq / 2 })
  e.addNote({ midi: 31, ticks: ppq / 2, durationTicks: ppq / 2 })
  const a = m.addTrack()
  a.channel = 2
  a.instrument.number = 33
  a.addNote({ midi: 33, ticks: ppq, durationTicks: ppq * 3 }) // mínima pontuada
  return new Uint8Array(m.toArray())
}

describe('MIDI → Guitar Pro', () => {
  it('quebra durações respeitando o tempo', () => {
    expect(splitDuration(0, 8)).toEqual([[4, 0]]) // semínima
    expect(splitDuration(0, 24)).toEqual([[2, 1]]) // mínima pontuada
    expect(splitDuration(4, 8)).toEqual([[8, 0], [8, 0]]) // contratempo vira duas colcheias
    expect(splitDuration(0, 1)).toEqual([[32, 0]])
  })

  it('recupera corda e casa do formato do Songsterr', () => {
    const r = midiToGuitarPro(at, songsterrLikeMidi(), 'Metallica-Orion-10-08-2026.mid')
    expect(r.artist).toBe('Metallica')
    expect(r.title).toBe('Orion')
    expect(r.tracks).toHaveLength(1)
    expect(r.tracks[0]).toMatchObject({ isBass: true, strings: 4, notes: 3 })
    const score = at.importer.ScoreLoader.loadScoreFromBytes(r.bytes)
    const staff = score.tracks[0].staves[0]
    const notes = staff.bars[0].voices[0].beats.flatMap((b) => b.notes)
    expect(notes.slice(0, 3).map((n) => [n.string, n.fret])).toEqual([[1, 0], [1, 3], [2, 0]])
    expect(score.tempo).toBe(120)
  })

  // Teste opcional com um arquivo real do Songsterr (não versionado). Defina FRETLAB_MIDI=/caminho/arquivo.mid
  const real = process.env.FRETLAB_MIDI
  it.runIf(!!real && existsSync(real!))('converte um MIDI real do Songsterr', () => {
    const r = midiToGuitarPro(at, new Uint8Array(readFileSync(real!)), real!.split('/').pop())
    console.log(r.title, '|', r.artist, r.tracks, r.skipped)
    expect(r.tracks.length).toBeGreaterThan(0)
    const score = at.importer.ScoreLoader.loadScoreFromBytes(r.bytes)
    expect(score.masterBars.length).toBeGreaterThan(10)
  })
})
