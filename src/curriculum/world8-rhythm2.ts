import type { World } from './types'

const sixteenths = ['q s s s s q q', 's s s s q q q', 'e s s q e s s q', 's s e s s e q q', 'q q s s s s q']
const dotted = ['e. s q e. s q', 'q e. s e. s q', 'e. s e. s q q', 'q q e. s e. s']
const triplets = ['te te te q te te te q', 'q q te te te q', 'te te te te te te q q', 'q te te te q q']
const syncopation = ['e q e q q', 'q e q e q', 'e q q q e', 'q. e q q', 'q. e q. e', 'e q e e q e']

export const world8: World = {
  id: 'ritmo2',
  title: 'Ritmo II',
  tagline: 'Semicolcheias, pontuadas, tercinas e síncopes',
  approach:
    'Continuação de Ritmo I à la William Leavitt: uma subdivisão nova por vez, sempre com metrônomo, e ditado para ligar o ouvido à leitura.',
  lessons: [
    {
      id: 'w8-semicolcheias',
      title: 'Semicolcheias',
      summary: 'Quatro notas por tempo.',
      teach: [
        { kind: 'text', text: 'A semicolcheia vale um quarto de tempo: cabem quatro em cada clique do metrônomo. Na escrita, ela tem duas barras (ou duas bandeirinhas). Conte "1 e e a" baixinho, sem acelerar.' },
        { kind: 'rhythm', pattern: 's s s s q q q', caption: 'Um tempo de semicolcheias e três semínimas.' },
        { kind: 'rhythm', pattern: 'e s s q e s s q', caption: 'Colcheia + duas semicolcheias: o "galope" do rock.' },
        { kind: 'tip', text: 'Toque com palhetada (ou dedos) alternada: baixo-cima-baixo-cima, uma por semicolcheia. A mão não para nem quando não toca.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 60, patterns: sixteenths },
      rounds: 5,
    },
    {
      id: 'w8-colcheia-pontuada',
      title: 'Colcheia pontuada',
      summary: 'O ponto soma metade do valor.',
      teach: [
        { kind: 'text', text: 'O ponto ao lado da nota soma metade do valor dela. A colcheia pontuada vale ¾ de tempo, e quase sempre vem com uma semicolcheia completando o tempo: é o ritmo "manco", de shuffle e de muito riff.' },
        { kind: 'rhythm', pattern: 'e. s e. s q q', caption: 'Duas colcheias pontuadas com semicolcheia e duas semínimas.' },
        { kind: 'tip', text: 'Pense em semicolcheias: a pontuada dura três delas, e a semicolcheia, uma. "1 – – a 2 – – a".' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 60, patterns: dotted },
      rounds: 4,
    },
    {
      id: 'w8-tercinas',
      title: 'Tercinas',
      summary: 'Três notas iguais em um tempo.',
      teach: [
        { kind: 'text', text: 'A tercina divide o tempo em três partes iguais, em vez de duas ou quatro. Aparece com um "3" em cima do grupo. Conte "tri-pli-ca" ou "1-2-3" dentro de cada clique.' },
        { kind: 'rhythm', pattern: 'te te te q te te te q', caption: 'Tercinas de colcheia alternando com semínimas.' },
        { kind: 'tip', text: 'Muito blues e muita balada em 12/8 vivem de tercinas. O shuffle é uma tercina com a nota do meio calada.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 60, patterns: triplets },
      rounds: 4,
    },
    {
      id: 'w8-sincope',
      title: 'Síncope',
      summary: 'Tocar no contratempo e segurar.',
      teach: [
        { kind: 'text', text: 'Síncope é quando a nota começa num tempo fraco (no "e") e se estende por cima do tempo forte. O resultado é aquele balanço que empurra a música para frente, do funk ao samba.' },
        { kind: 'rhythm', pattern: 'e q e q q', caption: 'Colcheia, semínima no contratempo, colcheia: o ataque cai no "e" do 1.' },
        { kind: 'rhythm', pattern: 'q. e q q', caption: 'Semínima pontuada: o segundo ataque cai no "e" do 2.' },
        { kind: 'tip', text: 'Bata o pé em todos os tempos e toque só onde está escrito. O pé não segue a mão.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 66, patterns: syncopation },
      rounds: 6,
    },
    {
      id: 'w8-ditado-1',
      title: 'Ditado I',
      summary: 'Ouvir e reconhecer colcheias e semicolcheias.',
      teach: [
        { kind: 'text', text: 'No ditado, o caminho é o contrário: o app toca um compasso e você escolhe a partitura. É o que acontece quando você tira uma música de ouvido.' },
        { kind: 'tip', text: 'Ouça uma vez inteira, depois ouça de novo prestando atenção em um tempo de cada vez.' },
      ],
      exercise: { type: 'rhythm-dictation', bpm: 70, patterns: [...sixteenths, 'q q e e q', 'e e e e q q', 'h e e q'] },
      rounds: 8,
    },
    {
      id: 'w8-ditado-2',
      title: 'Ditado II',
      summary: 'Pontuadas, tercinas e síncopes de ouvido.',
      teach: [
        { kind: 'text', text: 'Agora com as figuras novas. A tercina soa "redonda", rolando; a pontuada soa "mancando"; a síncope soa adiantada, antes do tempo.' },
      ],
      exercise: { type: 'rhythm-dictation', bpm: 66, patterns: [...dotted, ...triplets, ...syncopation] },
      rounds: 10,
    },
    {
      id: 'w8-tocar',
      title: 'Ritmo II no instrumento',
      summary: 'Toque os ritmos novos numa corda só.',
      teach: [
        { kind: 'text', text: 'Feche o mundo tocando de verdade: escolha uma nota (a corda solta mais grave serve) e toque os ritmos no instrumento. O app ouve os ataques e mede a precisão em milissegundos.' },
        { kind: 'tip', text: 'Se os acertos vierem sempre adiantados ou atrasados, ajuste a "compensação de latência" em Ajustes.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 60, patterns: [...sixteenths.slice(0, 2), ...dotted.slice(0, 2), ...triplets.slice(0, 1), ...syncopation.slice(0, 2)] },
      rounds: 6,
    },
  ],
}
