import { midiAt, stringNumber, type FretPos, type Instrument } from '../theory/instrument'
import { SCALES, mod12 } from '../theory/notes'
import { arpeggio, fitNeck, fretOn, scaleByString, upAndDown, type Drill } from './drills'

/*
  Desafios do Treino: em vez de repetir sempre o mesmo desenho, cada "Novo desafio" sorteia uma
  tarefa sobre o tema do exercício (tom, corda, grau, caixas, agrupamento, progressão). O objetivo
  é ligar os desenhos entre si e soltar a mão de uma casa só.
*/

export interface Challenge {
  /** tipo do desafio (para não repetir o mesmo seguido) */
  kind: string
  title: string
  /** o que esse desafio faz você internalizar */
  goal: string
  root: number
  seq: FretPos[]
  /** notas por clique do metrônomo */
  perBeat: number
}

type Rng = () => number
type NameFn = (pc: number) => string
const pick = <T,>(xs: readonly T[], rng: Rng) => xs[Math.floor(rng() * xs.length)]
const ORD = ['1º', '2º', '3º', '4º', '5º', '6º', '7º']

/** Escala a partir de um grau numa corda: `perString` notas por corda, subindo pelas cordas. */
export function scaleFromString(inst: Instrument, root: number, steps: readonly number[], perString: number, startString: number, degree: number): FretPos[] {
  const first = inst.openMidi[startString] + fretOn(inst, startString, mod12(root + steps[degree]), 1)
  const base = first - steps[degree]
  const pitches: number[] = []
  for (let oct = 0; pitches.length < perString * inst.openMidi.length; oct++)
    for (const s of steps) if (base + 12 * oct + s >= first) pitches.push(base + 12 * oct + s)
  const out: FretPos[] = []
  for (let s = startString, k = 0; s < inst.openMidi.length; s++)
    for (let j = 0; j < perString; j++, k++) out.push({ string: s, fret: pitches[k] - inst.openMidi[s] })
  return fitNeck(inst, out.filter((p) => p.fret >= 0))
}

/** Agrupamento: 1-2-3, 2-3-4, 3-4-5… subindo e depois o mesmo descendo. */
export function inGroups(up: FretPos[], size: number): FretPos[] {
  const run = (xs: FretPos[]) => xs.slice(0, xs.length - size + 1).flatMap((_, i) => xs.slice(i, i + size))
  return [...run(up), ...run([...up].reverse())]
}

/** Caixas em zigue-zague: a primeira sobe, a próxima desce, e assim por diante. */
const zigzag = (boxes: FretPos[][]) => boxes.flatMap((b, i) => (i % 2 ? [...b].reverse() : b))

function scaleChallenge(inst: Instrument, drill: Drill, root: number, name: NameFn, rng: Rng, avoid?: string): Challenge {
  const penta = drill.id !== 'maior'
  const steps = penta ? SCALES.minorPentatonic.steps : SCALES.major.steps
  const per = penta ? 2 : 3
  const nBoxes = penta ? 5 : 7
  const scaleName = penta ? `pentatônica de ${name(root)}m` : `escala de ${name(root)} maior`
  const box = (k: number) => scaleByString(inst, root, steps, per, k % nBoxes)
  const kinds = ['todas', 'conectar', 'corda-grau', 'grupos'].filter((k) => k !== avoid)
  const kind = pick(kinds, rng)
  if (kind === 'todas') {
    return {
      kind, root, perBeat: 2,
      title: `Todas as ${nBoxes} ${penta ? 'caixas' : 'posições'} da ${scaleName}`,
      goal: 'Atravessar o braço inteiro no mesmo tom: a última nota de uma caixa é vizinha da primeira da próxima. Diga em voz alta onde estão as fundamentais em cada caixa.',
      seq: zigzag(Array.from({ length: nBoxes }, (_, k) => box(k))),
    }
  }
  if (kind === 'conectar') {
    const n = pick([2, 3], rng)
    const start = Math.floor(rng() * nBoxes)
    return {
      kind, root, perBeat: 2,
      title: `Conecte as caixas ${Array.from({ length: n }, (_, i) => ((start + i) % nBoxes) + 1).join(', ')} da ${scaleName}`,
      goal: 'Sobe numa caixa e desce pela seguinte, sem parar: é assim que um solo anda pelo braço em vez de ficar preso numa posição.',
      seq: zigzag(Array.from({ length: n }, (_, i) => box(start + i))),
    }
  }
  if (kind === 'corda-grau') {
    const string = Math.floor(rng() * Math.max(1, inst.openMidi.length - 1))
    const degree = Math.floor(rng() * steps.length)
    const deg = penta ? ['1', 'b3', '4', '5', 'b7'][degree] : ORD[degree]
    const startPc = mod12(root + steps[degree])
    return {
      kind, root, perBeat: 2,
      title: `${scaleName[0].toUpperCase()}${scaleName.slice(1)} começando no grau ${deg} (${name(startPc)}) da ${stringNumber(inst, string)}ª corda`,
      goal: 'A escala não começa só na fundamental nem só na corda mais grave. Achar qualquer grau em qualquer corda é o que solta a mão de uma casa só.',
      seq: upAndDown(scaleFromString(inst, root, steps, per, string, degree)),
    }
  }
  const size = pick([3, 4], rng)
  const k = Math.floor(rng() * nBoxes)
  return {
    kind, root, perBeat: size === 3 ? 3 : 4,
    title: `${penta ? 'Caixa' : 'Posição'} ${k + 1} da ${scaleName} em grupos de ${size}`,
    goal: `Sequências (1-2-3, 2-3-4…) obrigam a pensar a escala nota a nota, não como um desenho decorado. Em ${size === 3 ? 'tercinas' : 'semicolcheias'}.`,
    seq: inGroups(box(k), size),
  }
}

const PROGRESSIONS: { name: string; chords: [number, 'maj' | 'min' | 'dom7' | 'maj7' | 'min7'][] }[] = [
  { name: 'I–IV–V–I', chords: [[0, 'dom7'], [5, 'dom7'], [7, 'dom7'], [0, 'dom7']] },
  { name: 'I–vi–ii–V', chords: [[0, 'maj7'], [9, 'min7'], [2, 'min7'], [7, 'dom7']] },
  { name: 'ii–V–I', chords: [[2, 'min7'], [7, 'dom7'], [0, 'maj7'], [0, 'maj7']] },
  { name: 'I–bVII–IV–I', chords: [[0, 'dom7'], [10, 'dom7'], [5, 'dom7'], [0, 'dom7']] },
]
const QUALITY = { maj: [4, []], min: [3, []], dom7: [4, [10]], maj7: [4, [11]], min7: [3, [10]] } as const
const SYMBOL = { maj: '', min: 'm', dom7: '7', maj7: '7M', min7: 'm7' }

function chordTones(inst: Instrument, pc: number, q: keyof typeof QUALITY, string: number) {
  const [third, extra] = QUALITY[q]
  return arpeggio(inst, pc, string, third, [...extra])
}

/** Sorteia um desafio sobre o tema do exercício. `avoid` = tipo do último, para variar. */
export function makeChallenge(inst: Instrument, drill: Drill, name: NameFn, rng: Rng = Math.random, avoid?: string): Challenge {
  const root = Math.floor(rng() * 12)
  const n = inst.openMidi.length
  switch (drill.id) {
    case 'pentatonica':
    case 'maior':
    case 'legato':
      return scaleChallenge(inst, drill, root, name, rng, avoid)
    case 'arpejos':
    case 'sweep': {
      const minor = rng() < 0.5
      const kinds = ['corda', 'inversao', 'progressao'].filter((k) => k !== avoid)
      const kind = pick(kinds, rng)
      const chord = `${name(root)}${minor ? 'm' : ''}`
      if (kind === 'corda') {
        const string = Math.floor(rng() * Math.min(3, n - 2))
        return { kind, root, perBeat: drill.perBeat, title: `Arpejo de ${chord} com a fundamental na ${stringNumber(inst, string)}ª corda`, goal: 'O mesmo acorde mora em vários lugares do braço. Troque a corda da fundamental e ache o desenho de novo.', seq: upAndDown(chordTones(inst, root, minor ? 'min' : 'maj', string)) }
      }
      if (kind === 'inversao') {
        const from = pick([1, 2], rng)
        const up = chordTones(inst, root, minor ? 'min' : 'maj', 0)
        const target = mod12(root + (from === 1 ? (minor ? 3 : 4) : 7))
        const i = Math.max(0, up.findIndex((p) => mod12(midiAt(inst, p)) === target))
        return { kind, root, perBeat: drill.perBeat, title: `Arpejo de ${chord} começando na ${from === 1 ? 'terça' : 'quinta'}`, goal: 'Começar o arpejo pela 3ª ou pela 5ª (inversão) treina enxergar o acorde inteiro, não só a fundamental.', seq: upAndDown(up.slice(i)) }
      }
      const prog = PROGRESSIONS[0]
      return { kind, root, perBeat: drill.perBeat, title: `Arpejos de I, IV e V em ${name(root)}`, goal: 'Passar o arpejo pelos acordes de uma progressão liga o desenho à harmonia: é assim que se toca "em cima" dos acordes.', seq: prog.chords.flatMap(([d]) => chordTones(inst, mod12(root + d), 'maj', 0)) }
    }
    case 'oitavas':
    case 'slap': {
      const low = Math.floor(rng() * Math.min(2, n - 2))
      const high = low + 2
      const shift = 12 - (inst.openMidi[high] - inst.openMidi[low])
      const kinds = ['ciclo', 'progressao'].filter((k) => k !== avoid)
      const kind = pick(kinds, rng)
      const pair = (pc: number) => {
        const f = fretOn(inst, low, pc, 1)
        const lowP = { string: low, fret: f }
        const highP = { string: high, fret: f + shift }
        return drill.id === 'slap' ? [lowP, highP, lowP, highP] : [lowP, highP]
      }
      if (kind === 'ciclo') {
        const roots = Array.from({ length: 8 }, (_, i) => mod12(root + 5 * i))
        return { kind, root, perBeat: drill.perBeat, title: `Oitavas pelo ciclo das quartas a partir de ${name(root)}`, goal: `Cada nota nova está uma quarta acima: ${roots.map(name).join(' → ')}. É o caminho de muitas progressões e faz você achar qualquer nota rápido.`, seq: fitNeck(inst, roots.flatMap(pair)) }
      }
      const prog = pick(PROGRESSIONS, rng)
      return { kind, root, perBeat: drill.perBeat, title: `Oitavas na progressão ${prog.name} em ${name(root)}`, goal: 'O desenho da oitava acompanhando os acordes: a base de linhas de funk e disco.', seq: fitNeck(inst, prog.chords.flatMap(([d]) => pair(mod12(root + d)))) }
    }
    case 'walking': {
      const prog = pick(PROGRESSIONS.filter((p) => p.name !== avoid), rng)
      const string = Math.floor(rng() * 2)
      return {
        kind: prog.name, root, perBeat: 1,
        title: `Walking ${prog.name} em ${name(root)}: ${prog.chords.map(([d, q]) => name(mod12(root + d)) + SYMBOL[q]).join(' – ')}`,
        goal: 'Um compasso por acorde, 1-3-5-7 de cada um. Novo tom e nova progressão a cada desafio: o arpejo certo tem que aparecer sem pensar.',
        seq: fitNeck(inst, prog.chords.flatMap(([d, q]) => chordTones(inst, mod12(root + d), q, string).slice(0, 4))),
      }
    }
    default: {
      // aranha: permutações dos dedos em uma posição sorteada
      const perm = pick([[1, 3, 2, 4], [1, 4, 2, 3], [2, 4, 1, 3], [4, 2, 3, 1], [1, 3, 4, 2]].filter((p) => p.join('') !== avoid), rng)
      const start = 1 + Math.floor(rng() * 9)
      const up = Array.from({ length: n }, (_, s) => perm.map((f) => ({ string: s, fret: start + f - 1 }))).flat()
      const down = Array.from({ length: n }, (_, k) => n - 1 - k).flatMap((s) => perm.map((f) => ({ string: s, fret: start + f - 1 })))
      return { kind: perm.join(''), root, perBeat: 4, title: `Aranha ${perm.join('-')} a partir da casa ${start}`, goal: 'Trocar a ordem dos dedos quebra o automático: cada dedo precisa saber sozinho para onde ir.', seq: [...up, ...down] }
    }
  }
}
