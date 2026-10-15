import { describe, expect, it } from 'vitest'
import { makeInstrument, midiAt } from '../theory/instrument'
import { SCALES, mod12 } from '../theory/notes'
import { DRILLS, dayNumber, drillOfDay, drillSequence, drillsFor, dueReviews } from './drills'

const instruments = [makeInstrument('bass4'), makeInstrument('bass5'), makeInstrument('guitar6')]

describe('Treino do Dia', () => {
  it('todo exercício gera uma sequência tocável em todo instrumento, tom e posição', () => {
    for (const inst of instruments)
      for (const drill of drillsFor(inst.kind))
        for (let pos = 0; pos < drill.positions; pos++)
        for (let root = 0; root < 12; root++) {
          const seq = drillSequence(inst, drill, root, pos)
          // arpejos nas cordas agudas do baixo de 4 cordas têm menos notas (só sobram 2–3 cordas)
          expect(seq.length, `${drill.id} ${inst.kind} ${root} ${pos}`).toBeGreaterThanOrEqual(drill.id === 'arpejos' || drill.id === 'sweep' || drill.id === 'caged' ? 5 : 8)
          for (const p of seq) {
            expect(p.string).toBeLessThan(inst.openMidi.length)
            expect(p.fret).toBeGreaterThanOrEqual(0)
            expect(p.fret).toBeLessThanOrEqual(inst.frets)
          }
        }
  })

  it('técnica: cada instrumento vê só os seus exercícios', () => {
    expect(drillsFor('bass4').map((d) => d.id)).toContain('slap')
    expect(drillsFor('bass4').map((d) => d.id)).not.toContain('sweep')
    expect(drillsFor('guitar6').map((d) => d.id)).toContain('legato')
    expect(drillsFor('guitar6').map((d) => d.id)).not.toContain('walking')
  })

  it('walking: quatro notas por acorde, começando na fundamental', () => {
    for (const inst of instruments.filter((i) => i.kind !== 'guitar6')) {
      const seq = drillSequence(inst, DRILLS.find((d) => d.id === 'walking')!, 7, 0).map((p) => mod12(midiAt(inst, p)))
      expect(seq.length).toBe(16)
      expect([seq[0], seq[4], seq[8], seq[12]]).toEqual([7, 0, 2, 7])
    }
  })

  it('escalas sobem e depois descem', () => {
    const inst = instruments[2]
    const seq = drillSequence(inst, DRILLS.find((d) => d.id === 'pentatonica')!, 9).map((p) => midiAt(inst, p))
    const top = seq.indexOf(Math.max(...seq))
    for (let i = 1; i <= top; i++) expect(seq[i]).toBeGreaterThan(seq[i - 1])
    for (let i = top + 1; i < seq.length; i++) expect(seq[i]).toBeLessThan(seq[i - 1])
    expect(seq.at(-1)).toBe(seq[0])
  })

  it('caixas e posições: só notas da escala, com o número certo de notas por corda, e mão numa região', () => {
    for (const inst of instruments) {
      const n = inst.openMidi.length
      for (const [id, steps, perString, positions] of [
        ['pentatonica', SCALES.minorPentatonic.steps, 2, 5],
        ['maior', SCALES.major.steps, 3, 7],
      ] as const)
        for (let pos = 0; pos < positions; pos++)
          for (let root = 0; root < 12; root++) {
            const seq = drillSequence(inst, DRILLS.find((d) => d.id === id)!, root, pos)
            const up = seq.slice(0, n * perString)
            for (const p of up) expect(steps.map((s) => mod12(root + s))).toContain(mod12(midiAt(inst, p)))
            for (let s = 0; s < n; s++) expect(up.filter((p) => p.string === s)).toHaveLength(perString)
            const frets = up.map((p) => p.fret)
            // a posição cabe na mão (com a abertura de um dedo a mais na corda Si da guitarra)
            expect(Math.max(...frets) - Math.min(...frets), `${id} ${inst.kind} ${root} ${pos}`).toBeLessThanOrEqual(perString === 3 ? 6 : 5)
          }
    }
  })

  it('o exercício do dia muda de um dia para o outro e é estável no mesmo dia', () => {
    const a = new Date(2026, 9, 14, 8)
    const b = new Date(2026, 9, 14, 22)
    const c = new Date(2026, 9, 15, 8)
    expect(dayNumber(a)).toBe(dayNumber(b))
    expect(drillOfDay(a).id).toBe(drillOfDay(b).id)
    expect(drillOfDay(a).id).not.toBe(drillOfDay(c).id)
  })

  it('revisão espaçada: menos estrelas voltam antes', () => {
    const day = 24 * 3600 * 1000
    const now = Date.now()
    const due = dueReviews(
      [
        { lessonId: 'dominada-ontem', stars: 3, lastPlayedAt: now - day },
        { lessonId: 'fraca-ontem', stars: 1, lastPlayedAt: now - day },
        { lessonId: 'reprovada', stars: 0, lastPlayedAt: now - 1000 },
        { lessonId: 'dominada-faz-tempo', stars: 3, lastPlayedAt: now - 10 * day },
      ],
      now,
    ).map((d) => d.lessonId)
    // a mais atrasada primeiro: a reprovada já venceu há 1 s; a fraca de ontem vence agora
    expect(due).toEqual(['dominada-faz-tempo', 'reprovada', 'fraca-ontem'])
  })
})

describe('sentido do exercício', () => {
  it('só sobe termina na nota mais aguda; só desce começa nela', async () => {
    const { withDirection } = await import('./drills')
    const inst = instruments[2]
    const drill = DRILLS.find((d) => d.id === 'pentatonica')!
    const seq = drillSequence(inst, drill, 9, 0)
    const top = Math.max(...seq.map((p) => midiAt(inst, p)))
    const up = withDirection(inst, drill, seq, 'up')
    const down = withDirection(inst, drill, seq, 'down')
    expect(midiAt(inst, up.at(-1)!)).toBe(top)
    expect(midiAt(inst, down[0])).toBe(top)
    expect(up.length + down.length - 1).toBe(seq.length)
  })
})
