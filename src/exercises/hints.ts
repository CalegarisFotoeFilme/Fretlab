import { stringNumber, type FretPos, type Instrument } from '../theory/instrument'
import { CHORDS, INTERVALS, mod12, type ChordQuality, type PitchClass } from '../theory/notes'

/*
  Textos das dicas, como um professor do lado: a primeira orienta o raciocínio, a segunda
  quase entrega a resposta. Puras (sem React), para testar.
*/

export type NameFn = (pc: PitchClass, flats?: boolean) => string

const corda = (inst: Instrument, s: number) => `${stringNumber(inst, s)}ª corda`
const casas = (n: number) => `${n} ${n === 1 ? 'casa' : 'casas'}`

/** Achar a nota: partir da corda solta e contar. */
export function findNoteHints(inst: Instrument, pc: PitchClass, target: FretPos, name: NameFn): string[] {
  const open = mod12(inst.openMidi[target.string])
  return [
    `Comece pela corda solta: a ${corda(inst, target.string)} é ${name(open)}. Ande pelo alfabeto até ${name(pc)}, lembrando que Mi–Fá e Si–Dó ficam coladas (1 casa) e as outras vizinhas ficam a 2 casas.`,
    `${name(pc)} está ${casas(target.fret)} acima da corda solta: casa ${target.fret} da ${corda(inst, target.string)}${target.fret >= 12 ? ' (depois da casa 12 tudo se repete)' : ''}.`,
  ]
}

/** Nomear a nota: corda solta + quantas casas. */
export function nameNoteHints(inst: Instrument, pos: FretPos, name: NameFn): string[] {
  const open = mod12(inst.openMidi[pos.string])
  const path = Array.from({ length: Math.min(pos.fret, 12) + 1 }, (_, i) => name(mod12(open + i)))
  return [
    `A ${corda(inst, pos.string)} solta é ${name(open)}, e a nota está ${casas(pos.fret)} acima. Cada casa é meio tom.`,
    pos.fret <= 12 ? `Contando casa a casa: ${path.join(' → ')}.` : `Casa ${pos.fret} = casa ${pos.fret - 12} uma oitava acima.`,
  ]
}

/** Descrição da forma de um intervalo, da fundamental até o alvo. */
export function shapeText(root: FretPos, target: FretPos) {
  const ds = target.string - root.string
  const df = target.fret - root.fret
  const cordaTxt = ds === 0 ? 'na mesma corda' : ds === 1 ? 'na corda de cima' : `${ds} cordas acima`
  const casaTxt = df === 0 ? 'na mesma casa' : df > 0 ? `${casas(df)} à frente` : `${casas(-df)} para trás`
  return `${cordaTxt}, ${casaTxt}`
}

const SOUND: Record<number, string> = {
  1: 'bem tenso, as duas notas "raspam" (como o tema de Tubarão)',
  2: 'um passo de escala, ainda com atrito',
  3: 'escuro, melancólico (o som do acorde menor)',
  4: 'luminoso, alegre (o som do acorde maior)',
  5: 'aberto, parece pedir para resolver',
  6: 'o mais tenso de todos, instável, no meio da oitava',
  7: 'forte e estável, o power chord',
  8: 'triste e largo',
  9: 'doce, cantado',
  10: 'tenso mas com cara de blues (o 7 do dominante)',
  11: 'muito tenso, a meio tom da oitava',
  12: 'a mesma nota, mais aguda',
}

/** Tocar o intervalo: lembrar a forma. */
export function playIntervalHints(inst: Instrument, root: FretPos, semis: number, target: FretPos, name: NameFn, rootPc: PitchClass): string[] {
  return [
    `${INTERVALS[semis].name}: ${semis} ${semis === 1 ? 'semitom' : 'semitons'} acima da fundamental. Na mesma corda seriam ${casas(semis)}; cada corda acima já "vale" a distância de afinação entre elas (em geral 5 casas), então conte o resto a partir dali.`,
    `A forma: ${shapeText(root, target)} (a nota ${name(mod12(rootPc + semis))}, ${corda(inst, target.string)}, casa ${target.fret}).`,
  ]
}

/** Nomear o intervalo pela forma. */
export function nameIntervalHints(root: FretPos, shown: FretPos, semis: number): string[] {
  return [`A forma é ${shapeText(root, shown)}. Converta em semitons: cada casa vale 1 e cada corda acima vale a afinação entre elas (5, ou 4 da 3ª para a 2ª da guitarra).`, `São ${semis} semitons da fundamental até a nota marcada.`]
}

/** Intervalo de ouvido. */
export function hearIntervalHints(semis: number, options: number[]): string[] {
  const other = options.filter((o) => o !== semis)
  const decoy = other[Math.floor(other.length / 2)]
  return [`Ouça o caráter do som: ${SOUND[semis]}.`, decoy !== undefined ? `Não é ${INTERVALS[decoy].name.toLowerCase()}; ${semis > 7 ? 'é maior que uma quinta' : semis === 7 ? 'é exatamente a quinta' : 'é menor que uma quinta'}.` : `São ${semis} semitons.`]
}

/** Desenhe no braço: fórmula e uma nota que falta. */
export function noteSetHints(inst: Instrument, formula: string, missing: FretPos | null, missingLabel: string): string[] {
  return [
    `A fórmula é ${formula}. Ache primeiro as outras fundamentais (1) da posição: elas ficam numa oitava (duas cordas acima, 2 ou 3 casas à frente). Depois encaixe os outros graus em volta delas.`,
    missing ? `Ainda falta, por exemplo, o ${missingLabel} na ${corda(inst, missing.string)}, casa ${missing.fret}.` : 'Você já achou todas: confira as que estão faltando no fim.',
  ]
}

const CHORD_SOUND: Partial<Record<ChordQuality, string>> = {
  maj: 'aberto e alegre',
  min: 'fechado e melancólico',
  dim: 'instável, como se fosse desmoronar',
  aug: 'suspenso, como trilha de suspense',
  maj7: 'sonhador, de bossa nova',
  dom7: 'tenso e "blueseiro", pedindo para resolver',
  min7: 'escuro mas macio, de soul',
  m7b5: 'sombrio e instável',
  pow: 'forte e neutro, nem alegre nem triste (sem terça)',
  sus2: 'aberto e etéreo, sem terça',
  sus4: 'em suspense, pedindo para voltar ao acorde maior',
}

/** Acorde de ouvido. */
export function hearChordHints(q: ChordQuality): string[] {
  const third = CHORDS[q].formula.includes(4 as never) ? 'terça maior' : CHORDS[q].formula.includes(3 as never) ? 'terça menor' : 'nenhuma terça'
  const seventh = CHORDS[q].formula.length === 4 ? ` e tem sétima (${CHORDS[q].formula.includes(11 as never) ? 'maior' : 'menor'})` : ''
  return [`Escute o clima: esse acorde soa ${CHORD_SOUND[q] ?? 'de um jeito próprio'}.`, `Ele tem ${third}${seventh}.`]
}

const DEGREE_FEEL = ['é a própria tônica: repouso total', 'afasta da tônica de leve, com cara menor', 'é parente próximo da tônica, mais escuro', 'abre uma porta: afasta da tônica, maior', 'pede para voltar: é a tensão do tom', 'é o "lado triste" da tônica', 'muito instável, quer subir para a tônica']

/** Grau de ouvido. */
export function hearDegreeHints(degree: number, quality: ChordQuality, roman: string): string[] {
  const kind = ['min', 'min7', 'dim', 'm7b5'].includes(quality) ? 'menor (ou diminuto)' : 'maior'
  return [`O segundo acorde é ${kind}.`, `Ele ${DEGREE_FEEL[degree - 1]} (${roman}).`]
}

/** Quiz: eliminar alternativas erradas, uma por dica. */
export function quizHints(options: string[], answer: number): string[] {
  const wrong = options.map((o, i) => ({ o, i })).filter((x) => x.i !== answer)
  return wrong.slice(0, Math.min(2, wrong.length - 1)).map((w) => `Não é "${w.o}".`)
}

/** Ritmo: contar em voz alta e onde caem os ataques. */
export function rhythmHints(onsets: number[]): string[] {
  const label = (b: number) => {
    const beat = Math.floor(b + 1e-6) + 1
    const frac = b - Math.floor(b + 1e-6)
    if (frac < 0.01) return `${beat}`
    if (Math.abs(frac - 0.5) < 0.01) return `${beat} e`
    if (Math.abs(frac - 0.25) < 0.01) return `${beat} ·`
    if (Math.abs(frac - 0.75) < 0.01) return `${beat} a`
    return `${beat} (tercina)`
  }
  return [
    'Bata o pé em todos os tempos e conte em voz alta ("1 e 2 e 3 e 4 e"). Toque só onde a partitura manda; o pé não segue a mão. Use "Ouvir" antes de tocar.',
    `Os ataques caem em: ${onsets.map(label).join(' · ')}.`,
  ]
}

/** Ditado: quantos ataques. */
export function dictationHints(attacks: number, firstIsDownbeat: boolean): string[] {
  return [`Conte quantas notas soam depois da contagem: são ${attacks}.`, firstIsDownbeat ? 'A primeira nota cai bem no tempo 1.' : 'A primeira nota não cai no tempo 1: há pausa ou contratempo no começo.']
}

/** Leitura: linha do meio como referência. */
export function readNoteHints(step: number, clef: 'treble' | 'bass', letters: string[]): string[] {
  const ref = clef === 'treble' ? 'Si (B)' : 'Ré (D)'
  const dir = step > 0 ? 'acima' : 'abaixo'
  return [
    `Use a linha do meio como referência: na clave de ${clef === 'treble' ? 'sol' : 'fá'} ela é ${ref}. Cada linha ou espaço vale uma nota do alfabeto.`,
    step === 0 ? `A nota está na própria linha do meio.` : `Ela está ${Math.abs(step)} ${Math.abs(step) === 1 ? 'degrau' : 'degraus'} ${dir} da linha do meio: ${letters.join(' → ')}.`,
  ]
}
