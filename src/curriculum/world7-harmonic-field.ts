import type { World } from './types'

const commonMajor = [0, 7, 2, 9, 4, 5]
const commonMinor = [9, 4, 2, 7, 11, 0]

export const world7: World = {
  id: 'campo',
  title: 'Campo harmônico',
  tagline: 'Por que certos acordes andam juntos',
  approach:
    'Campo harmônico como ferramenta para entender músicas reais, à la Desi Serna: graus, funções e progressões, aplicados às músicas da sua biblioteca.',
  lessons: [
    {
      id: 'w7-o-que-e',
      title: 'O que é campo harmônico',
      summary: 'Os sete acordes que nascem de uma escala.',
      teach: [
        { kind: 'text', text: 'Pegue a escala maior e monte uma tríade em cima de cada nota, usando só notas da escala (empilhando terças). Saem sete acordes: esse é o campo harmônico do tom. É dele que vem a maioria dos acordes de qualquer música.' },
        { kind: 'field', root: 0, mode: 'major', caption: 'Campo de Dó maior. Clique para ouvir cada acorde.' },
        { kind: 'text', text: 'O padrão é sempre o mesmo: I maior, ii menor, iii menor, IV maior, V maior, vi menor e vii° diminuto. Por isso os graus usam algarismos romanos: maiúsculo = maior, minúsculo = menor.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['chord-of-degree'], keys: [0, 7, 5], mode: 'major' },
      rounds: 8,
    },
    {
      id: 'w7-graus',
      title: 'Graus em qualquer tom',
      summary: 'Do número para o acorde, e de volta.',
      teach: [
        { kind: 'text', text: 'Como o padrão maior-menor-menor-maior-maior-menor-diminuto nunca muda, basta saber a escala do tom para montar o campo. Em Sol maior: G, Am, Bm, C, D, Em, F#°.' },
        { kind: 'field', root: 7, mode: 'major' },
        { kind: 'tip', text: 'Músicos falam em graus o tempo todo ("vai pro quatro", "um-cinco-seis-quatro") porque isso vale em qualquer tom.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['chord-of-degree', 'degree-of-chord'], keys: commonMajor, mode: 'major' },
      rounds: 10,
    },
    {
      id: 'w7-funcoes',
      title: 'Tônica, subdominante, dominante',
      summary: 'Repouso, afastamento e tensão.',
      teach: [
        { kind: 'text', text: 'Cada acorde do campo tem um papel. A tônica (I, e também iii e vi) é casa: repouso. A subdominante (IV e ii) afasta de casa. A dominante (V e vii°) cria tensão e pede a volta para a tônica.' },
        { kind: 'field', root: 0, mode: 'major', caption: 'Ouça C → F → G → C: casa, afasta, tensão, volta.' },
        { kind: 'tip', text: 'Quase toda música conta essa história em ciclos: sai da tônica, passa pela subdominante, chega na dominante e volta.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['function'], keys: commonMajor, mode: 'major' },
      rounds: 8,
    },
    {
      id: 'w7-ouvido-145',
      title: 'Ouvido: I, IV e V',
      summary: 'Os três acordes que sustentam o blues e o rock.',
      teach: [
        { kind: 'text', text: 'I, IV e V são os acordes maiores do campo e sustentam milhares de músicas. O app toca a tônica e depois outro acorde: você diz qual é o grau.' },
        { kind: 'tip', text: 'O IV soa como "abrir uma porta"; o V soa como "falta voltar". Cante a tônica por cima: no V ela fica desconfortável.' },
      ],
      exercise: { type: 'hear-degree', mode: 'major', degrees: [1, 4, 5] },
      rounds: 10,
    },
    {
      id: 'w7-ouvido-menores',
      title: 'Ouvido: entram ii e vi',
      summary: 'Os acordes menores do campo maior.',
      teach: [
        { kind: 'text', text: 'Agora entram os menores do campo: ii (subdominante) e vi (tônica relativa). O vi soa como "o lado triste da casa"; o ii, como um IV mais macio.' },
      ],
      exercise: { type: 'hear-degree', mode: 'major', degrees: [1, 2, 4, 5, 6] },
      rounds: 10,
    },
    {
      id: 'w7-menor',
      title: 'O campo menor',
      summary: 'O mesmo campo, a partir do 6º grau.',
      teach: [
        { kind: 'text', text: 'O campo de um tom menor tem os mesmos acordes do seu relativo maior, começando do vi. Em Lá menor: Am, B°, C, Dm, Em, F, G. O padrão fica i, ii°, III, iv, v, VI, VII.' },
        { kind: 'field', root: 9, mode: 'minor', caption: 'Campo de Lá menor: os acordes de Dó maior, com outro centro.' },
        { kind: 'tip', text: 'Na prática, muita música menor troca o v (menor) por V (maior), emprestado da menor harmônica, para ter uma dominante mais forte.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['chord-of-degree', 'relative'], keys: commonMinor, mode: 'minor' },
      rounds: 10,
    },
    {
      id: 'w7-progressoes',
      title: 'Progressões famosas',
      summary: 'I–V–vi–IV, ii–V–I, i–VI–III–VII…',
      teach: [
        { kind: 'text', text: 'Algumas sequências de graus aparecem em tantas músicas que viraram clichê: I–V–vi–IV (o pop inteiro), I–IV–V–I (rock e blues), ii–V–I (jazz e bossa) e, no menor, i–VI–III–VII (rock épico). Sabendo os graus, você toca qualquer uma em qualquer tom.' },
        { kind: 'field', root: 7, mode: 'major', caption: 'Em Sol maior, I–V–vi–IV = G – D – Em – C.' },
        { kind: 'tip', text: 'Abra uma música em Músicas e veja "Progressão principal" no painel de teoria: é essa mesma ideia, aplicada ao que você toca.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['progression'], keys: [...commonMajor, ...commonMinor], mode: 'both' },
      rounds: 8,
    },
    {
      id: 'w7-ouvido-menor',
      title: 'Ouvido no tom menor',
      summary: 'i, iv, VI e VII.',
      teach: [
        { kind: 'text', text: 'No tom menor, os acordes maiores VI e VII dão o som épico de muito rock e metal. O app toca o i e depois outro acorde do campo menor.' },
      ],
      exercise: { type: 'hear-degree', mode: 'minor', degrees: [1, 4, 6, 7] },
      rounds: 10,
    },
    {
      id: 'w7-revisao',
      title: 'Revisão: teoria aplicada',
      summary: 'Campo, funções, relativos, escalas e progressões.',
      teach: [
        { kind: 'text', text: 'A última revisão mistura tudo, em tons maiores e menores. Depois dela, o melhor exercício é abrir as músicas da sua biblioteca, ler o painel "Teoria desta música" e tocar a progressão principal em outros tons.' },
      ],
      exercise: {
        type: 'theory-quiz',
        asks: ['chord-of-degree', 'degree-of-chord', 'function', 'relative', 'scale-notes', 'progression', 'spell-chord'],
        keys: [...commonMajor, 10, 3],
        mode: 'both',
        qualities: ['maj', 'min', 'dom7', 'min7', 'maj7'],
      },
      rounds: 12,
    },
  ],
}
