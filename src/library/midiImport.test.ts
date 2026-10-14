import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import type * as AT from '@coderline/alphatab'
import { chooseDivision, midiToGuitarPro, midiToScore, splitDuration, splitTuplet } from './midiImport'

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

const beatsOf = (score: AT.model.Score, track = 0) =>
  score.tracks[track].staves[0].bars.flatMap((b) => b.voices[0].beats)

describe('MIDI → Guitar Pro', () => {
  it('quebra durações respeitando o tempo', () => {
    // unidades em semifusas (1/64)
    expect(splitDuration(0, 16)).toEqual([[4, 0]]) // semínima
    expect(splitDuration(0, 48)).toEqual([[2, 1]]) // mínima pontuada
    expect(splitDuration(8, 16)).toEqual([[4, 0]]) // síncope: uma figura só, como no Guitar Pro
    expect(splitDuration(12, 52)).toEqual([[16, 0], [2, 1]]) // até o tempo, depois mínima pontuada
    expect(splitDuration(0, 1)).toEqual([[64, 0]])
  })

  it('reconhece a subdivisão de cada tempo', () => {
    expect(chooseDivision([0])).toBe(1)
    expect(chooseDivision([0, 0.5])).toBe(2)
    expect(chooseDivision([0, 1 / 3, 2 / 3])).toBe(3) // tercina de colcheias
    expect(chooseDivision([0, 1 / 6, 2 / 6])).toBe(6) // sextina
    expect(chooseDivision([0, 1 / 16])).toBe(16) // semifusa
    expect(chooseDivision([0, 0.2, 0.4])).toBe(5) // quintina
    expect(splitTuplet(1, 16)).toEqual([[1, 16, 0]])
    expect(splitTuplet(2, 16)).toEqual([[2, 8, 0]])
    expect(splitTuplet(3, 8)).toEqual([[3, 4, 1]])
  })

  it('recupera corda e casa do formato do Songsterr', () => {
    const r = midiToGuitarPro(at, songsterrLikeMidi(), 'Metallica-Orion-10-08-2026.mid')
    expect(r.artist).toBe('Metallica')
    expect(r.title).toBe('Orion')
    expect(r.tracks).toHaveLength(1)
    expect(r.tracks[0]).toMatchObject({ isBass: true, strings: 4, notes: 3, isPercussion: false })
    const score = at.importer.ScoreLoader.loadScoreFromBytes(r.bytes)
    const staff = score.tracks[0].staves[0]
    const notes = staff.bars[0].voices[0].beats.flatMap((b) => b.notes)
    expect(notes.slice(0, 3).map((n) => [n.string, n.fret])).toEqual([[1, 0], [1, 3], [2, 0]])
    expect(score.tempo).toBe(120)
  })

  it('mantém tercinas, rasgueados e bateria, separando instrumentos sem nome', () => {
    const m = new Midi()
    m.header.setTempo(100)
    const ppq = m.header.ppq
    // guitarra sem cabeçalho: tercina de colcheias na corda Sol (canal 2) e um acorde rasgueado
    const g = m.addTrack()
    g.channel = 2
    g.instrument.number = 29
    for (let i = 0; i < 3; i++) g.addNote({ midi: 57, ticks: Math.round((i * ppq) / 3), durationTicks: Math.round(ppq / 3) })
    const strumStart = ppq
    const lowE = m.addTrack()
    lowE.channel = 5
    lowE.instrument.number = 29
    lowE.addNote({ midi: 40, ticks: strumStart, durationTicks: ppq })
    const a = m.addTrack()
    a.channel = 4
    a.instrument.number = 29
    a.addNote({ midi: 47, ticks: strumStart + ppq / 40, durationTicks: ppq })
    // bateria logo depois, também sem nome
    const d = m.addTrack()
    d.channel = 9
    d.addNote({ midi: 36, ticks: 0, durationTicks: ppq / 8 })
    d.addNote({ midi: 38, ticks: ppq, durationTicks: ppq / 8 })

    const r = midiToGuitarPro(at, new Uint8Array(m.toArray()), 'teste.mid')
    expect(r.skipped).toEqual([])
    expect(r.tracks.map((t) => t.isPercussion)).toEqual([false, true])
    const score = at.importer.ScoreLoader.loadScoreFromBytes(r.bytes)
    const gtr = beatsOf(score, 0)
    expect(gtr.slice(0, 3).map((b) => [b.duration, b.tupletNumerator, b.tupletDenominator])).toEqual([[8, 3, 2], [8, 3, 2], [8, 3, 2]])
    const chord = gtr[3]
    expect(chord.notes.map((n) => [n.string, n.fret]).sort()).toEqual([[1, 0], [2, 2]])
    expect(chord.brushType).toBe(at.model.BrushType.BrushDown)
    const drums = beatsOf(score, 1)
    expect(score.tracks[1].staves[0].isPercussion).toBe(true)
    expect(drums.filter((b) => !b.isRest).map((b) => b.notes[0].percussionArticulation)).toEqual([36, 38])
  })

  it('recupera slide, ligado, staccato e nota morta do jeito que o Songsterr toca', () => {
    const m = new Midi()
    m.header.setTempo(100)
    const ppq = m.header.ppq
    const a = m.addTrack() // corda Lá do baixo (canal 2) e Ré (canal 1), como no Songsterr
    a.channel = 2
    a.instrument.number = 33
    const d = m.addTrack()
    d.channel = 1
    d.instrument.number = 33
    const loud = 0.69
    const soft = 0.53
    a.addNote({ midi: 33, ticks: 0, durationTicks: ppq / 32, velocity: loud }) // nota morta (x), escrita como semínima
    a.addNote({ midi: 33, ticks: ppq, durationTicks: ppq / 2, velocity: loud }) // casa 0 com slide até a 12
    const step = ppq / 2 / 11
    for (let i = 0; i < 11; i++) a.addNote({ midi: 34 + i, ticks: Math.round(ppq * 1.5 + i * step), durationTicks: Math.round(step), velocity: soft })
    a.addNote({ midi: 45, ticks: ppq * 2, durationTicks: ppq, velocity: loud })
    d.addNote({ midi: 40, ticks: ppq * 3, durationTicks: ppq / 4, velocity: loud }) // hammer-on 2 → 4, depois pull-off
    d.addNote({ midi: 42, ticks: ppq * 3.25, durationTicks: ppq / 4, velocity: soft })
    d.addNote({ midi: 40, ticks: ppq * 3.5, durationTicks: ppq / 4, velocity: soft }) // staccato: soa metade da colcheia
    d.addNote({ midi: 38, ticks: ppq * 4, durationTicks: ppq, velocity: loud })

    const { score } = midiToScore(at, new Uint8Array(m.toArray()), 'teste.mid')
    const beats = beatsOf(score).filter((b) => !b.isRest)
    const notes = beats.flatMap((b) => b.notes.filter((n) => !n.isTieDestination).map((n) => ({ n, b })))
    const desc = notes.map(({ n, b }) => `${n.string}/${n.fret}:${b.playbackDuration}${n.isDead ? 'x' : ''}${n.slideOutType ? 's' + n.slideOutType : ''}${n.isHammerPullOrigin ? 'h' : ''}${n.isStaccato ? '.' : ''}`)
    expect(desc).toEqual(['2/0:960x', '2/0:960s1', '2/12:960', '3/2:240h', '3/4:240h', '3/2:480.', '3/0:960'])
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

describe('sincronia com o Songsterr', () => {
  it('lê o número da música e converte pontos por compasso tocado (com repetição)', async () => {
    const { songsterrSongId, toFlatSyncPoints } = await import('./songsterrSync')
    expect(songsterrSongId('https://www.songsterr.com/a/wsa/metallica-master-of-puppets-tab-s455')).toBe(455)
    expect(songsterrSongId('https://www.songsterr.com/a/wsa/x-bass-tab-s23063t2')).toBe(23063)
    // compassos 0,1,1,2 (o 1 repete): o segundo 1 é a ocorrência 1
    const flat = toFlatSyncPoints([{ index: 0 }, { index: 1 }, { index: 1 }, { index: 2 }], [0.5, 2, 3.5, 5, 6.5])
    expect(flat.map((p) => [p.barIndex, p.barOccurence, p.millisecondOffset])).toEqual([
      [0, 0, 500],
      [1, 0, 2000],
      [1, 1, 3500],
      [2, 0, 5000],
    ])
  })
})
