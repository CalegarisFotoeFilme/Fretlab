import { describe, expect, it } from 'vitest'
import { makeInstrument, midiAt } from '../theory/instrument'
import { DRILLS, dayNumber, drillOfDay, drillSequence, dueReviews } from './drills'

const instruments = [makeInstrument('bass4'), makeInstrument('bass5'), makeInstrument('guitar6')]

describe('Treino do Dia', () => {
  it('todo exercício gera uma sequência tocável em todo instrumento e tom', () => {
    for (const inst of instruments)
      for (const drill of DRILLS)
        for (let root = 0; root < 12; root++) {
          const seq = drillSequence(inst, drill, root)
          expect(seq.length, `${drill.id} ${inst.kind} ${root}`).toBeGreaterThanOrEqual(8)
          for (const p of seq) {
            expect(p.string).toBeLessThan(inst.openMidi.length)
            expect(p.fret).toBeGreaterThanOrEqual(0)
            expect(p.fret).toBeLessThanOrEqual(inst.frets)
          }
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
