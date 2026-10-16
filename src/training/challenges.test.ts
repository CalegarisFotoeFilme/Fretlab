import { describe, expect, it } from 'vitest'
import { makeInstrument, midiAt } from '../theory/instrument'
import { SCALES, mod12, pcName } from '../theory/notes'
import { makeChallenge, scaleFromString, inGroups } from './challenges'
import { drillsFor } from './drills'

const instruments = [makeInstrument('bass4'), makeInstrument('bass5'), makeInstrument('bass6'), makeInstrument('guitar6')]
const name = (pc: number) => pcName(pc as never)

describe('desafios do Treino', () => {
  it('todo desafio gera uma sequência tocável, em todo instrumento', () => {
    for (const inst of instruments)
      for (const drill of drillsFor(inst.kind))
        for (let i = 0; i < 60; i++) {
          const c = makeChallenge(inst, drill, name)
          expect(c.seq.length, `${drill.id} ${c.kind} ${inst.kind}`).toBeGreaterThanOrEqual(4)
          for (const p of c.seq) {
            expect(p.string).toBeLessThan(inst.openMidi.length)
            expect(p.fret, `${drill.id} ${c.title}`).toBeGreaterThanOrEqual(0)
            expect(p.fret, `${drill.id} ${c.title}`).toBeLessThanOrEqual(inst.frets)
          }
        }
  })
  it('escala começando num grau, numa corda: primeira nota certa e só notas da escala', () => {
    const inst = makeInstrument('bass4')
    const seq = scaleFromString(inst, 5, SCALES.major.steps, 3, 1, 2) // Fá maior, 3º grau (Lá) na corda A
    expect(mod12(midiAt(inst, seq[0]))).toBe(9)
    expect(seq[0].string).toBe(1)
    const allowed = SCALES.major.steps.map((s) => mod12(5 + s))
    for (const p of seq) expect(allowed).toContain(mod12(midiAt(inst, p)))
  })
  it('grupos de 3: 1-2-3, 2-3-4…', () => {
    const xs = [0, 1, 2, 3].map((f) => ({ string: 0, fret: f }))
    expect(inGroups(xs, 3).slice(0, 6).map((p) => p.fret)).toEqual([0, 1, 2, 1, 2, 3])
  })
  it('não repete o mesmo tipo quando pedido', () => {
    const inst = makeInstrument('guitar6')
    const drill = drillsFor('guitar6').find((d) => d.id === 'pentatonica')!
    for (let i = 0; i < 30; i++) expect(makeChallenge(inst, drill, name, Math.random, 'todas').kind).not.toBe('todas')
  })
})

describe('CAGED', () => {
  it('cada forma tem só notas do acorde e a fundamental', async () => {
    const { cagedShape } = await import('./drills')
    for (const inst of instruments)
      for (let root = 0; root < 12; root++)
        for (let k = 0; k < 5; k++) {
          const pcs = cagedShape(inst, root, k).map((p) => mod12(midiAt(inst, p)))
          expect(pcs, `${inst.kind} ${root} ${k}`).toContain(root)
          for (const pc of pcs) expect([root, mod12(root + 4), mod12(root + 7)]).toContain(pc)
        }
  })
})

describe('slap groove', () => {
  it('cada levada tem 16 semicolcheias, pop duas cordas acima e ghost notes sem altura', async () => {
    const { SLAP_GROOVES, slapSteps } = await import('./slap')
    for (const inst of instruments.filter((i) => i.kind !== 'guitar6'))
      for (const g of SLAP_GROOVES)
        for (let root = 0; root < 12; root++) {
          const steps = slapSteps(inst, g.bar, root, inst.openMidi.length > 4 ? 1 : 0)
          expect(steps, g.name).toHaveLength(16)
          const low = steps.find((s) => s.mark === 'T')!.string
          for (const s of steps) {
            if (s.mark === 'P') expect(s.string).toBe(low + 2)
            expect(s.fret).toBeGreaterThanOrEqual(1)
          }
          // a primeira nota é a tônica
          expect(mod12(midiAt(inst, steps[0]))).toBe(root)
        }
  })
})
