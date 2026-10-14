import type { NoteSetSource } from '../curriculum/types'
import { setPcs, setPositions } from '../exercises/generate'
import { midiAt, type FretPos, type Instrument } from '../theory/instrument'
import { mod12 } from '../theory/notes'

/*
  Treino do Dia, à la Guitar Aerobics (Troy Nelson): um exercício técnico curto por dia, com metrônomo
  e um andamento alvo que sobe quando você toca limpo. Os exercícios aplicam a teoria dos mundos
  (escala, pentatônica, arpejo, oitava) e são gerados para o instrumento configurado.
*/

export interface Drill {
  id: string
  title: string
  /** o que o exercício trabalha */
  focus: string
  how: string
  /** notas por clique do metrônomo (2 = colcheias, 4 = semicolcheias) */
  perBeat: number
  /** andamento inicial sugerido */
  startBpm: number
}

export const DRILLS: Drill[] = [
  {
    id: 'aranha',
    title: 'Aranha cromática',
    focus: 'independência dos dedos e sincronia das mãos',
    how: 'Um dedo por casa (1-2-3-4) em cada corda, subindo da mais grave à mais aguda e voltando. Palhetada alternada ou dedos alternados.',
    perBeat: 4,
    startBpm: 60,
  },
  {
    id: 'pentatonica',
    title: 'Pentatônica menor, caixa 1',
    focus: 'a escala mais usada do rock e do blues',
    how: 'Suba e desça a caixa inteira, duas notas por corda. Mão parada, um dedo por casa.',
    perBeat: 2,
    startBpm: 70,
  },
  {
    id: 'maior',
    title: 'Escala maior na posição',
    focus: 'a régua da teoria, sem mudar de posição',
    how: 'Suba e desça a escala maior com a fundamental no dedo 2. Diga os graus em voz alta na primeira passada.',
    perBeat: 2,
    startBpm: 60,
  },
  {
    id: 'arpejos',
    title: 'Arpejos maior e menor',
    focus: 'enxergar 1, 3 e 5 na posição',
    how: 'Suba o arpejo maior e desça o menor, sem tirar a mão do lugar. Só a terça muda.',
    perBeat: 2,
    startBpm: 60,
  },
  {
    id: 'oitavas',
    title: 'Oitavas pulando corda',
    focus: 'precisão de mão direita e a forma da oitava',
    how: 'Fundamental na corda mais grave, oitava duas cordas acima; suba casa a casa. Abafe a corda do meio.',
    perBeat: 2,
    startBpm: 70,
  },
]

const DAY_MS = 24 * 3600 * 1000
/** Número do dia (local), para sortear o exercício e o tom de forma estável ao longo do dia. */
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS)

export const drillOfDay = (d = new Date()) => DRILLS[dayNumber(d) % DRILLS.length]

/** Tom do dia: um ciclo de tons comuns de rock/pop. */
export const KEYS_CYCLE = [9, 4, 7, 2, 0, 5]
export const keyOfDay = (d = new Date()) => KEYS_CYCLE[dayNumber(d) % KEYS_CYCLE.length]

/** Sobe pelas notas (sem repetir altura) e desce de volta, sem repetir o topo. */
function upAndDown(inst: Instrument, ps: FretPos[]): FretPos[] {
  const byMidi = new Map<number, FretPos>()
  for (const p of [...ps].sort((a, b) => a.string - b.string || a.fret - b.fret)) if (!byMidi.has(midiAt(inst, p))) byMidi.set(midiAt(inst, p), p)
  const up = [...byMidi.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p)
  return [...up, ...up.slice(0, -1).reverse()]
}

/** Fundamental do tom na corda mais grave, a partir da casa 3 (sobra espaço para a posição dos dois lados). */
function rootFret(inst: Instrument, root: number) {
  const f = mod12(root - inst.openMidi[0])
  return f < 3 ? f + 12 : f
}

function inPosition(inst: Instrument, root: number, set: NoteSetSource, offset: number, width: number) {
  const r = rootFret(inst, root)
  return setPositions(inst, setPcs(root, set), r + offset, r + offset + width)
}

/** Sequência de posições (na ordem de tocar) do exercício, para o instrumento e o tom. */
export function drillSequence(inst: Instrument, drill: Drill, root: number): FretPos[] {
  const n = inst.openMidi.length
  switch (drill.id) {
    case 'aranha': {
      const start = 1
      const up = Array.from({ length: n }, (_, s) => [0, 1, 2, 3].map((i) => ({ string: s, fret: start + i }))).flat()
      const down = Array.from({ length: n }, (_, k) => n - 1 - k).flatMap((s) => [3, 2, 1, 0].map((i) => ({ string: s, fret: start + i })))
      return [...up, ...down]
    }
    case 'pentatonica':
      return upAndDown(inst, inPosition(inst, root, { scale: 'minorPentatonic' }, 0, 3))
    case 'maior':
      return upAndDown(inst, inPosition(inst, root, { scale: 'major' }, -1, 4))
    case 'arpejos': {
      const up = upAndDown(inst, inPosition(inst, root, { chord: 'maj' }, -1, 3))
      const minor = upAndDown(inst, inPosition(inst, root, { chord: 'min' }, -1, 3))
      // sobe o maior (até o topo) e desce o menor (do topo)
      return [...up.slice(0, Math.ceil(up.length / 2)), ...minor.slice(Math.floor(minor.length / 2))]
    }
    case 'oitavas': {
      // 6 casas subindo + a oitava 2 casas à frente: se não couber no braço, começa uma oitava abaixo
      let r = rootFret(inst, root)
      if (r + 7 > inst.frets && r >= 12) r -= 12
      const top = Math.min(2, n - 1)
      return Array.from({ length: 6 }, (_, i) => [
        { string: 0, fret: r + i },
        { string: top, fret: r + i + (top === 2 ? 2 : 0) },
      ]).flat()
    }
  }
  return []
}

// ---------- Revisão espaçada (lições) ----------

export interface ReviewItem {
  lessonId: string
  stars: number
  lastPlayedAt: number
}

/** Dias até a próxima revisão, pelas estrelas: errou (0) volta logo; dominou (3) volta em uma semana. */
export const REVIEW_DAYS = [0, 1, 3, 7] as const

/** Lições vencidas para revisar, das mais atrasadas para as menos. */
export function dueReviews(items: ReviewItem[], now = Date.now()): ReviewItem[] {
  return items
    .map((it) => ({ it, overdue: now - (it.lastPlayedAt + REVIEW_DAYS[Math.min(3, it.stars)] * DAY_MS) }))
    .filter((x) => x.overdue >= 0)
    .sort((a, b) => b.overdue - a.overdue)
    .map((x) => x.it)
}
