import type { ShapeAnchor, World } from './types'

// as cinco formas do acorde maior, pela corda e pela casa da fundamental
const E: ShapeAnchor = { string: 0, offset: 0, width: 3, name: 'forma de E' }
const A: ShapeAnchor = { string: 1, offset: 0, width: 3, name: 'forma de A' }
const D: ShapeAnchor = { string: 2, offset: 0, width: 3, name: 'forma de D' }
const C: ShapeAnchor = { string: 1, offset: -3, width: 3, name: 'forma de C' }
const G: ShapeAnchor = { string: 0, offset: -3, width: 3, name: 'forma de G' }
const frets = { from: 3, to: 12 }
const maj = { chord: 'maj' } as const
const min = { chord: 'min' } as const

export const world6: World = {
  id: 'caged',
  title: 'CAGED e mapas',
  tagline: 'Desenhos que cobrem o braço inteiro',
  approach:
    'Sistema CAGED como apresentado por Desi Serna: cinco desenhos de acorde que se encaixam e cobrem o braço. No baixo, as mesmas posições viram mapas de arpejo.',
  lessons: [
    {
      id: 'w6-ideia',
      title: 'Um acorde, cinco lugares',
      summary: 'Por que as formas C, A, G, E e D cobrem o braço.',
      teach: [
        { kind: 'text', text: 'Os acordes abertos de C, A, G, E e D têm desenhos diferentes. A ideia do CAGED é que esses cinco desenhos, movidos com pestana, tocam qualquer acorde maior em cinco regiões do braço, uma encostada na outra.' },
        { kind: 'map', set: maj, root: 0, from: 0, to: 15, caption: 'Todas as notas de Dó maior (1, 3, 5) até a casa 15. Cada forma é uma fatia desse mapa.' },
        { kind: 'text', text: 'Subindo o braço, a ordem é sempre C → A → G → E → D, e recomeça. Saber em que forma você está diz onde estão a fundamental, a terça e a quinta, sem precisar decorar mais nada.' },
        { kind: 'tip', text: 'No baixo, você não toca os acordes inteiros, mas as mesmas regiões servem de mapa: em qualquer uma delas, 1, 3 e 5 estão ao alcance da mão.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'O que as letras C A G E D representam?', options: ['Cinco escalas', 'Cinco desenhos de acorde aberto', 'Cinco afinações', 'As notas da escala de Dó'], answer: 1, explain: 'Os desenhos dos acordes abertos de C, A, G, E e D, movidos pelo braço.' },
          { prompt: 'Subindo o braço, depois da forma de C vem qual?', options: ['A', 'G', 'E', 'D'], answer: 0, explain: 'A ordem é C → A → G → E → D, e recomeça.' },
          { prompt: 'A forma de E com a fundamental na casa 5 da corda mais grave forma qual acorde?', options: ['E', 'A', 'G', 'D'], answer: 1, explain: 'Casa 5 da corda Mi é Lá: forma de E em A.' },
          { prompt: 'A forma de A com a fundamental na casa 3 da 2ª corda mais grave forma qual acorde?', options: ['C', 'A', 'D', 'G'], answer: 0, explain: 'Casa 3 da corda Lá é Dó.' },
          { prompt: 'O que duas formas vizinhas têm em comum?', options: ['Nada', 'Elas dividem notas na emenda', 'A mesma fundamental na mesma casa', 'A mesma corda grave'], answer: 1, explain: 'A borda de uma forma é o começo da outra: é por isso que elas cobrem o braço sem buracos.' },
          { prompt: 'Para que um baixista usa essas regiões?', options: ['Para tocar acordes de 6 cordas', 'Como mapa: achar 1, 3 e 5 do acorde em qualquer região', 'Para afinar', 'Não serve para baixo'], answer: 1, explain: 'Linhas de baixo vivem de fundamental, terça e quinta: o mapa diz onde elas estão.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w6-forma-e',
      title: 'Forma de E',
      summary: 'Fundamental na corda mais grave, pestana inteira.',
      teach: [
        { kind: 'text', text: 'A forma de E é a pestana mais usada: a fundamental fica na corda mais grave, debaixo do dedo 1, e o resto do acorde nas duas casas seguintes.' },
        { kind: 'map', set: maj, root: 0, from: 5, to: 13, anchor: E, caption: 'C na forma de E, com a fundamental na casa 8.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: maj, anchor: E }], roots: 'all', frets },
      rounds: 6,
    },
    {
      id: 'w6-forma-a',
      title: 'Forma de A',
      summary: 'Fundamental na 2ª corda mais grave.',
      teach: [
        { kind: 'text', text: 'Na forma de A, a fundamental fica na segunda corda mais grave, debaixo do dedo 1. É a outra pestana do dia a dia.' },
        { kind: 'map', set: maj, root: 0, from: 1, to: 9, anchor: A, caption: 'C na forma de A, com a fundamental na casa 3.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: maj, anchor: A }], roots: 'all', frets },
      rounds: 6,
    },
    {
      id: 'w6-forma-d',
      title: 'Forma de D',
      summary: 'Fundamental na 3ª corda mais grave.',
      teach: [
        { kind: 'text', text: 'Na forma de D, a fundamental fica na terceira corda mais grave. O desenho é pequeno e mora nas cordas agudas: ótimo para acordes "em cima" na guitarra.' },
        { kind: 'map', set: maj, root: 0, from: 8, to: 15, anchor: D, caption: 'C na forma de D, com a fundamental na casa 10.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: maj, anchor: D }], roots: 'all', frets },
      rounds: 6,
    },
    {
      id: 'w6-forma-c',
      title: 'Forma de C',
      summary: 'A fundamental com o dedo mais alto, o acorde para trás.',
      teach: [
        { kind: 'text', text: 'Na forma de C, a fundamental fica na segunda corda mais grave, mas debaixo do dedo 3 ou 4: o acorde se estende para trás, em direção à mão.' },
        { kind: 'map', set: maj, root: 2, from: 0, to: 8, anchor: C, caption: 'D na forma de C, com a fundamental na casa 5.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: maj, anchor: C }], roots: 'all', frets },
      rounds: 6,
    },
    {
      id: 'w6-forma-g',
      title: 'Forma de G',
      summary: 'A fundamental na corda mais grave, o acorde para trás.',
      teach: [
        { kind: 'text', text: 'A forma de G também se estende para trás, com a fundamental na corda mais grave debaixo do dedo 3 ou 4. É a mais aberta das cinco, e muita gente usa só um pedaço dela.' },
        { kind: 'map', set: maj, root: 0, from: 3, to: 11, anchor: G, caption: 'C na forma de G, com a fundamental na casa 8.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: maj, anchor: G }], roots: 'all', frets },
      rounds: 6,
    },
    {
      id: 'w6-conectar',
      title: 'Conectando as cinco formas',
      summary: 'A forma é sorteada: ache o acorde inteiro.',
      teach: [
        { kind: 'text', text: 'Agora todas juntas. O app sorteia o acorde e a forma; você acha 1, 3 e 5 na posição. Antes de clicar, lembre a ordem C → A → G → E → D e onde cada forma guarda a fundamental.' },
        { kind: 'map', set: maj, root: 7, from: 0, to: 15, caption: 'G maior no braço inteiro: tente enxergar as cinco formas, uma depois da outra.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [E, A, D, C, G].map((anchor) => ({ set: maj, anchor })),
        roots: 'all',
        frets,
      },
      rounds: 10,
    },
    {
      id: 'w6-menores',
      title: 'Formas menores',
      summary: 'Em, Am e Dm movidos pelo braço.',
      teach: [
        { kind: 'text', text: 'As formas de E, A e D também existem em menor: basta abaixar a terça meio tom. Com elas, você toca qualquer acorde menor em três regiões.' },
        { kind: 'map', set: min, root: 9, from: 3, to: 10, anchor: E, caption: 'Am na forma de Em, com a fundamental na casa 5.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: min, anchor: { ...E, name: 'forma de Em' } },
          { set: min, anchor: { ...A, name: 'forma de Am' } },
          { set: min, anchor: { ...D, name: 'forma de Dm' } },
        ],
        roots: 'all',
        frets,
      },
      rounds: 9,
    },
    {
      id: 'w6-tocar',
      title: 'Mapas no instrumento',
      summary: 'Toque o arpejo de cada forma, subindo.',
      teach: [
        { kind: 'text', text: 'Feche o mundo tocando: o app sorteia a forma e você toca as notas do acorde naquela posição, da mais grave para a mais aguda. Na guitarra é um arpejo; no baixo, o mapa que vira linha.' },
        { kind: 'tip', text: 'Treino diário à la Guitar Aerobics: escolha um acorde por dia e toque as cinco formas em sequência, subindo o braço, com metrônomo.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'play',
        shapes: [E, A, D].map((anchor) => ({ set: maj, anchor })),
        roots: 'all',
        frets,
      },
      rounds: 4,
    },
  ],
}
