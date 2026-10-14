import { midiAt, type FretPos, type Instrument } from '../theory/instrument'
import { SCALES, mod12 } from '../theory/notes'

/*
  Treino do Dia, à la Guitar Aerobics (Troy Nelson): um exercício técnico curto por dia, com metrônomo
  e um andamento alvo que sobe quando você toca limpo. Cada exercício tem várias posições no braço;
  o tom e a posição rodam dia a dia (e podem ser escolhidos), para o braço inteiro ser treinado.
*/

export interface Drill {
  id: string
  title: string
  /** o que o exercício trabalha, em poucas palavras */
  focus: string
  /** por que fazer: o que desenvolve e como se liga à teoria */
  why: string
  how: string
  /** notas por clique do metrônomo (2 = colcheias, 4 = semicolcheias) */
  perBeat: number
  startBpm: number
  /** quantas posições o exercício tem no braço */
  positions: number
  positionLabel: (i: number) => string
  /** usa tom? (a aranha cromática não tem tom) */
  usesKey: boolean
  /** lição da trilha que o exercício reforça */
  lesson?: string
  /** dicas do professor (botão Dica), da mais geral à mais específica */
  tips: string[]
}

const ARPEGGIO_SHAPES = [
  { string: 0, name: 'forma de E (fundamental na corda mais grave)' },
  { string: 1, name: 'forma de A (fundamental na 2ª corda)' },
  { string: 2, name: 'forma de D (fundamental na 3ª corda)' },
]

export const DRILLS: Drill[] = [
  {
    id: 'aranha',
    title: 'Aranha cromática',
    focus: 'independência dos dedos e sincronia das mãos',
    why: 'É o aquecimento clássico: um dedo por casa obriga os quatro dedos a trabalharem por igual, e a palhetada (ou os dedos) alternada precisa cair junto com a mão esquerda. Ela prepara a mão para tocar por posição, que é como as escalas e arpejos do resto do treino são estudados.',
    how: 'Um dedo por casa (1-2-3-4) em cada corda, subindo da mais grave à mais aguda e voltando pelas mesmas casas. Palhetada alternada (ou dedos alternados).',
    perBeat: 4,
    startBpm: 60,
    positions: 3,
    positionLabel: (i) => `casas ${1 + i * 4} a ${4 + i * 4}`,
    usesKey: false,
    lesson: 'w1-cordas-soltas',
    tips: ['Comece 10–20 BPM abaixo do que consegue: a meta é tocar sem nenhuma nota abafada. Deixe cada dedo encostado na corda até o próximo precisar dela.', 'Polegar atrás do braço, mais ou menos atrás do dedo 2; dedos curvados, pontas na corda, logo atrás do traste. Se a mão cansar, você está apertando demais.'],
  },
  {
    id: 'pentatonica',
    title: 'Pentatônica menor',
    focus: 'a escala mais usada do rock e do blues, nas 5 caixas',
    why: 'A pentatônica menor é o vocabulário básico de solos e linhas de baixo. Estudar as cinco caixas, uma por dia, liga o braço inteiro: o fim de uma caixa é o começo da outra, como no CAGED. Dizer os graus (1, b3, 4, 5, b7) enquanto toca fixa a teoria nos dedos.',
    how: 'Duas notas por corda, subindo e descendo a caixa inteira. Mão parada na posição; as fundamentais (laranja) são o ponto de referência.',
    perBeat: 2,
    startBpm: 70,
    positions: 5,
    positionLabel: (i) => `caixa ${i + 1}`,
    usesKey: true,
    lesson: 'w4-pentatonica-menor',
    tips: ['Ache primeiro as fundamentais (laranja): elas são os pilares da caixa. Diga os graus em voz alta na primeira passada (1, b3, 4, 5, b7).', 'Para ficar musical, depois de limpa, troque a ordem: suba de duas em duas notas, ou faça frases curtas terminando na fundamental.'],
  },
  {
    id: 'maior',
    title: 'Escala maior, 3 notas por corda',
    focus: 'a escala-régua da teoria, em 7 posições',
    why: 'A escala maior é a régua de toda a teoria: graus, intervalos, acordes e campo harmônico saem dela. Três notas por corda deixa a digitação regular (sempre 3 notas em cada corda) e, a cada dia, começa num grau diferente, cobrindo o braço em 7 posições.',
    how: 'Três notas em cada corda, subindo e descendo. Comece devagar e use sempre o mesmo dedo para o mesmo intervalo (tom = dedos abertos, semitom = dedos colados).',
    perBeat: 2,
    startBpm: 60,
    positions: 7,
    positionLabel: (i) => `começando no ${i + 1}º grau`,
    usesKey: true,
    lesson: 'w4-maior-posicao',
    tips: ['Em 3 notas por corda, a mão abre um pouco mais: use dedos 1-2-4 quando houver tom + tom, e 1-3-4 quando houver semitom + tom.', 'Ao trocar de corda, a mão desliza uma ou duas casas: faça a troca sem parar o pulso do metrônomo, e repare onde caem os semitons (3–4 e 7–8).'],
  },
  {
    id: 'arpejos',
    title: 'Arpejos maior e menor',
    focus: 'enxergar 1, 3 e 5 nas formas E, A e D',
    why: 'Arpejo é o acorde nota por nota: é o que o baixista toca para "contar" a harmonia e o que o guitarrista usa para solar em cima de cada acorde. Subir o maior e descer o menor na mesma forma mostra que só a terça muda (3 → b3).',
    how: 'Suba o arpejo maior e desça o menor, sem tirar a mão do lugar. Fundamental e quinta ficam paradas; só a terça desce meio tom (3 → b3), às vezes trocando de corda para caber na mão.',
    perBeat: 2,
    startBpm: 60,
    positions: ARPEGGIO_SHAPES.length,
    positionLabel: (i) => ARPEGGIO_SHAPES[i].name,
    usesKey: true,
    lesson: 'w5-arpejo-maior',
    tips: ['Pense no acorde inteiro antes de tocar: onde estão o 1, o 3 e o 5 nessa forma. A fundamental (laranja) é o ponto de partida e de chegada.', 'Toque cada nota separada (sem deixar soar junto), com o mesmo volume. Na volta, só a terça muda: escute a diferença entre maior e menor.'],
  },
  {
    id: 'oitavas',
    title: 'Oitavas pulando corda',
    focus: 'precisão da mão que toca e a forma da oitava',
    why: 'A oitava é a forma mais útil para se achar no braço (mundo de Intervalos) e a base de muitas linhas de baixo de funk e disco. Pular uma corda treina a precisão da mão que toca e o abafamento da corda do meio.',
    how: 'Fundamental na corda grave, oitava duas cordas acima; suba casa a casa. Abafe a corda do meio com a ponta do dedo que segura a nota grave.',
    perBeat: 2,
    startBpm: 70,
    positions: 2,
    positionLabel: (i) => (i === 0 ? 'cordas 1ª e 3ª mais graves' : 'cordas 2ª e 4ª mais graves'),
    usesKey: true,
    lesson: 'w3-oitava',
    tips: ['A mão que toca precisa “pular” a corda do meio: mire a corda de cima com calma no começo, mesmo se o andamento ficar lento.', 'Abafe a corda do meio com a parte de baixo do dedo que pressiona a nota grave; no baixo, também dá para usar o polegar ou a palma da mão que toca.'],
  },
]

const DAY_MS = 24 * 3600 * 1000
/** Número do dia (local), para sortear exercício, tom e posição de forma estável ao longo do dia. */
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS)

export const drillOfDay = (d = new Date()) => DRILLS[dayNumber(d) % DRILLS.length]

/** Tom do dia: percorre o ciclo das quintas, para todos os tons aparecerem. */
export const KEYS_CYCLE = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2]
export const keyOfDay = (d = new Date()) => KEYS_CYCLE[Math.floor(dayNumber(d) / DRILLS.length) % KEYS_CYCLE.length]

/** Posição do dia de um exercício (muda a cada volta pelos exercícios). */
export const positionOfDay = (drill: Drill, d = new Date()) => Math.floor(dayNumber(d) / DRILLS.length) % drill.positions

/** Casa da nota na corda, a partir de `min` (para sobrar espaço para a posição). */
function fretOn(inst: Instrument, string: number, pc: number, min: number) {
  const f = mod12(pc - inst.openMidi[string])
  return f < min ? f + 12 : f
}

/** Sobe e depois desce, sem repetir o topo. */
const upAndDown = (up: FretPos[]) => [...up, ...up.slice(0, -1).reverse()]

/** Desce uma oitava se a posição passar do fim do braço (e couber). */
function fitNeck(inst: Instrument, ps: FretPos[]) {
  const max = Math.max(...ps.map((p) => p.fret))
  if (max <= inst.frets) return ps
  const lowered = ps.map((p) => ({ ...p, fret: p.fret - 12 }))
  return lowered.every((p) => p.fret >= 0) ? lowered : ps
}

/**
 * Escala "n notas por corda": a partir do grau `start` (0 = tônica) na corda mais grave, cada corda
 * recebe as próximas `perString` notas da escala, subindo. Com 2 por corda na pentatônica saem as 5
 * caixas; com 3 por corda na maior, as 7 posições.
 */
function scaleByString(inst: Instrument, root: number, steps: readonly number[], perString: number, start: number): FretPos[] {
  const r = inst.openMidi[0] + fretOn(inst, 0, root, 1)
  const pitches: number[] = []
  for (let oct = 0; pitches.length < start + perString * inst.openMidi.length; oct++) for (const s of steps) pitches.push(r + 12 * oct + s)
  const seq = pitches.slice(start)
  const out: FretPos[] = []
  inst.openMidi.forEach((open, string) => {
    for (let k = 0; k < perString; k++) out.push({ string, fret: seq[string * perString + k] - open })
  })
  return fitNeck(inst, out)
}

/** Arpejo (tríade) na forma cuja fundamental está em `string`: notas do acorde nas 4 casas da forma. */
function arpeggio(inst: Instrument, root: number, string: number, third: 3 | 4): FretPos[] {
  const s = Math.min(string, inst.openMidi.length - 1)
  const f = fretOn(inst, s, root, 1)
  const pcs = [root, mod12(root + third), mod12(root + 7)]
  const out: FretPos[] = []
  inst.openMidi.forEach((open, str) => {
    for (let fret = Math.max(0, f - 1); fret <= f + 3; fret++) if (pcs.includes(mod12(open + fret)) && (str > s || (str === s && fret >= f))) out.push({ string: str, fret })
  })
  // uma posição por altura, subindo
  const byPitch = new Map<number, FretPos>()
  for (const p of out.sort((a, b) => a.string - b.string || a.fret - b.fret)) if (!byPitch.has(midiAt(inst, p))) byPitch.set(midiAt(inst, p), p)
  return [...byPitch.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p)
}

/** Sequência de posições (na ordem de tocar) do exercício, para o instrumento, o tom e a posição. */
export function drillSequence(inst: Instrument, drill: Drill, root: number, position = 0): FretPos[] {
  const n = inst.openMidi.length
  const pos = ((position % drill.positions) + drill.positions) % drill.positions
  switch (drill.id) {
    case 'aranha': {
      const start = 1 + pos * 4
      const up = Array.from({ length: n }, (_, s) => [0, 1, 2, 3].map((i) => ({ string: s, fret: start + i }))).flat()
      const down = Array.from({ length: n }, (_, k) => n - 1 - k).flatMap((s) => [3, 2, 1, 0].map((i) => ({ string: s, fret: start + i })))
      return [...up, ...down]
    }
    case 'pentatonica':
      return upAndDown(scaleByString(inst, root, SCALES.minorPentatonic.steps, 2, pos))
    case 'maior':
      return upAndDown(scaleByString(inst, root, SCALES.major.steps, 3, pos))
    case 'arpejos': {
      const { string } = ARPEGGIO_SHAPES[pos]
      const major = arpeggio(inst, root, string, 4)
      const minor = arpeggio(inst, root, string, 3)
      // sobe o maior e desce o menor, na mesma forma
      return fitNeck(inst, [...major, ...minor.slice(0, -1).reverse()])
    }
    case 'oitavas': {
      const low = Math.min(pos, n - 3)
      const high = low + 2
      const shift = 12 - (inst.openMidi[high] - inst.openMidi[low])
      const r = fretOn(inst, low, root, 1)
      const seq = Array.from({ length: 6 }, (_, i) => [
        { string: low, fret: r + i },
        { string: high, fret: r + i + shift },
      ]).flat()
      return fitNeck(inst, seq)
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
