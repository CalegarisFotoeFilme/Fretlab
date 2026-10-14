import type { World } from './types'

const all12 = { from: 0, to: 12 }

export const world1: World = {
  id: 'braco',
  title: 'O Braço',
  tagline: 'Saber onde cada nota mora',
  approach: 'Abordagem inspirada em Desi Serna (Guitar Theory for Dummies): as cordas graves primeiro, como mapa para o resto do braço.',
  lessons: [
    {
      id: 'w1-cordas-soltas',
      title: 'As cordas soltas',
      summary: 'O nome de cada corda tocada sem apertar nenhuma casa.',
      teach: [
        { kind: 'text', text: 'Tudo no braço começa nas cordas soltas. Se você sabe o nome de cada corda, consegue encontrar qualquer nota contando casas a partir dela.' },
        { kind: 'open-strings' },
        { kind: 'tip', text: 'Na tablatura, a linha de baixo é a corda mais grave. Aqui no FretLab o braço segue a mesma regra.' },
      ],
      exercise: { type: 'name-note', pool: 'all', strings: 'all', frets: { from: 0, to: 0 }, choices: 4 },
      rounds: 8,
    },
    {
      id: 'w1-alfabeto',
      title: 'O alfabeto musical',
      summary: 'Sete letras, e dois pares de notas sem casa entre eles.',
      teach: [
        { kind: 'text', text: 'A música usa só sete nomes de nota. Em cifra, eles viram letras: A = Lá, B = Si, C = Dó, D = Ré, E = Mi, F = Fá, G = Sol. Depois do G, volta para o A.' },
        { kind: 'text', text: 'Entre quase todas as notas vizinhas existe uma casa de distância extra no braço (um tom = 2 casas). As exceções são Mi–Fá (E–F) e Si–Dó (B–C): ali a próxima nota está colada, na casa seguinte (um semitom = 1 casa).' },
        { kind: 'fretboard', pool: 'naturals', strings: [0], frets: all12, caption: 'Notas naturais na corda mais grave. Repare nos pares colados E–F e B–C.' },
        { kind: 'tip', text: 'Lembrete rápido: "Mi-Fá e Si-Dó não têm vizinho no meio".' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Qual nota vem depois de G (Sol)?', options: ['H', 'A', 'F', 'C'], answer: 1, explain: 'O alfabeto musical vai de A a G e recomeça: …F, G, A, B…' },
          { prompt: 'Qual é a cifra de Ré?', options: ['R', 'E', 'D', 'C'], answer: 2, explain: 'Dó = C, Ré = D, Mi = E.' },
          { prompt: 'Quantas casas existem entre E e F?', options: ['1 (estão coladas)', '2', '3', '0'], answer: 0, explain: 'E–F é um semitom: a próxima casa já é F.' },
          { prompt: 'Quantas casas de C até D?', options: ['1', '2', '3', '4'], answer: 1, explain: 'C–D é um tom: duas casas (no meio fica C#).' },
          { prompt: 'Qual par de notas também fica colado, igual a E–F?', options: ['A–B', 'B–C', 'C–D', 'G–A'], answer: 1, explain: 'Os dois semitons naturais são E–F e B–C.' },
          { prompt: 'Na corda A solta (Lá), qual nota está na casa 2?', options: ['A#', 'B', 'C', 'G'], answer: 1, explain: 'A → B é um tom, então são 2 casas.' },
          { prompt: 'Na corda A, qual nota está na casa 3?', options: ['C', 'B', 'D', 'C#'], answer: 0, explain: 'B → C é semitom: só 1 casa depois do B (casa 2).' },
          { prompt: 'Na corda E solta (Mi), qual nota está na casa 1?', options: ['F#', 'F', 'E#', 'G'], answer: 1, explain: 'E → F é semitom, então F fica na casa 1.' },
        ],
      },
      rounds: 8,
    },
    {
      id: 'w1-corda-grave',
      title: 'Notas na corda mais grave',
      summary: 'As notas naturais da casa 0 à 12 na corda mais grossa.',
      teach: [
        { kind: 'text', text: 'Vamos mapear a corda mais grave, que no baixo é onde mora a fundamental de quase todo acorde. Use o que você aprendeu: tom = 2 casas, semitom = 1 casa.' },
        { kind: 'fretboard', pool: 'naturals', strings: [0], frets: all12, caption: 'Toque nos marcadores para ouvir cada nota.' },
        { kind: 'tip', text: 'Use as bolinhas do braço como âncora: na corda Mi (afinação padrão), as casas 3, 5 e 7 são G, A e B. Depois vêm C na 8, D na 10 e E de novo na 12.' },
      ],
      exercise: { type: 'find-note', input: 'tap', pool: 'naturals', strings: [0], frets: all12 },
      rounds: 10,
    },
    {
      id: 'w1-segunda-corda',
      title: 'Notas na segunda corda',
      summary: 'Agora a corda logo acima da mais grave.',
      teach: [
        { kind: 'text', text: 'A segunda corda (Lá na afinação padrão) completa a dupla que o baixista usa o tempo todo. Com as duas, você alcança qualquer nota natural sem sair das primeiras casas.' },
        { kind: 'fretboard', pool: 'naturals', strings: [1], frets: all12, caption: 'Notas naturais na segunda corda.' },
      ],
      exercise: { type: 'find-note', input: 'tap', pool: 'naturals', strings: [1], frets: all12 },
      rounds: 10,
    },
    {
      id: 'w1-duas-graves',
      title: 'Revisão: as duas cordas graves',
      summary: 'Misturando as duas cordas, com o relógio correndo.',
      teach: [
        { kind: 'text', text: 'Hora de juntar tudo. A mesma nota aparece nas duas cordas, e qualquer posição válida conta.' },
        { kind: 'tip', text: 'Na afinação padrão, a nota na casa 5 de uma corda é igual à corda solta de cima. É assim que se afina de ouvido.' },
      ],
      exercise: { type: 'find-note', input: 'tap', pool: 'naturals', strings: [0, 1], frets: all12 },
      rounds: 12,
    },
    {
      id: 'w1-casa-12',
      title: 'Casa 12: o braço se repete',
      summary: 'Depois da casa 12, as notas se repetem uma oitava acima.',
      teach: [
        { kind: 'text', text: 'Uma oitava tem 12 semitons. Por isso a casa 12 tem a mesma nota da corda solta, só que mais aguda. As bolinhas duplas marcam esse ponto.' },
        { kind: 'text', text: 'Isso economiza memória: o que você sabe das casas 0–11 vale igual das casas 12–23.' },
      ],
      exercise: { type: 'name-note', pool: 'all', strings: 'all', frets: { from: 12, to: 12 }, choices: 4 },
      rounds: 6,
    },
    {
      id: 'w1-acidentes',
      title: 'Sustenidos e bemóis',
      summary: 'As notas entre as naturais e seus dois nomes.',
      teach: [
        { kind: 'text', text: 'O sustenido (♯) sobe uma casa e o bemol (♭) desce uma casa. A casa entre C e D pode ser chamada de C# ou de Db: é o mesmo som com dois nomes (enarmonia).' },
        { kind: 'fretboard', pool: 'all', strings: [0], frets: all12, caption: 'Todas as 12 notas na corda mais grave.' },
        { kind: 'tip', text: 'Como E–F e B–C não têm casa no meio, E# é o mesmo que F, e B# é o mesmo que C. Isso aparece pouco, mas aparece.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Que nota é uma casa acima de F?', options: ['F#', 'G', 'Fb', 'E'], answer: 0, explain: 'Sustenido sobe uma casa: F → F#.' },
          { prompt: 'Qual outro nome tem C#?', options: ['Cb', 'Db', 'D#', 'B#'], answer: 1, explain: 'Subir um semitom de C é o mesmo que descer um de D.' },
          { prompt: 'Qual outro nome tem Bb?', options: ['A#', 'B#', 'Cb', 'Ab'], answer: 0, explain: 'Bb fica entre A e B, então também é A#.' },
          { prompt: 'Uma casa abaixo de E é…', options: ['E#', 'D', 'Eb', 'F'], answer: 2, explain: 'Bemol desce uma casa: E → Eb (igual a D#).' },
          { prompt: 'Quantas notas diferentes existem no total?', options: ['7', '10', '12', '14'], answer: 2, explain: '7 naturais + 5 entre elas = 12.' },
          { prompt: 'Na corda A, casa 1, a nota é…', options: ['A# / Bb', 'B', 'G#', 'Ab'], answer: 0, explain: 'Uma casa acima do A.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w1-cromatico-graves',
      title: 'Todas as notas nas cordas graves',
      summary: 'Naturais e acidentes nas duas cordas mais graves.',
      teach: [{ kind: 'text', text: 'Agora valem as 12 notas. Pense a partir da natural mais próxima: G# está uma casa depois do G.' }],
      exercise: { type: 'find-note', input: 'tap', pool: 'all', strings: [0, 1], frets: all12 },
      rounds: 12,
    },
    {
      id: 'w1-oitavas',
      title: 'Oitavas: o atalho',
      summary: 'Duas cordas acima, duas casas à frente.',
      teach: [
        { kind: 'text', text: 'Para achar a mesma nota uma oitava acima, pule uma corda e avance duas casas. Com isso, quem sabe as duas cordas graves já conhece as outras.' },
        { kind: 'fretboard', pool: [7], strings: 'all', frets: all12, caption: 'Todas as posições de G (Sol). Veja o desenho da oitava se repetindo.', octaves: true },
        { kind: 'tip', text: 'Na guitarra, quando o salto cruza a corda Si (B), avance três casas em vez de duas.' },
      ],
      exercise: { type: 'find-note', input: 'tap', pool: 'naturals', strings: 'all', frets: all12 },
      rounds: 12,
    },
    {
      id: 'w1-tocando',
      title: 'Agora com o instrumento',
      summary: 'O FretLab ouve você tocar. Plugue a pedaleira.',
      teach: [
        { kind: 'text', text: 'Mesmo exercício, mas agora quem responde é o instrumento. Toque a nota pedida em qualquer lugar do braço e deixe soar até o LED acender.' },
        { kind: 'tip', text: 'Use a pedaleira como interface de áudio (USB) e escolha-a em Ajustes. Antes, faça um teste no Afinador. Toque uma nota de cada vez, sem acorde.' },
      ],
      exercise: { type: 'find-note', input: 'play', pool: 'naturals', strings: [0, 1], frets: all12 },
      rounds: 10,
    },
    {
      id: 'w1-desafio',
      title: 'Desafio do braço',
      summary: 'Todas as notas, todas as cordas, casas 0–12.',
      teach: [{ kind: 'text', text: 'Prova final do mundo. Sem pressa: precisão vale mais que velocidade, mas tentar ser rápido também ajuda.' }],
      exercise: { type: 'find-note', input: 'tap', pool: 'all', strings: 'all', frets: all12 },
      rounds: 15,
    },
  ],
}
