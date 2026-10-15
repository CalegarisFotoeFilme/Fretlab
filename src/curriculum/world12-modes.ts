import type { ShapeAnchor, World } from './types'

// todos com a fundamental na corda mais grave, um dedo por casa (4 casas)
const box = (offset: number, name: string): ShapeAnchor => ({ string: 0, offset, width: 4, name })
const finger1 = box(0, 'fundamental com o dedo 1')
const finger2 = box(-1, 'fundamental com o dedo 2')
const rootFrets = { from: 2, to: 10 }

export const world12: World = {
  id: 'modos',
  title: 'Modos gregos',
  tagline: 'Sete cores a partir de uma escala só',
  approach:
    'Modos como "a escala maior começando em outro grau" e, ao mesmo tempo, como escalas com cor própria, comparadas com a maior ou a menor (abordagem de Desi Serna e de Guitar All-in-One).',
  lessons: [
    {
      id: 'w12-o-que-sao',
      title: 'O que são modos',
      summary: 'A mesma escala, outro centro.',
      teach: [
        { kind: 'text', text: 'Toque as notas de Dó maior de Ré a Ré, sem nenhum sustenido ou bemol: a sequência de tons e semitons muda, e o som também. Cada grau da escala maior vira um modo: I jônio, II dórico, III frígio, IV lídio, V mixolídio, VI eólio, VII lócrio.' },
        { kind: 'text', text: 'Na prática, é mais útil pensar em cada modo comparado com a maior ou a menor: "dórico = menor com 6 maior". Assim você ouve a nota que dá a cor, em vez de decorar sete desenhos.' },
        { kind: 'formula', set: { scale: 'major' }, root: 0, caption: 'Jônio = escala maior.' },
        { kind: 'formula', set: { scale: 'minor' }, root: 9, caption: 'Eólio = menor natural: as notas de Dó maior a partir do Lá.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Qual modo começa no 2º grau da escala maior?', options: ['Frígio', 'Dórico', 'Lídio', 'Lócrio'], answer: 1, explain: 'I jônio, II dórico, III frígio, IV lídio, V mixolídio, VI eólio, VII lócrio.' },
          { prompt: 'As notas de Dó maior tocadas de Sol a Sol formam…', options: ['Sol mixolídio', 'Sol lídio', 'Sol dórico', 'Sol eólio'], answer: 0, explain: 'Sol é o 5º grau de Dó: mixolídio.' },
          { prompt: 'Qual outro nome tem a menor natural?', options: ['Jônio', 'Eólio', 'Frígio', 'Lócrio'], answer: 1, explain: 'A menor natural é o 6º modo: eólio.' },
          { prompt: 'Mi frígio usa as notas de qual escala maior?', options: ['Mi maior', 'Dó maior', 'Sol maior', 'Lá maior'], answer: 1, explain: 'Mi é o 3º grau de Dó maior; o frígio é o 3º modo.' },
          { prompt: 'Por que comparar o modo com a maior ou a menor?', options: ['Para ouvir a nota que dá a cor', 'Porque é obrigatório', 'Para não usar o braço', 'Não ajuda'], answer: 0, explain: 'A nota diferente (ex.: a 6 maior do dórico) é o que faz o modo soar como ele.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w12-lidio',
      title: 'Lídio',
      summary: 'A maior com #4: sonhador.',
      teach: [
        { kind: 'text', text: 'O lídio é a escala maior com a 4ª aumentada (#4). Essa nota tira o "peso" da 4ª e deixa o som flutuante, de trilha de filme e de sonho.' },
        { kind: 'formula', set: { scale: 'lydian' }, root: 5, caption: 'Fá lídio: as notas de Dó maior a partir do Fá. O Si é a #4.' },
        { kind: 'map', set: { scale: 'lydian' }, root: 5, from: 0, to: 5, caption: 'Fá lídio no começo do braço.' },
        { kind: 'tip', text: 'Sobre um acorde maior, insista na #4 resolvendo na 5: a cor lídia aparece na hora.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'lydian' }, anchor: finger2 }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w12-mixolidio',
      title: 'Mixolídio',
      summary: 'A maior com b7: blues e rock.',
      teach: [
        { kind: 'text', text: 'O mixolídio é a escala maior com a 7ª menor (b7). É a escala do acorde dominante (7) e de muito riff de rock, blues e baião.' },
        { kind: 'formula', set: { scale: 'mixolydian' }, root: 7, caption: 'Sol mixolídio: Dó maior a partir do Sol. O Fá é a b7.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'mixolydian' }, anchor: finger2 }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w12-dorico',
      title: 'Dórico',
      summary: 'A menor com 6 maior: funk e soul.',
      teach: [
        { kind: 'text', text: 'O dórico é a menor natural com a 6ª maior. Continua menor, mas menos triste: é o som de muito funk, soul, jazz modal e rock latino.' },
        { kind: 'formula', set: { scale: 'dorian' }, root: 2, caption: 'Ré dórico: Dó maior a partir do Ré. O Si é a 6 maior.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'dorian' }, anchor: finger1 }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w12-frigio',
      title: 'Frígio',
      summary: 'A menor com b2: flamenco e metal.',
      teach: [
        { kind: 'text', text: 'O frígio é a menor natural com a 2ª menor (b2). O meio tom logo acima da tônica dá o clima espanhol e pesado, comum no flamenco e no metal.' },
        { kind: 'formula', set: { scale: 'phrygian' }, root: 4, caption: 'Mi frígio: Dó maior a partir do Mi. O Fá é a b2.' },
        { kind: 'tip', text: 'Toque a tônica e a b2 alternando, na corda mais grave: é o riff frígio por excelência.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'phrygian' }, anchor: finger1 }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w12-locrio',
      title: 'Lócrio',
      summary: 'O modo instável, com b5.',
      teach: [
        { kind: 'text', text: 'O lócrio tem b2 e b5: a quinta diminuta tira a estabilidade da tônica. É raro como "tom" de música, mas é a escala do acorde meio-diminuto (m7(b5)), muito usado no jazz.' },
        { kind: 'formula', set: { scale: 'locrian' }, root: 11, caption: 'Si lócrio: Dó maior a partir do Si.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'locrian' }, anchor: finger1 }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w12-revisao',
      title: 'Cores dos modos',
      summary: 'Qual nota dá a cor de cada modo.',
      teach: [
        { kind: 'text', text: 'Resumo pela nota característica. Maiores: jônio (a referência), lídio (#4), mixolídio (b7). Menores: eólio (a referência), dórico (6 maior), frígio (b2). Diminuto: lócrio (b2 e b5).' },
        { kind: 'tip', text: 'Para usar um modo, toque sobre um acorde fixo (um "pedal" na tônica) e destaque a nota característica.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Qual modo é a maior com #4?', options: ['Mixolídio', 'Lídio', 'Dórico', 'Jônio'], answer: 1, explain: 'Lídio: a 4ª aumentada é a cor dele.' },
          { prompt: 'Qual modo é a menor com 6 maior?', options: ['Frígio', 'Eólio', 'Dórico', 'Lócrio'], answer: 2, explain: 'Dórico: menor com a 6 maior.' },
          { prompt: 'Qual modo combina com um acorde dominante (G7)?', options: ['Mixolídio', 'Lídio', 'Frígio', 'Eólio'], answer: 0, explain: 'Mixolídio: 1, 3, 5 e b7 são exatamente o acorde dominante.' },
          { prompt: 'Qual é a nota característica do frígio?', options: ['#4', 'b7', 'b2', '6 maior'], answer: 2, explain: 'O meio tom acima da tônica (b2).' },
          { prompt: 'Qual modo tem a quinta diminuta?', options: ['Lócrio', 'Dórico', 'Lídio', 'Mixolídio'], answer: 0, explain: 'O lócrio tem b5, por isso é instável.' },
          { prompt: 'Lá dórico usa as notas de qual escala maior?', options: ['Lá maior', 'Sol maior', 'Dó maior', 'Ré maior'], answer: 1, explain: 'Lá é o 2º grau de Sol maior; o dórico é o 2º modo.' },
        ],
      },
      rounds: 6,
    },
  ],
}
