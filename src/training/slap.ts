import type { FretPos, Instrument } from '../theory/instrument'

/*
  Grooves de slap no espírito do funk-rock (a escola de baixistas como Flea): polegar e pop, oitavas,
  ghost notes preenchendo as semicolcheias, hammer-ons no polegar e frases pentatônicas. As levadas
  são originais do app, escritas como um compasso de 16 semicolcheias.

  Notação de cada passo:
    T<grau>  polegar na corda da fundamental      P<grau>  pop duas cordas acima (oitava, b7, b3…)
    H<grau>  hammer-on na mesma corda do anterior x        ghost note (corda abafada)
    -        pausa (abafe tudo)
  O grau é em semitons a partir da tônica.
*/

/** Passo de um exercício: uma posição no braço, com técnica, ghost note ou pausa. */
export interface Step extends FretPos {
  mark?: string
  ghost?: boolean
  rest?: boolean
}

export interface SlapGroove {
  name: string
  /** o que a levada ensina */
  about: string
  bar: string
}

export const SLAP_GROOVES: SlapGroove[] = [
  { name: 'Oitavas com ghost notes', about: 'A base de tudo: polegar na tônica, pop na oitava e ghost notes mantendo as semicolcheias vivas.', bar: 'T0 x P12 x  T0 x P12 T0  x T0 P12 x  T0 x P10 P12' },
  { name: 'Polegar e pop na b7', about: 'Pausas que dão balanço e o pop alternando b7 e oitava, o som clássico do funk-rock.', bar: 'T0 - T0 P10  - T0 P12 x  T0 x T3 T5  P12 x P10 x' },
  { name: 'Hammer-on no polegar', about: 'O polegar ataca e a mão esquerda "martela" a b3: duas notas com um ataque só, muito usado nas levadas rápidas.', bar: 'T0 H3 x P12  T0 H3 T5 P12  T0 H3 x P12  T5 H7 P15 P12' },
  { name: 'Frase pentatônica', about: 'Subindo e descendo a pentatônica menor com o polegar, com o pop respondendo: slap também é melodia.', bar: 'T0 x T3 x  T5 x P12 x  T7 x P10 x  T5 x T3 x' },
  { name: 'Galope com ghost em dobro', about: 'Duas ghost notes seguidas entre os ataques: o "motor" das levadas mais agressivas.', bar: 'T0 x x P12  x x T0 x  T0 x x P12  x P10 x x' },
  { name: 'Tônica, quinta e oitava', about: 'O polegar passeia entre tônica e quinta e o pop marca a oitava, com um hammer-on chegando nela.', bar: 'T0 x P12 x  T7 x P12 x  T0 x P12 T0  T5 H7 P12 x' },
]

/**
 * Converte uma levada em posições: tônica `root` (classe de altura) na corda `low`, transposta
 * `shift` semitons (para tocar a mesma levada no IV, no V…).
 */
export function slapSteps(inst: Instrument, bar: string, root: number, low: number, shift = 0): Step[] {
  const s0 = Math.min(low, inst.openMidi.length - 3)
  const open0 = inst.openMidi[s0]
  let r = (((root + shift - open0) % 12) + 12) % 12
  if (r < 1) r += 12 // casa 1 em diante: a corda solta não abafa bem
  const fretFor = (string: number, d: number) => r + d - (inst.openMidi[string] - open0)
  const out: Step[] = []
  for (const tok of bar.split(/\s+/).filter(Boolean)) {
    const prev = [...out].reverse().find((p) => !p.ghost && !p.rest)
    if (tok === '-') out.push({ string: s0, fret: r, rest: true })
    else if (tok === 'x') out.push({ string: s0, fret: r, ghost: true, mark: 'x' })
    else {
      const kind = tok[0]
      const d = Number(tok.slice(1))
      const string = kind === 'P' ? s0 + 2 : kind === 'H' && prev ? prev.string : s0
      out.push({ string, fret: fretFor(string, d), mark: kind })
    }
  }
  return out
}
