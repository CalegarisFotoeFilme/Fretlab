// Avaliação de ritmo: compara os ataques esperados com os toques/ataques reais.

export type Figure = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export interface RhythmEvent {
  figure: Figure
  rest?: boolean
  /** figura pontuada: vale 1,5× */
  dotted?: boolean
  /** parte de uma tercina: vale 2/3 da figura */
  triplet?: boolean
}

/** Duração em tempos (semínima = 1). */
export const FIGURE_BEATS: Record<Figure, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25,
}

export const FIGURE_LABEL: Record<Figure, string> = {
  whole: 'Semibreve', half: 'Mínima', quarter: 'Semínima', eighth: 'Colcheia', sixteenth: 'Semicolcheia',
}

/** Duração do evento em tempos, com ponto e tercina. */
export const eventBeats = (e: RhythmEvent) => FIGURE_BEATS[e.figure] * (e.dotted ? 1.5 : 1) * (e.triplet ? 2 / 3 : 1)

/** Posição (em tempos) de cada ataque não-pausa. */
export function onsetBeats(events: RhythmEvent[]): number[] {
  const out: number[] = []
  let t = 0
  for (const e of events) {
    if (!e.rest) out.push(t)
    t += eventBeats(e)
  }
  return out
}

/** Total em tempos (arredondado para absorver o 2/3 das tercinas). */
export const totalBeats = (events: RhythmEvent[]) => Math.round(events.reduce((s, e) => s + eventBeats(e), 0) * 1000) / 1000

export interface HitResult {
  expectedMs: number
  offsetMs: number | null // null = errou (não tocou)
  grade: 'perfect' | 'good' | 'late' | 'early' | 'miss'
}

export interface RhythmScore {
  hits: HitResult[]
  extra: number // toques que não correspondem a nenhuma nota
  accuracy: number // 0..1
  meanAbsOffsetMs: number
}

export const WINDOWS = { perfect: 45, good: 90, ok: 160 }

/**
 * Pareia cada ataque esperado com o toque mais próximo dentro da janela.
 * Todos os tempos em ms, relativos ao mesmo zero.
 */
export function scoreRhythm(expectedMs: number[], tapsMs: number[]): RhythmScore {
  const used = new Set<number>()
  const hits: HitResult[] = expectedMs.map((exp) => {
    let best = -1
    let bestDist = Infinity
    tapsMs.forEach((tap, i) => {
      const d = Math.abs(tap - exp)
      if (!used.has(i) && d < bestDist && d <= WINDOWS.ok) {
        best = i
        bestDist = d
      }
    })
    if (best < 0) return { expectedMs: exp, offsetMs: null, grade: 'miss' as const }
    used.add(best)
    const off = tapsMs[best] - exp
    const a = Math.abs(off)
    const grade = a <= WINDOWS.perfect ? 'perfect' : a <= WINDOWS.good ? 'good' : off > 0 ? 'late' : 'early'
    return { expectedMs: exp, offsetMs: off, grade }
  })
  const weights = { perfect: 1, good: 0.8, late: 0.4, early: 0.4, miss: 0 }
  const extra = tapsMs.length - used.size
  const raw = hits.reduce((s, h) => s + weights[h.grade], 0) / Math.max(1, hits.length)
  const penalty = Math.min(0.5, extra * 0.1)
  const matched = hits.filter((h) => h.offsetMs !== null)
  return {
    hits,
    extra,
    accuracy: Math.max(0, raw - penalty),
    meanAbsOffsetMs: matched.length
      ? Math.round(matched.reduce((s, h) => s + Math.abs(h.offsetMs!), 0) / matched.length)
      : 0,
  }
}
