import { parsePattern } from '../exercises/generate'
import { onsetBeats, totalBeats } from '../exercises/rhythmScore'
import { mod12 } from '../theory/notes'

/*
  Ouvir e repetir: o app toca uma frase curta e você repete no instrumento. A conferência é pela
  ordem das notas (em qualquer oitava; ghost notes não contam). Acertou, sobe de nível; errou,
  o app mostra onde e você tenta de novo.
*/

export interface Phrase {
  title: string
  /** ritmo na notação compacta (w h q e s, r = pausa, t = tercina) */
  pattern: string
  /** semitons a partir da tônica, um por ataque; null = ghost note (sem altura) */
  degrees: (number | null)[]
  marks?: string[]
  /** o que a frase treina */
  about?: string
}

type Rng = () => number
const pick = <T,>(xs: readonly T[], rng: Rng) => xs[Math.floor(rng() * xs.length)]
const PENTA = [0, 3, 5, 7, 10, 12]

/** Células rítmicas de 1 tempo (ou 2, a mínima) liberadas por nível. */
function cells(level: number) {
  const c = ['q', 'q', 'h']
  if (level >= 3) c.push('e e', 'e e')
  if (level >= 5) c.push('rq', 's s e', 'e. s', 'e s s')
  if (level >= 7) c.push('re e', 's s s s')
  return c
}

/** Frase gerada para o nível: mais notas, ritmos mais variados e, do 6 em diante, dois compassos. */
export function levelPhrase(level: number, rng: Rng = Math.random): Phrase {
  const beats = level >= 6 ? 8 : 4
  const parts: string[] = []
  for (let t = 0; t < beats; ) {
    let cell = pick(cells(level), rng)
    if (cell === 'h' && t + 2 > beats) cell = 'q'
    // o primeiro tempo sempre com nota (para a frase ter começo claro)
    if (t === 0 && cell.startsWith('r')) cell = 'q'
    parts.push(cell)
    t += cell === 'h' ? 2 : 1
  }
  const pattern = parts.join(' ')
  const attacks = onsetBeats(parsePattern(pattern)).length
  // passeio pela pentatônica menor, quase sempre por grau vizinho; começa e (nos níveis baixos) termina na tônica
  let i = 0
  const degrees: number[] = []
  for (let k = 0; k < attacks; k++) {
    if (k > 0) i = Math.max(0, Math.min(PENTA.length - 1, i + pick(level >= 4 ? [-2, -1, -1, 1, 1, 2] : [-1, 1, 1], rng)))
    degrees.push(PENTA[i])
  }
  if (level <= 3 && attacks > 1) degrees[attacks - 1] = 0
  return { title: `Nível ${level}`, pattern, degrees }
}

/** Frases prontas que juntam técnica, arpejo e ritmo (treino aplicado). */
export const GROOVES: Record<'bass' | 'guitar', Phrase[]> = {
  bass: [
    { title: 'Slap: oitavas com ghost notes', pattern: 'e s s e s s e s s e s s', degrees: [0, null, 12, 0, null, 12, 5, null, 17, 7, null, 19], marks: ['T', 'x', 'P', 'T', 'x', 'P', 'T', 'x', 'P', 'T', 'x', 'P'], about: 'Oitavas no slap seguindo I, IV e V, com ghost notes entre o polegar e o pop.' },
    { title: 'Arpejo m7 ritmado', pattern: 's s e s s e q q', degrees: [0, 7, 10, 12, 10, 7, 3, 0], about: 'O arpejo menor com sétima virando groove: semicolcheias de funk e chegada na tônica.' },
    { title: 'Funk com ghost notes', pattern: 'e s s q e s s q', degrees: [0, null, 0, 10, 0, null, 12, 7], marks: ['', 'x', '', '', '', 'x', '', ''], about: 'Tônica, ghost notes e a oitava: o esqueleto de mil linhas de funk.' },
    { title: 'Walking: I7 e IV7', pattern: 'q q q q q q q q', degrees: [0, 4, 7, 10, 5, 9, 12, 11], about: 'Dois compassos de walking: arpejo do I7, arpejo do IV7 e uma aproximação cromática de volta à tônica.' },
  ],
  guitar: [
    { title: 'Riff com palm mute', pattern: 'e e e e e e q', degrees: [0, 0, 3, 0, 5, 0, 7], marks: ['PM', 'PM', '', 'PM', '', 'PM', ''], about: 'Tônica abafada como pedal e notas da pentatônica abertas como acento.' },
    { title: 'Lick pentatônico descendo', pattern: 'e e e e q q', degrees: [12, 10, 7, 5, 3, 0], about: 'Descida clássica da pentatônica menor, da oitava à tônica.' },
    { title: 'Arpejo em tercinas', pattern: 'te te te te te te q q', degrees: [0, 4, 7, 12, 7, 4, 0, 0], about: 'Arpejo maior subindo e descendo em tercinas, como no sweep e no legato.' },
    { title: 'Frase com síncope', pattern: 'e q e q q', degrees: [0, 3, 5, 3, 0], about: 'Notas que caem no contratempo: o balanço do rock e do funk.' },
  ],
}

export const phraseBeats = (p: Phrase) => totalBeats(parsePattern(p.pattern))

/** Notas que contam na conferência (classes de altura), na ordem; ghost notes ficam de fora. */
export const expectedPcs = (p: Phrase, root: number) => p.degrees.filter((d): d is number => d !== null).map((d) => mod12(root + d))

/** Confere o que foi tocado até agora. `miss` = índice da primeira nota errada. */
export function checkEcho(expected: number[], played: number[]): { ok: number; miss: number | null; done: boolean } {
  for (let i = 0; i < played.length; i++) if (i >= expected.length || mod12(played[i]) !== expected[i]) return { ok: i, miss: i, done: false }
  return { ok: played.length, miss: null, done: played.length >= expected.length }
}
