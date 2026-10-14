import type { ShapeAnchor, World } from './types'

const low = (offset: number, width: number, name: string): ShapeAnchor => ({ string: 0, offset, width, name })
const second = (offset: number, width: number, name: string): ShapeAnchor => ({ string: 1, offset, width, name })
const rootFrets = { from: 2, to: 10 }
const naturals = [0, 2, 4, 5, 7, 9, 11]

// arpejos com a fundamental no dedo 2 (acordes maiores) ou no dedo 1 (menores)
const majLow = low(-1, 3, 'fundamental na corda mais grave')
const majSecond = second(-1, 3, 'fundamental na 2ª corda mais grave')
const minLow = low(0, 3, 'fundamental na corda mais grave')
const minSecond = second(0, 3, 'fundamental na 2ª corda mais grave')

export const world5: World = {
  id: 'acordes',
  title: 'Acordes e arpejos',
  tagline: 'Tríades e tétrades, nota por nota',
  approach:
    'Acordes construídos pela fórmula (1-3-5, 1-b3-5…), como em The Guitar Handbook de Ralph Denyer, e tocados como arpejo: o acorde desenhado no braço, uma nota de cada vez.',
  lessons: [
    {
      id: 'w5-triades',
      title: 'Tríades pela fórmula',
      summary: 'Fundamental, terça e quinta: o esqueleto de todo acorde.',
      teach: [
        { kind: 'text', text: 'Um acorde é um grupo de notas tocadas juntas. A tríade, o acorde mais simples, empilha terças: fundamental (1), terça (3) e quinta (5). Mudando a terça e a quinta, nascem os quatro tipos.' },
        { kind: 'formula', set: { chord: 'maj' }, root: 0, caption: 'Maior: 1-3-5. Terça maior (4 casas) + terça menor (3 casas).' },
        { kind: 'formula', set: { chord: 'min' }, root: 0, caption: 'Menor: 1-b3-5. Só a terça desce meio tom.' },
        { kind: 'tip', text: 'Decorar a fórmula vale mais que decorar desenhos: com 1-3-5 você monta qualquer acorde maior, em qualquer lugar do braço, contando casas.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['spell-chord'], keys: naturals, mode: 'major', qualities: ['maj', 'min'] },
      rounds: 8,
    },
    {
      id: 'w5-arpejo-maior',
      title: 'Arpejo maior',
      summary: '1-3-5 desenhado no braço.',
      teach: [
        { kind: 'text', text: 'Arpejo é o acorde tocado nota por nota. No baixo, é a matéria-prima das linhas de acompanhamento; na guitarra, liga o acorde ao solo.' },
        { kind: 'map', set: { chord: 'maj' }, root: 7, from: 0, to: 8, anchor: majLow, caption: 'Arpejo de G na corda mais grave (casa 3, dedo 2): 1, 3 e 5 se repetindo pelas cordas.' },
        { kind: 'tip', text: 'A terça maior fica na corda de cima, uma casa para trás da fundamental; a quinta, na mesma corda da terça, três casas à frente. São as formas do mundo de Intervalos.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'maj' }, anchor: majLow },
          { set: { chord: 'maj' }, anchor: majSecond },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 8,
    },
    {
      id: 'w5-arpejo-menor',
      title: 'Arpejo menor',
      summary: '1-b3-5: a terça desce meio tom.',
      teach: [
        { kind: 'text', text: 'O arpejo menor só muda a terça. Com a fundamental no dedo 1, a b3 cai três casas à frente na mesma corda, e a quinta na corda de cima, duas casas à frente.' },
        { kind: 'map', set: { chord: 'min' }, root: 9, from: 3, to: 10, anchor: minLow, caption: 'Arpejo de Am na casa 5.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'min' }, anchor: minLow },
          { set: { chord: 'min' }, anchor: minSecond },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 8,
    },
    {
      id: 'w5-ouvido-triades',
      title: 'Ouvido: maior ou menor?',
      summary: 'Reconhecer a terça pelo som.',
      teach: [
        { kind: 'text', text: 'Maior soa aberto e luminoso; menor, fechado e melancólico. A diferença é uma nota só, a terça, e o ouvido aprende rápido a perceber.' },
        { kind: 'formula', set: { chord: 'maj' }, root: 7 },
        { kind: 'formula', set: { chord: 'min' }, root: 7 },
      ],
      exercise: { type: 'hear-chord', qualities: ['maj', 'min'] },
      rounds: 10,
    },
    {
      id: 'w5-dim-aum',
      title: 'Diminuto e aumentado',
      summary: 'As tríades de tensão.',
      teach: [
        { kind: 'text', text: 'Mexendo na quinta aparecem as tríades de tensão. O diminuto (1-b3-b5) empilha duas terças menores e soa instável, querendo resolver. O aumentado (1-3-#5) empilha duas terças maiores e soa suspenso, como trilha de suspense.' },
        { kind: 'formula', set: { chord: 'dim' }, root: 11, caption: 'B°: o acorde do 7º grau de Dó maior.' },
        { kind: 'formula', set: { chord: 'aug' }, root: 0 },
      ],
      exercise: { type: 'hear-chord', qualities: ['maj', 'min', 'dim', 'aug'] },
      rounds: 10,
    },
    {
      id: 'w5-tetrades',
      title: 'Tétrades: acordes com sétima',
      summary: 'Uma terça a mais em cima da tríade.',
      teach: [
        { kind: 'text', text: 'Empilhando mais uma terça sobre a tríade, aparece a sétima. São quatro tipos principais: 7M (1-3-5-7), 7 dominante (1-3-5-b7), m7 (1-b3-5-b7) e meio-diminuto m7(b5) (1-b3-b5-b7).' },
        { kind: 'formula', set: { chord: 'maj7' }, root: 0, caption: 'C7M: suave, jazzístico, bossa nova.' },
        { kind: 'formula', set: { chord: 'dom7' }, root: 7, caption: 'G7: o dominante, cheio de tensão, pedindo para resolver em C.' },
        { kind: 'formula', set: { chord: 'min7' }, root: 2, caption: 'Dm7: menor, macio, muito usado no funk e no soul.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['spell-chord'], keys: naturals, mode: 'major', qualities: ['maj7', 'dom7', 'min7', 'm7b5'] },
      rounds: 8,
    },
    {
      id: 'w5-arpejos-7',
      title: 'Arpejos com sétima',
      summary: '7M, 7 e m7 na posição.',
      teach: [
        { kind: 'text', text: 'Os arpejos com sétima são o vocabulário do jazz, do funk e de linhas de baixo que "andam". A sétima menor fica um tom abaixo da oitava; a maior, meio tom abaixo.' },
        { kind: 'map', set: { chord: 'dom7' }, root: 7, from: 0, to: 8, anchor: majLow, caption: 'G7 na casa 3: o arpejo maior mais a b7.' },
        { kind: 'map', set: { chord: 'min7' }, root: 9, from: 3, to: 10, anchor: minLow, caption: 'Am7 na casa 5: o arpejo menor mais a b7.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'dom7' }, anchor: majLow },
          { set: { chord: 'maj7' }, anchor: majLow },
          { set: { chord: 'min7' }, anchor: minLow },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 9,
    },
    {
      id: 'w5-ouvido-tetrades',
      title: 'Ouvido: 7M, 7 ou m7?',
      summary: 'A cor da sétima.',
      teach: [
        { kind: 'text', text: 'O 7M soa sonhador; o 7 (dominante), tenso e "blueseiro"; o m7, escuro mas macio. Ouça a sétima por cima da tríade: ela fica meio tom (7M) ou um tom (b7) abaixo da oitava.' },
      ],
      exercise: { type: 'hear-chord', qualities: ['maj7', 'dom7', 'min7'] },
      rounds: 10,
    },
    {
      id: 'w5-power-sus',
      title: 'Power chords e suspensos',
      summary: 'Acordes sem terça.',
      teach: [
        { kind: 'text', text: 'Tirando a terça, o acorde perde o "maior ou menor". O power chord (1-5) é a base do rock com distorção: a distorção embola as terças, e a quinta soa limpa. Os suspensos trocam a terça pela 2 (sus2) ou pela 4 (sus4), e soam em suspense, pedindo para voltar ao acorde normal.' },
        { kind: 'formula', set: { chord: 'pow' }, root: 4, caption: 'E5: fundamental e quinta (e a oitava, na prática).' },
        { kind: 'formula', set: { chord: 'sus4' }, root: 2, caption: 'Dsus4: a 4 no lugar da terça.' },
      ],
      exercise: { type: 'hear-chord', qualities: ['maj', 'min', 'sus2', 'sus4', 'pow'] },
      rounds: 10,
    },
    {
      id: 'w5-revisao',
      title: 'Revisão: arpejos na posição',
      summary: 'Tríades e tétrades misturadas.',
      teach: [
        { kind: 'text', text: 'A revisão sorteia o acorde e a posição. Pense na fórmula antes de clicar: 1 e 5 são quase sempre iguais; o que muda é a terça e a sétima.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'maj' }, anchor: majLow },
          { set: { chord: 'min' }, anchor: minLow },
          { set: { chord: 'maj' }, anchor: majSecond },
          { set: { chord: 'min' }, anchor: minSecond },
          { set: { chord: 'dom7' }, anchor: majLow },
          { set: { chord: 'min7' }, anchor: minLow },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 10,
    },
  ],
}
