/*
  Treino de intervalos de ouvido, em módulos de dois intervalos (cada par junta sons fáceis de
  confundir ou que se completam). Ciclo contínuo de 4 tempos: 1 ouve, 2 pausa, 3 responde,
  4 confere. Errar não para o jogo.
*/

export interface EarModule {
  id: string
  title: string
  /** semitons de cada intervalo do módulo */
  intervals: number[]
  /** nome curto exibido nos botões, na mesma ordem */
  labels: string[]
  /** como diferenciar os dois de ouvido (texto do app) */
  tip: string
}

export const EAR_MODULES: EarModule[] = [
  { id: '3-5', title: '3ª maior e 5ª justa', intervals: [4, 7], labels: ['3ª maior', '5ª justa'], tip: 'As duas estão no acorde maior. A 3ª maior soa doce e "colorida"; a 5ª justa soa oca, forte, sem cor (o power chord).' },
  { id: '2-4', title: '2ª maior e 4ª justa', intervals: [2, 5], labels: ['2ª maior', '4ª justa'], tip: 'A 2ª maior é um passo de escala, as notas quase se esbarram. A 4ª justa é aberta, como um chamado ("Aqui vem a noiva").' },
  { id: '6-8', title: '6ª maior e 8ª', intervals: [9, 12], labels: ['6ª maior', '8ª'], tip: 'Na 8ª as notas parecem a mesma, só mais aguda. A 6ª maior é larga e cantada, com cara de abertura de canção.' },
  { id: '7m-7M', title: '7ª menor e 7ª maior', intervals: [10, 11], labels: ['7ª menor', '7ª maior'], tip: 'A 7ª menor é a tensão do blues, pede para resolver. A 7ª maior fica a meio tom da oitava: raspa, soa sonhadora e mais tensa.' },
  { id: '3m-6m', title: '3ª menor e 6ª menor', intervals: [3, 8], labels: ['3ª menor', '6ª menor'], tip: 'As duas soam "tristes". A 3ª menor é curta e é o coração do acorde menor; a 6ª menor é larga, dramática.' },
  { id: '2m-4aum', title: '2ª menor e 4ª aumentada', intervals: [1, 6], labels: ['2ª menor', '4ª aum.'], tip: 'Os dois mais tensos. A 2ª menor raspa (notas coladas); a 4ª aumentada (trítono) soa instável, no meio da oitava, como uma sirene.' },
]

/** Todos os intervalos de todos os módulos, para a revisão geral. */
export const ALL_EAR: EarModule = {
  id: 'todos',
  title: 'Aleatório total',
  intervals: EAR_MODULES.flatMap((m) => m.intervals).sort((a, b) => a - b),
  labels: EAR_MODULES.flatMap((m) => m.intervals.map((s, i) => [s, m.labels[i]] as const))
    .sort((a, b) => a[0] - b[0])
    .map(([, l]) => l),
  tip: 'Qualquer um dos 12 intervalos, de qualquer tônica. Pense primeiro "pequeno, médio ou grande", depois na cor. Boa sorte!',
}

export type EarPlayMode = 'harmonic' | 'melodic' | 'both'

export interface EarQuestion {
  semis: number
  root: number
  harmonic: boolean
}

/** Sorteia a próxima pergunta, evitando repetir o mesmo intervalo mais de 2 vezes seguidas. */
export function nextEarQuestion(intervals: number[], mode: EarPlayMode, history: number[], rng: () => number = Math.random, low = 48): EarQuestion {
  let semis = intervals[Math.floor(rng() * intervals.length)]
  const [a, b] = history.slice(-2)
  if (intervals.length > 1 && a === semis && b === semis) semis = intervals.find((s) => s !== semis)!
  // tônica sorteada entre as 12 notas, a partir de `low` (C3 por padrão; C2 no baixo)
  const root = low + Math.floor(rng() * 12)
  const harmonic = mode === 'harmonic' || (mode === 'both' && rng() < 0.5)
  return { semis, root, harmonic }
}

/** Os 4 tempos do ciclo. */
export const EAR_BEATS = ['Ouça', '—', 'Responda', 'Confira'] as const
