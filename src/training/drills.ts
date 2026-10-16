import { midiAt, type FretPos, type Instrument, type InstrumentKind } from '../theory/instrument'
import { SLAP_GROOVES, slapSteps, type Step } from './slap'
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
  /** exercício de técnica de um instrumento só */
  instrument?: 'bass' | 'guitar'
}

/** As cinco formas do CAGED: corda da fundamental (0 = mais grave), início da janela e largura. */
export const CAGED_SHAPES = [
  { name: 'C', string: 1, offset: -3, width: 3 },
  { name: 'A', string: 1, offset: 0, width: 3 },
  { name: 'G', string: 0, offset: -3, width: 3 },
  { name: 'E', string: 0, offset: 0, width: 3 },
  { name: 'D', string: 2, offset: 0, width: 3 },
] as const

/** Notas de um acorde (intervalos a partir da fundamental) dentro da forma do CAGED, da mais grave à mais aguda. */
export function cagedShape(inst: Instrument, root: number, shape: number, intervals: readonly number[] = [0, 4, 7]): FretPos[] {
  const sh = CAGED_SHAPES[shape % CAGED_SHAPES.length]
  const s = Math.min(sh.string, inst.openMidi.length - 1)
  const f = fretOn(inst, s, root, Math.max(1, -sh.offset))
  const lo = f + sh.offset
  const pcs = intervals.map((i) => mod12(root + i))
  const byPitch = new Map<number, FretPos>()
  inst.openMidi.forEach((open, string) => {
    for (let fret = lo; fret <= lo + sh.width; fret++) {
      const midi = open + fret
      if (pcs.includes(mod12(midi)) && !byPitch.has(midi)) byPitch.set(midi, { string, fret })
    }
  })
  return fitNeck(inst, [...byPitch.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p))
}

/** Casa onde começa a janela da forma (para ordenar as formas pelo braço). */
export const cagedStart = (inst: Instrument, root: number, shape: number) => Math.min(...cagedShape(inst, root, shape).map((p) => p.fret))

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
  {
    id: 'caged',
    title: 'CAGED pelo braço',
    focus: 'as cinco formas do acorde maior, no mesmo tom',
    why: 'O CAGED liga o braço inteiro com cinco desenhos de acorde (C, A, G, E e D) que se encaixam um no outro. Tocando as notas de cada forma como arpejo, você passa a enxergar o acorde (e a escala em volta dele) em qualquer região, não só na pestana que já conhece.',
    how: 'Toque as notas do acorde dentro da forma, da mais grave à mais aguda e de volta, uma por vez. As fundamentais (laranja) mostram de qual forma você está saindo.',
    perBeat: 2,
    startBpm: 60,
    positions: 5,
    positionLabel: (i) => `forma de ${CAGED_SHAPES[i].name}`,
    usesKey: true,
    lesson: 'w6-conectar',
    tips: ['Procure primeiro a fundamental na corda indicada pela forma (C e A: 2ª corda mais grave; G e E: a mais grave; D: a 3ª). O resto do acorde fica em volta dela.', 'A ordem C-A-G-E-D se repete subindo o braço: o fim de uma forma é o começo da próxima.'],
  },
  {
    id: 'slap',
    title: 'Slap groove',
    focus: 'polegar, pop, ghost notes e hammer-ons em levadas de funk-rock',
    why: 'Slap não é só oitava: é groove. Estas levadas (originais, no espírito do funk-rock de baixistas como Flea) juntam polegar e pop, ghost notes preenchendo as semicolcheias, pausas que dão balanço, hammer-ons e frases da pentatônica. Cada levada ensina uma peça; juntas, viram vocabulário para criar as suas.',
    how: 'Semicolcheias contínuas: T = polegar, P = pop (duas cordas acima), H = hammer-on sem novo ataque, x = ghost note (corda abafada pela mão esquerda), pausa = abafe tudo. A mão direita nunca para; quem decide se a nota soa é a esquerda.',
    perBeat: 4,
    startBpm: 60,
    positions: SLAP_GROOVES.length,
    positionLabel: (i) => SLAP_GROOVES[i].name,
    usesKey: true,
    lesson: 'w10-slap',
    instrument: 'bass',
    tips: ['O polegar bate perto do fim do braço e quica, girando o antebraço; o pop engancha a corda e solta, sem puxar demais.', 'Volume igual entre T e P é a meta. Se o pop estiver muito mais alto, puxe menos; se o T estiver abafado, bata e saia mais rápido da corda.'],
  },
  {
    id: 'walking',
    title: 'Walking bass I–IV–V–I',
    focus: 'arpejos de 7ª em semínimas, sem parar',
    why: 'Walking bass é tocar o arpejo de cada acorde, uma nota por tempo. Com os acordes dominantes (7) do I, IV e V, você treina os arpejos de 7ª do mundo de Acordes e a sensação de "andar" sobre a harmonia.',
    how: 'Um compasso por acorde: 1, 3, 5 e b7, uma semínima por clique. Mão parada na posição; dedos alternados.',
    perBeat: 1,
    startBpm: 80,
    positions: 2,
    positionLabel: (i) => (i === 0 ? 'fundamental na corda mais grave' : 'fundamental na 2ª corda'),
    usesKey: true,
    lesson: 'w10-walking',
    instrument: 'bass',
    tips: ['Todas as notas com a mesma duração: cada uma soa até a próxima começar (legato), sem buracos.', 'Diga o grau de cada nota em voz alta (1, 3, 5, b7). Depois tente trocar a b7 por uma nota a meio tom do próximo acorde.'],
  },
  {
    id: 'legato',
    title: 'Legato na pentatônica',
    focus: 'hammer-ons e pull-offs com volume igual',
    why: 'Com duas notas por corda, a pentatônica é perfeita para legato: palheta só na primeira nota de cada corda, a segunda sai de hammer-on (subindo) ou pull-off (descendo). Fluidez de solo e força da mão esquerda.',
    how: 'Subindo: palheta + hammer-on em cada corda. Descendo: palheta + pull-off. Uma caixa por dia.',
    perBeat: 2,
    startBpm: 70,
    positions: 5,
    positionLabel: (i) => `caixa ${i + 1}`,
    usesKey: true,
    lesson: 'w11-legato',
    instrument: 'guitar',
    tips: ['Bata o dedo do hammer-on logo atrás do traste, com firmeza; no pull-off, puxe a corda de leve para baixo ao sair.', 'As notas ligadas têm que soar quase tão alto quanto as palhetadas. Abafe as cordas que não estão tocando.'],
  },
  {
    id: 'sweep',
    title: 'Sweep em tríades',
    focus: 'arpejos varridos, uma nota por corda',
    why: 'O sweep é a palhetada econômica levada ao arpejo: um movimento só de palheta atravessa as cordas. Treina sincronia fina entre as mãos e os arpejos maiores do mundo de Acordes.',
    how: 'Subindo, todas as palhetadas para baixo num movimento contínuo; descendo, todas para cima. Cada nota soa sozinha: solte o dedo assim que a próxima tocar.',
    perBeat: 3,
    startBpm: 60,
    positions: 3,
    positionLabel: (i) => ARPEGGIO_SHAPES[i].name,
    usesKey: true,
    lesson: 'w11-sweep',
    instrument: 'guitar',
    tips: ['A palheta não para em cada corda: ela "cai" de uma para a outra. Comece muito devagar, ouvindo se cada nota está separada.', 'Se as notas soarem juntas como um acorde, a mão esquerda está segurando demais: levante cada dedo logo depois da sua nota.'],
  },
]

/** Exercícios do Treino para o instrumento (os de técnica são de um instrumento só). */
export function drillsFor(kind?: InstrumentKind) {
  if (!kind) return DRILLS
  const family = kind === 'guitar6' ? 'guitar' : 'bass'
  return DRILLS.filter((d) => !d.instrument || d.instrument === family)
}

const DAY_MS = 24 * 3600 * 1000
/** Número do dia (local), para sortear exercício, tom e posição de forma estável ao longo do dia. */
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS)

export const drillOfDay = (d = new Date(), kind?: InstrumentKind) => {
  const list = drillsFor(kind)
  return list[dayNumber(d) % list.length]
}

/** Tom do dia: percorre o ciclo das quintas, para todos os tons aparecerem. */
export const KEYS_CYCLE = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2]
export const keyOfDay = (d = new Date()) => KEYS_CYCLE[Math.floor(dayNumber(d) / DRILLS.length) % KEYS_CYCLE.length]

/** Posição do dia de um exercício (muda a cada volta pelos exercícios). */
export const positionOfDay = (drill: Drill, d = new Date()) => Math.floor(dayNumber(d) / DRILLS.length) % drill.positions

/** Casa da nota na corda, a partir de `min` (para sobrar espaço para a posição). */
export function fretOn(inst: Instrument, string: number, pc: number, min: number) {
  const f = mod12(pc - inst.openMidi[string])
  return f < min ? f + 12 : f
}

/** Sobe e depois desce, sem repetir o topo. */
export const upAndDown = (up: FretPos[]) => [...up, ...up.slice(0, -1).reverse()]

/** Desce uma oitava se a posição passar do fim do braço (e couber). */
/** Acima desta casa, se o desenho couber uma oitava abaixo, ele é mostrado lá (região mais confortável). */
const COMFORT = 15

export function fitNeck<T extends FretPos>(inst: Instrument, ps: T[]): T[] {
  const max = Math.max(...ps.map((p) => p.fret))
  if (max <= Math.min(COMFORT, inst.frets)) return ps
  const lowered = ps.map((p) => ({ ...p, fret: p.fret - 12 }))
  return lowered.every((p) => p.fret >= 0) ? lowered : ps
}

/**
 * Escala "n notas por corda": a partir do grau `start` (0 = tônica) na corda mais grave, cada corda
 * recebe as próximas `perString` notas da escala, subindo. Com 2 por corda na pentatônica saem as 5
 * caixas; com 3 por corda na maior, as 7 posições.
 */
export function scaleByString(inst: Instrument, root: number, steps: readonly number[], perString: number, start: number): FretPos[] {
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
export function arpeggio(inst: Instrument, root: number, string: number, third: 3 | 4, extra: number[] = []): FretPos[] {
  const s = Math.min(string, inst.openMidi.length - 1)
  const f = fretOn(inst, s, root, 1)
  const pcs = [root, mod12(root + third), mod12(root + 7), ...extra.map((e) => mod12(root + e))]
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
export function drillSequence(inst: Instrument, drill: Drill, root: number, position = 0): Step[] {
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
    case 'caged':
      return upAndDown(cagedShape(inst, root, pos))
    case 'slap':
      // levada na corda mais grave (no baixo de 5 e 6, a corda E, como no de 4)
      return fitNeck(inst, slapSteps(inst, SLAP_GROOVES[pos].bar, root, n > 4 ? 1 : 0))
    case 'walking':
      // 1-3-5-b7 de I7, IV7, V7 e I7, cada um na forma com a fundamental na corda escolhida
      return fitNeck(inst, [0, 5, 7, 0].flatMap((d) => arpeggio(inst, mod12(root + d), pos, 4, [10]).slice(0, 4)))
    case 'legato':
      return upAndDown(scaleByString(inst, root, SCALES.minorPentatonic.steps, 2, pos))
    case 'sweep': {
      const { string } = ARPEGGIO_SHAPES[pos]
      return fitNeck(inst, upAndDown(arpeggio(inst, root, string, 4)))
    }
  }
  return []
}

export type Direction = 'both' | 'up' | 'down'
/** exercícios cuja sequência já sobe e desce (escalas, arpejos, aranha, CAGED) */
const UP_DOWN = new Set(['aranha', 'pentatonica', 'maior', 'arpejos', 'legato', 'sweep', 'caged'])

/**
 * Sentido do exercício: só subindo, só descendo ou os dois. Nos que já sobem e descem, corta no
 * ponto mais agudo; nos outros (oitavas, slap, walking), "desce" é a sequência de trás para frente.
 */
export function withDirection(inst: Instrument, drill: Drill, seq: Step[], dir: Direction): Step[] {
  // groove é groove: tocado como está escrito
  if (drill.id === 'slap') return seq
  if (dir === 'both' && UP_DOWN.has(drill.id)) return seq
  if (!UP_DOWN.has(drill.id)) {
    const back = [...seq].reverse()
    return dir === 'up' ? seq : dir === 'down' ? back : [...seq, ...back.slice(1)]
  }
  const pitches = seq.map((p) => midiAt(inst, p))
  const top = pitches.indexOf(Math.max(...pitches))
  return dir === 'up' ? seq.slice(0, top + 1) : seq.slice(top)
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
