import { CHORDS, SCALES, mod12, type ChordQuality, type PitchClass, type ScaleId } from './notes'

/*
  Análise harmônica de uma música a partir das notas (sem depender do leitor de tablatura).
  - acorde de um trecho: compara o "peso" de cada nota (duração) com as fórmulas de acorde;
  - grau (algarismo romano) e função do acorde na tonalidade;
  - nota de repouso: a mais longa, valorizando o tempo forte e o fim do compasso;
  - escalas que contêm as notas do trecho;
  - progressão que mais se repete.
*/

export interface Key {
  root: PitchClass
  mode: 'major' | 'minor'
}

export interface ChordGuess {
  root: PitchClass
  quality: ChordQuality
  /** fração do peso do trecho coberta pelas notas do acorde (0..1) */
  fit: number
}

// acordes menos comuns precisam de mais evidência (evita "C7M" num riff ou "Asus4" por nota de passagem)
const RARITY: Partial<Record<ChordQuality, number>> = { dom7: 0.1, min7: 0.1, sus2: 0.1, sus4: 0.1, dim: 0.12, maj7: 0.14, m7b5: 0.14, aug: 0.16 }

const MINORISH: ChordQuality[] = ['min', 'min7', 'dim', 'm7b5']
const QUALITY_SUFFIX: Partial<Record<ChordQuality, string>> = {
  dim: '°',
  aug: '+',
  maj7: '7M',
  dom7: '7',
  min7: '7',
  m7b5: 'ø',
  pow: '5',
  sus2: 'sus2',
  sus4: 'sus4',
}

/**
 * Acorde que melhor explica um histograma de classes de altura.
 * `bass` (opcional) reforça a fundamental quando ela está no grave.
 */
export function detectChord(hist: number[], bass: number[] = []): ChordGuess | null {
  const total = hist.reduce((s, v) => s + v, 0)
  if (total <= 0) return null
  const bassTotal = bass.reduce((s, v) => s + v, 0) || 1
  let best: ChordGuess | null = null
  let bestScore = -Infinity
  for (let root = 0; root < 12; root++) {
    if (hist[root] < total * 0.04) continue // a fundamental precisa soar
    for (const [q, { formula }] of Object.entries(CHORDS) as [ChordQuality, (typeof CHORDS)[ChordQuality]][]) {
      let covered = 0
      let missing = 0
      for (const step of formula) {
        const w = hist[mod12(root + step)]
        covered += w
        // a quinta pode faltar sem descaracterizar o acorde
        if (w < total * 0.04) missing += step === 7 ? 0.4 : 1
      }
      const outside = total - covered
      const score =
        covered -
        0.6 * outside -
        0.25 * total * missing -
        (RARITY[q] ?? 0) * total +
        0.35 * total * ((bass[root] ?? 0) / bassTotal)
      if (score > bestScore) {
        bestScore = score
        best = { root, quality: q, fit: covered / total }
      }
    }
  }
  return best
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const MODE_STEPS = { major: SCALES.major.steps, minor: SCALES.minor.steps }

/** Grau do acorde na tonalidade: "vi", "bVII", "V7"… */
export function romanOf(root: PitchClass, quality: ChordQuality, key: Key): string {
  const steps: readonly number[] = MODE_STEPS[key.mode]
  const iv = mod12(root - key.root)
  let numeral: string
  const at = steps.indexOf(iv)
  if (at >= 0) numeral = ROMAN[at]
  else if (key.mode === 'major' || iv === 1) {
    // grau cromático: bemol do grau de cima (bVII, bVI, bIII…)
    numeral = 'b' + ROMAN[steps.findIndex((s) => s > iv)]
  } else {
    // na menor: sustenido do grau de baixo (#VII = sensível, #III…)
    numeral = '#' + ROMAN[steps.findLastIndex((s) => s < iv)]
  }
  const minorish = MINORISH.includes(quality)
  const body = minorish ? numeral.replace(/[IV]+/, (m) => m.toLowerCase()) : numeral
  return body + (QUALITY_SUFFIX[quality] ?? '')
}

/** O acorde pertence ao campo harmônico (todas as notas na escala)? */
export function isDiatonic(root: PitchClass, quality: ChordQuality, key: Key) {
  const scale = MODE_STEPS[key.mode].map((s) => mod12(key.root + s))
  return CHORDS[quality].formula.every((s) => scale.includes(mod12(root + s)))
}

export type HarmonicFunction = 'tônica' | 'subdominante' | 'dominante'

/** Função harmônica dos graus diatônicos (I/iii/vi tônica; ii/IV subdominante; V/vii dominante). */
export function functionOf(root: PitchClass, key: Key): HarmonicFunction | null {
  const at = (MODE_STEPS[key.mode] as readonly number[]).indexOf(mod12(root - key.root))
  if (at < 0) return null
  return (['tônica', 'subdominante', 'tônica', 'subdominante', 'dominante', 'tônica', 'dominante'] as const)[at]
}

export interface TimedNote {
  midi: number
  /** duração (qualquer unidade) */
  dur: number
  /** posição no compasso, 0..1 */
  pos: number
}

/** Nota de repouso de um trecho: a mais longa, com bônus no tempo forte e no fim do compasso. */
export function restingNote(notes: TimedNote[]): TimedNote | null {
  if (!notes.length) return null
  const last = Math.max(...notes.map((n) => n.pos))
  let best = notes[0]
  let bestW = -1
  for (const n of notes) {
    const strong = n.pos < 0.01 ? 1.5 : Math.abs(n.pos - 0.5) < 0.01 ? 1.2 : 1
    const w = n.dur * strong * (n.pos === last ? 1.3 : 1)
    if (w > bestW) [best, bestW] = [n, w]
  }
  return best
}

export interface ScaleFit {
  root: PitchClass
  scale: ScaleId
  /** fração do peso coberta pela escala */
  fit: number
}

/**
 * Escalas (sobre as fundamentais sugeridas) que contêm as notas do trecho. Ordem: as que cobrem mais,
 * depois as que ficam dentro do tom (`context`), depois a fundamental preferida e as mais simples.
 */
export function fittingScales(hist: number[], roots: PitchClass[], context: PitchClass[] = [], min = 0.97): ScaleFit[] {
  const total = hist.reduce((s, v) => s + v, 0)
  if (total <= 0) return []
  const out: (ScaleFit & { order: number })[] = []
  ;[...new Set(roots)].forEach((root, ri) => {
    for (const [id, { steps }] of Object.entries(SCALES) as [ScaleId, (typeof SCALES)[ScaleId]][]) {
      const pcs = steps.map((s) => mod12(root + s))
      const fit = pcs.reduce((s, pc) => s + hist[pc], 0) / total
      const foreign = context.length ? pcs.filter((pc) => !context.includes(pc)).length : 0
      if (fit >= min) out.push({ root, scale: id, fit, order: foreign * 1000 + ri * 100 + steps.length })
    }
  })
  return out.sort((a, b) => b.fit - a.fit || a.order - b.order).map(({ root, scale, fit }) => ({ root, scale, fit }))
}

export interface ProgressionFound {
  /** índice do primeiro compasso da ocorrência mais antiga */
  start: number
  length: number
  count: number
}

/**
 * Sequência de compassos (pelo rótulo do acorde) que mais se repete: prioriza ciclos de 4,
 * depois 8 e 2 compassos. Compassos sem acorde (null) não entram.
 */
export function findProgression(labels: (string | null)[]): ProgressionFound | null {
  let best: (ProgressionFound & { rank: number }) | null = null
  for (const length of [4, 8, 2]) {
    const seen = new Map<string, { start: number; count: number; last: number }>()
    for (let i = 0; i + length <= labels.length; i++) {
      const win = labels.slice(i, i + length)
      if (win.some((l) => l === null)) continue
      // um ciclo de um acorde só não é progressão
      if (new Set(win).size < 2) continue
      const k = win.join('|')
      const e = seen.get(k)
      if (!e) seen.set(k, { start: i, count: 1, last: i })
      else if (i >= e.last + length) {
        e.count++
        e.last = i
      }
    }
    for (const { start, count } of seen.values()) {
      if (count < 2) continue
      // compassos cobertos, preferindo ciclos de 4 (o mais comum na música popular)
      const rank = count * length * (length === 4 ? 1.5 : length === 8 ? 1 : 0.8)
      if (!best || rank > best.rank) best = { start, length, count, rank }
    }
  }
  return best && { start: best.start, length: best.length, count: best.count }
}
