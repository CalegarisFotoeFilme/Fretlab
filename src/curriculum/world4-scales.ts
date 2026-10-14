import type { ShapeAnchor, World } from './types'

// posições ("caixas") a partir da fundamental na corda mais grave ou na segunda
const ON_LOW = (offset: number, width: number, name?: string): ShapeAnchor => ({ string: 0, offset, width, name })
const ON_SECOND = (offset: number, width: number, name?: string): ShapeAnchor => ({ string: 1, offset, width, name })
const rootFrets = { from: 2, to: 10 }

const majorLow = ON_LOW(-1, 4, 'fundamental na corda mais grave, dedo 2')
const majorSecond = ON_SECOND(-1, 4, 'fundamental na 2ª corda mais grave, dedo 2')
const minorLow = ON_LOW(0, 3, 'fundamental na corda mais grave, dedo 1')
const pentaMinor = ON_LOW(0, 3, 'caixa 1')
const pentaMajor = ON_LOW(-1, 3, 'caixa da maior')

export const world4: World = {
  id: 'escalas',
  title: 'Escalas',
  tagline: 'Maior, menor e pentatônicas',
  approach:
    'Escalas como desenhos no braço (Desi Serna) estudadas por posição, um dedo por casa, como em William Leavitt; a pentatônica primeiro, porque é o que mais aparece no rock e no blues.',
  lessons: [
    {
      id: 'w4-escala-maior',
      title: 'A escala maior',
      summary: 'Sete notas e uma receita de tons e semitons.',
      teach: [
        { kind: 'text', text: 'A escala maior é a régua da teoria: acordes, campo harmônico e graus são todos medidos a partir dela. Ela tem sete notas, e o que define a escala é a distância entre elas.' },
        { kind: 'text', text: 'A receita é T T S T T T S (T = tom, 2 casas; S = semitom, 1 casa). Começando em qualquer nota e seguindo a receita, você monta a escala maior daquela nota.' },
        { kind: 'formula', set: { scale: 'major' }, root: 0, caption: 'Dó maior só tem notas naturais: os semitons caem em E–F e B–C.' },
        { kind: 'map', set: { scale: 'major' }, root: 0, from: 0, to: 12, caption: 'Dó maior no braço. Os números são os graus (1 = tônica).' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Qual é a receita da escala maior?', options: ['T T S T T T S', 'T S T T S T T', 'T T T S T T S', 'S T T T S T T'], answer: 0, explain: 'Tom, tom, semitom, tom, tom, tom, semitom.' },
          { prompt: 'Entre quais graus ficam os semitons da escala maior?', options: ['1–2 e 5–6', '3–4 e 7–8', '2–3 e 6–7', '4–5 e 7–8'], answer: 1, explain: 'Do 3º para o 4º e do 7º para a oitava.' },
          { prompt: 'Quais são as notas de Dó maior?', options: ['C D E F G A B', 'C D Eb F G Ab Bb', 'C D E F# G A B', 'C D E F G A Bb'], answer: 0, explain: 'Dó maior é a escala sem sustenidos nem bemóis.' },
          { prompt: 'A escala de Sol maior tem um sustenido. Qual?', options: ['C#', 'F#', 'G#', 'D#'], answer: 1, explain: 'Seguindo a receita a partir de G: G A B C D E F# G.' },
          { prompt: 'Quantas notas diferentes tem uma escala maior?', options: ['5', '6', '7', '8'], answer: 2, explain: 'Sete notas; a oitava é a tônica de novo.' },
          { prompt: 'Quantas casas há entre a 1ª e a 3ª nota da escala maior?', options: ['3', '4', '5', '2'], answer: 1, explain: 'T + T = 4 semitons: a terça maior que dá o som "maior".' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w4-maior-posicao',
      title: 'A escala maior numa posição',
      summary: 'Um dedo por casa, sem mexer a mão.',
      teach: [
        { kind: 'text', text: 'Tocar "por posição" é deixar a mão parada numa região de quatro ou cinco casas, um dedo para cada casa, e achar todas as notas da escala ali. É assim que se estuda escala com metrônomo: sem pular pelo braço.' },
        { kind: 'map', set: { scale: 'major' }, root: 7, from: 0, to: 12, anchor: majorLow, caption: 'Sol maior com a fundamental na corda mais grave (casa 3), dedo 2. A posição está cheia; o resto da escala, tracejado.' },
        { kind: 'tip', text: 'Clique em todas as notas da escala dentro da posição. A fundamental (1) já vem marcada. Se travar, aperte Ouvir para escutar a escala inteira subindo.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'major' }, anchor: majorLow }], roots: 'naturals', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w4-maior-duas-raizes',
      title: 'Escala maior: duas fundamentais',
      summary: 'A mesma escala a partir da segunda corda.',
      teach: [
        { kind: 'text', text: 'A escala maior tem um desenho com a fundamental na corda mais grave e outro com ela na segunda corda. Juntos, eles cobrem quase todas as tonalidades sem sair das primeiras casas.' },
        { kind: 'map', set: { scale: 'major' }, root: 0, from: 0, to: 12, anchor: majorSecond, caption: 'Dó maior com a fundamental na 2ª corda mais grave (casa 3).' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { scale: 'major' }, anchor: majorLow },
          { set: { scale: 'major' }, anchor: majorSecond },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 8,
    },
    {
      id: 'w4-graus',
      title: 'Os graus da escala',
      summary: 'Cada nota da escala tem um número.',
      teach: [
        { kind: 'text', text: 'Grau é a posição da nota na escala: 1 é a tônica, 3 é a terça, 5 a quinta e assim por diante. É a mesma coisa que o intervalo desde a tônica, por isso as formas do mundo de Intervalos voltam aqui.' },
        { kind: 'text', text: 'Pensar em graus deixa a teoria independente do tom: "1-3-5" é o acorde maior em qualquer tonalidade, e "1-4-5" é o blues em qualquer lugar do braço.' },
        { kind: 'map', set: { scale: 'major' }, root: 7, from: 0, to: 8, anchor: majorLow, caption: 'Sol maior com os graus. Repare que o desenho é o mesmo em qualquer tom: só muda a casa.' },
      ],
      exercise: { type: 'name-interval', intervals: [2, 4, 5, 7, 9, 11, 12], strings: [0, 1], frets: { from: 1, to: 7 } },
      rounds: 10,
    },
    {
      id: 'w4-menor-natural',
      title: 'A escala menor natural',
      summary: 'A mesma família de notas, outro centro.',
      teach: [
        { kind: 'text', text: 'A menor natural tem a receita T S T T S T T. O terceiro grau é menor (b3), e é ele que dá o clima escuro. Também mudam o 6º e o 7º graus (b6 e b7).' },
        { kind: 'formula', set: { scale: 'minor' }, root: 9, caption: 'Lá menor: as mesmas notas de Dó maior, começando no Lá.' },
        { kind: 'tip', text: 'Toda escala maior tem uma menor "relativa" com as mesmas notas, começando no 6º grau. Dó maior e Lá menor são relativas.' },
        { kind: 'map', set: { scale: 'minor' }, root: 9, from: 3, to: 10, anchor: minorLow, caption: 'Lá menor numa posição, fundamental na casa 5 da corda mais grave, dedo 1.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'minor' }, anchor: minorLow }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w4-pentatonica-menor',
      title: 'Pentatônica menor',
      summary: 'Cinco notas e a caixa mais famosa do rock.',
      teach: [
        { kind: 'text', text: 'A pentatônica menor tira dois graus da menor natural (o 2 e o b6) e fica com 1, b3, 4, 5 e b7. Sem as notas "perigosas", quase tudo que você toca com ela soa bem sobre o tom menor.' },
        { kind: 'formula', set: { scale: 'minorPentatonic' }, root: 9 },
        { kind: 'map', set: { scale: 'minorPentatonic' }, root: 9, from: 3, to: 10, anchor: pentaMinor, caption: 'A caixa 1 de Lá menor: duas notas por corda, dedos 1 e 4 (ou 1 e 3).' },
        { kind: 'tip', text: 'No baixo, essa mesma caixa é a base de incontáveis linhas de rock e blues. Na guitarra, é o primeiro desenho de solo de quase todo mundo.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'minorPentatonic' }, anchor: pentaMinor }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w4-pentatonica-maior',
      title: 'Pentatônica maior',
      summary: '1, 2, 3, 5, 6: o som do country e do pop.',
      teach: [
        { kind: 'text', text: 'A pentatônica maior é a escala maior sem o 4 e o 7: fica 1, 2, 3, 5, 6. Ela tem as mesmas notas da pentatônica menor relativa, só que com outro centro.' },
        { kind: 'formula', set: { scale: 'majorPentatonic' }, root: 7 },
        { kind: 'map', set: { scale: 'majorPentatonic' }, root: 7, from: 0, to: 8, anchor: pentaMajor, caption: 'Sol pentatônica maior, fundamental na casa 3 com o dedo 2.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'majorPentatonic' }, anchor: pentaMajor }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w4-blues',
      title: 'A escala blues',
      summary: 'A pentatônica menor com a "blue note".',
      teach: [
        { kind: 'text', text: 'Junte a b5 (quinta diminuta) à pentatônica menor e você tem a escala blues. A b5 é uma nota de passagem: soa tensa parada, mas linda indo para a 5 ou para a 4.' },
        { kind: 'formula', set: { scale: 'blues' }, root: 4 },
        { kind: 'map', set: { scale: 'blues' }, root: 4, from: 10, to: 15, anchor: pentaMinor, caption: 'Mi blues na casa 12: a caixa 1 com a b5 a mais.' },
      ],
      exercise: { type: 'note-set', input: 'tap', shapes: [{ set: { scale: 'blues' }, anchor: pentaMinor }], roots: 'all', frets: rootFrets },
      rounds: 6,
    },
    {
      id: 'w4-tocar-pentatonica',
      title: 'Pentatônica no instrumento',
      summary: 'Toque a caixa subindo, nota por nota.',
      teach: [
        { kind: 'text', text: 'Agora é com os dedos. O app marca a fundamental e você toca a caixa inteira da pentatônica menor subindo, do grave para o agudo. Ele acompanha e mostra a próxima nota esperada.' },
        { kind: 'tip', text: 'Ligue a pedaleira em Ajustes → Entrada de áudio. Toque devagar: precisão antes de velocidade. Depois, repita com o metrônomo em casa, subindo o BPM aos poucos.' },
      ],
      exercise: { type: 'note-set', input: 'play', shapes: [{ set: { scale: 'minorPentatonic' }, anchor: pentaMinor }], roots: 'all', frets: rootFrets },
      rounds: 4,
    },
    {
      id: 'w4-modos',
      title: 'Dórico e mixolídio',
      summary: 'Duas escalas que mudam uma nota só.',
      teach: [
        { kind: 'text', text: 'Mudando uma nota de escalas que você já conhece, aparecem cores novas. O dórico é a menor natural com a 6 maior: o som do funk e do rock "Santana". O mixolídio é a maior com a b7: o som do blues-rock e do acorde dominante.' },
        { kind: 'formula', set: { scale: 'dorian' }, root: 2, caption: 'Ré dórico: as notas de Dó maior, começando no Ré.' },
        { kind: 'formula', set: { scale: 'mixolydian' }, root: 7, caption: 'Sol mixolídio: as notas de Dó maior, começando no Sol.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { scale: 'dorian' }, anchor: ON_LOW(0, 4, 'dórico, dedo 1') },
          { set: { scale: 'mixolydian' }, anchor: ON_LOW(-1, 4, 'mixolídio, dedo 2') },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 6,
    },
    {
      id: 'w4-revisao',
      title: 'Revisão: escalas na posição',
      summary: 'Maior, menor, pentatônicas e blues misturadas.',
      teach: [
        { kind: 'text', text: 'A revisão sorteia escala, tom e desenho. Antes de clicar, pense nos graus: onde está a terça? Ela é maior ou menor? O resto se encaixa em volta.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { scale: 'major' }, anchor: majorLow },
          { set: { scale: 'major' }, anchor: majorSecond },
          { set: { scale: 'minor' }, anchor: minorLow },
          { set: { scale: 'minorPentatonic' }, anchor: pentaMinor },
          { set: { scale: 'majorPentatonic' }, anchor: pentaMajor },
          { set: { scale: 'blues' }, anchor: pentaMinor },
        ],
        roots: 'all',
        frets: rootFrets,
      },
      rounds: 10,
    },
  ],
}
