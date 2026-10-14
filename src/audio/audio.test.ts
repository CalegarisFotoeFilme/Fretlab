import { describe, expect, it } from 'vitest'
import { NoteStabilizer, PitchAnalyzer } from './pitch'
import { onsetBeats, scoreRhythm } from '../exercises/rhythmScore'

function sine(freq: number, size: number, sr: number, amp = 0.3) {
  const b = new Float32Array(size)
  // fundamental + harmônicos, parecido com corda
  for (let i = 0; i < size; i++) {
    const t = i / sr
    b[i] = amp * (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(4 * Math.PI * freq * t) + 0.25 * Math.sin(6 * Math.PI * freq * t))
  }
  return b
}

describe('detecção de altura', () => {
  const sr = 48000
  const an = new PitchAnalyzer(4096)

  it.each([
    [41.2, 28], // E1 (baixo, corda solta)
    [55, 33], // A1
    [110, 45], // A2
    [329.63, 64], // E4
  ])('%f Hz → MIDI %i', (f, midi) => {
    const r = an.analyze(sine(f, 4096, sr), sr)
    expect(r).not.toBeNull()
    expect(Math.round(r!.midi)).toBe(midi)
  })

  it('ignora silêncio', () => {
    expect(an.analyze(new Float32Array(4096), sr)).toBeNull()
  })

  it('estabiliza antes de confirmar', () => {
    const st = new NoteStabilizer(3)
    const r = an.analyze(sine(110, 4096, sr), sr)
    expect(st.push(r)).toBeNull()
    expect(st.push(r)).toBeNull()
    expect(st.push(r)).toBe(45)
    expect(st.push(r)).toBeNull() // mesma nota sustentada não reemite
    st.push(null)
    st.push(null)
    st.push(r)
    st.push(r)
    expect(st.push(r)).toBe(45) // novo ataque
  })
})

describe('ritmo', () => {
  it('calcula ataques', () => {
    expect(onsetBeats([{ figure: 'quarter' }, { figure: 'eighth' }, { figure: 'eighth', rest: true }, { figure: 'half' }])).toEqual([0, 1, 2])
  })

  it('pontua timing', () => {
    const s = scoreRhythm([0, 500, 1000, 1500], [10, 560, 1130, 3000])
    expect(s.hits.map((h) => h.grade)).toEqual(['perfect', 'good', 'late', 'miss'])
    expect(s.extra).toBe(1)
    expect(s.accuracy).toBeGreaterThan(0.4)
    expect(s.accuracy).toBeLessThan(0.7)
  })
})
