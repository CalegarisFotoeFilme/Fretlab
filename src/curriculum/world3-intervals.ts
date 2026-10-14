import type { World } from './types'

// fundamental nas duas cordas graves, nas primeiras casas: as formas são as mesmas no baixo e na guitarra
const roots = { strings: [0, 1], frets: { from: 1, to: 7 } }

export const world3: World = {
  id: 'intervalos',
  title: 'Intervalos',
  tagline: 'A distância entre duas notas',
  approach:
    'Intervalos como formas no braço, como em Desi Serna (Guitar Theory for Dummies); um elemento novo por vez (Leavitt) e prática curta, diária e com o instrumento na mão (Guitar Aerobics, de Troy Nelson).',
  lessons: [
    {
      id: 'w3-o-que-e',
      title: 'O que é um intervalo',
      summary: 'Distância entre duas notas: nome pelo número de letras, tipo pelos semitons.',
      teach: [
        { kind: 'text', text: 'Intervalo é a distância entre duas notas. Ele tem duas partes: um número e um tipo. O número vem de contar as letras de uma nota até a outra, incluindo as duas: de C até E passamos por C, D, E, então é uma terça.' },
        { kind: 'text', text: 'O tipo vem dos semitons (casas). Uma terça de 4 casas é maior; de 3 casas, menor. Segundas, terças, sextas e sétimas são maiores ou menores. Quartas, quintas e oitavas são justas: têm uma forma "certa" só.' },
        { kind: 'interval', semitones: 4, caption: 'Terça maior: 4 semitons. R é a fundamental, o ponto de partida.' },
        { kind: 'tip', text: 'No braço, cada casa é um semitom. Contar casas na mesma corda é o jeito mais direto de medir um intervalo.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Quantos semitons (casas) tem um tom?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Um tom são dois semitons: duas casas no braço.' },
          { prompt: 'De C até E, contando as letras, qual é o número do intervalo?', options: ['Segunda', 'Terça', 'Quarta', 'Quinta'], answer: 1, explain: 'C, D, E: três letras, então é uma terça.' },
          { prompt: 'De C até E são 4 semitons. Que terça é essa?', options: ['Terça menor', 'Terça maior', 'Terça justa', 'Terça aumentada'], answer: 1, explain: '4 semitons = terça maior. Com 3 seria menor.' },
          { prompt: 'De A até C são 3 semitons. Que intervalo é?', options: ['Segunda maior', 'Terça menor', 'Terça maior', 'Quarta justa'], answer: 1, explain: 'A, B, C: três letras (terça) com 3 semitons: terça menor.' },
          { prompt: 'Qual destes intervalos é chamado de justo?', options: ['Terça', 'Sexta', 'Quinta', 'Sétima'], answer: 2, explain: 'Quartas, quintas e oitavas são justas.' },
          { prompt: 'De C até G, que intervalo é?', options: ['Quarta justa', 'Quinta justa', 'Sexta maior', 'Terça maior'], answer: 1, explain: 'C, D, E, F, G: cinco letras. São 7 semitons: quinta justa.' },
          { prompt: 'Quantos semitons tem uma oitava?', options: ['8', '10', '12', '7'], answer: 2, explain: 'A oitava é a mesma nota, mais aguda, 12 casas acima.' },
          { prompt: 'Um power chord (E5, A5…) junta a fundamental com qual intervalo?', options: ['Terça', 'Quarta', 'Quinta', 'Sexta'], answer: 2, explain: 'O "5" do nome é a quinta justa. Sem terça, ele não é nem maior nem menor.' },
        ],
      },
      rounds: 8,
    },
    {
      id: 'w3-oitava',
      title: 'A oitava',
      summary: 'A mesma nota, mais aguda: a forma mais útil do braço.',
      teach: [
        { kind: 'text', text: 'A oitava é a mesma nota, só que mais aguda. Ela é a ferramenta número um para se achar no braço: sabendo uma nota nas cordas graves, você acha a mesma nota duas cordas acima.' },
        { kind: 'interval', semitones: 12, caption: 'Oitava: duas cordas acima, duas casas à frente.' },
        { kind: 'tip', text: 'Na guitarra, quando a forma cruza a corda Si (2ª corda), ela "anda" uma casa a mais: três casas à frente em vez de duas. No baixo isso nunca acontece.' },
      ],
      exercise: { type: 'play-interval', input: 'tap', intervals: [12], ...roots },
      rounds: 8,
    },
    {
      id: 'w3-quinta-quarta',
      title: 'Quinta e quarta justas',
      summary: 'As formas do power chord e da corda vizinha.',
      teach: [
        { kind: 'text', text: 'A quinta justa (7 semitons) é a base do rock: fundamental + quinta = power chord. A forma é a corda de cima, duas casas à frente.' },
        { kind: 'interval', semitones: 7, caption: 'Quinta justa: corda de cima, duas casas à frente.' },
        { kind: 'text', text: 'A quarta justa (5 semitons) é ainda mais fácil: a corda de cima, na mesma casa. É assim que o baixo e a guitarra são afinados.' },
        { kind: 'interval', semitones: 5, caption: 'Quarta justa: corda de cima, mesma casa.' },
        { kind: 'tip', text: 'Quarta e quinta se completam: subir uma quarta e depois uma quinta dá uma oitava (5 + 7 = 12).' },
      ],
      exercise: { type: 'play-interval', input: 'tap', intervals: [5, 7, 12], ...roots },
      rounds: 10,
    },
    {
      id: 'w3-tercas',
      title: 'Terças maior e menor',
      summary: 'O intervalo que decide se um acorde é alegre ou triste.',
      teach: [
        { kind: 'text', text: 'A terça é o intervalo mais importante da harmonia: é ela que faz um acorde soar maior (aberto, alegre) ou menor (fechado, melancólico).' },
        { kind: 'interval', semitones: 4, caption: 'Terça maior (4 semitons): corda de cima, uma casa para trás.' },
        { kind: 'interval', semitones: 3, caption: 'Terça menor (3 semitons): corda de cima, duas casas para trás. Ou três casas à frente na mesma corda.' },
        { kind: 'tip', text: 'Compare ouvindo as duas juntas: a diferença de uma casa muda todo o clima.' },
      ],
      exercise: { type: 'play-interval', input: 'tap', intervals: [3, 4, 7], ...roots },
      rounds: 10,
    },
    {
      id: 'w3-formas',
      title: 'Reconhecer as formas',
      summary: 'Bata o olho no desenho e diga o intervalo.',
      teach: [
        { kind: 'text', text: 'Agora o caminho inverso: o app mostra a fundamental (R) e outra nota, e você reconhece o intervalo pela forma. É o que você vai fazer ao ler uma tab e entender o que está tocando.' },
        { kind: 'tip', text: 'Pense em "corda e casas": mesma casa na corda de cima = 4ª; duas à frente = 5ª; uma para trás = 3ª maior; duas para trás = 3ª menor; duas cordas acima e duas à frente = oitava.' },
      ],
      exercise: { type: 'name-interval', intervals: [3, 4, 5, 7, 12], ...roots },
      rounds: 10,
    },
    {
      id: 'w3-ouvido-1',
      title: 'Ouvido I: quarta, quinta e oitava',
      summary: 'Reconhecer os intervalos justos só de ouvir.',
      teach: [
        { kind: 'text', text: 'Cada intervalo tem um "sabor". A oitava soa como a mesma nota, mais clara. A quinta soa forte e estável, como um power chord. A quarta soa aberta, como se pedisse para resolver.' },
        { kind: 'interval', semitones: 7, caption: 'Ouça a quinta: estável e cheia.' },
        { kind: 'tip', text: 'Cante baixinho junto. Associar o som a uma música conhecida que começa com esse salto ajuda muito a lembrar.' },
      ],
      exercise: { type: 'hear-interval', intervals: [5, 7, 12], mode: 'melodic' },
      rounds: 8,
    },
    {
      id: 'w3-segundas-setimas',
      title: 'Segundas e sétimas',
      summary: 'Os intervalos de passo e os de tensão.',
      teach: [
        { kind: 'text', text: 'Segundas são passos: a menor (1 semitom) é a casa vizinha; a maior (2 semitons) pula uma casa. Toda escala é feita de segundas.' },
        { kind: 'interval', semitones: 2, caption: 'Segunda maior: duas casas à frente, na mesma corda.' },
        { kind: 'text', text: 'Sétimas ficam a um passo da oitava. A sétima menor (10 semitons) é o "7" de um acorde dominante, como G7. A sétima maior (11 semitons) é o "7M" de acordes como C7M e fica a meio tom da oitava.' },
        { kind: 'interval', semitones: 10, caption: 'Sétima menor: duas cordas acima, mesma casa (duas casas antes da oitava).' },
        { kind: 'interval', semitones: 11, caption: 'Sétima maior: duas cordas acima, uma casa à frente (uma casa antes da oitava).' },
      ],
      exercise: { type: 'play-interval', input: 'tap', intervals: [1, 2, 10, 11], ...roots },
      rounds: 10,
    },
    {
      id: 'w3-sextas-tritono',
      title: 'Sextas e trítono',
      summary: 'Os intervalos que completam o mapa.',
      teach: [
        { kind: 'text', text: 'A sexta maior (9 semitons) tem um som doce e é muito usada em linhas de baixo de blues e country. A sexta menor (8 semitons) é mais escura.' },
        { kind: 'interval', semitones: 9, caption: 'Sexta maior: duas cordas acima, uma casa para trás.' },
        { kind: 'interval', semitones: 8, caption: 'Sexta menor: duas cordas acima, duas casas para trás.' },
        { kind: 'text', text: 'O trítono (6 semitons) fica exatamente no meio da oitava. É o intervalo mais tenso de todos, e é ele que dá a "vontade de resolver" ao acorde dominante.' },
        { kind: 'interval', semitones: 6, caption: 'Trítono: corda de cima, uma casa à frente.' },
      ],
      exercise: { type: 'play-interval', input: 'tap', intervals: [6, 8, 9], ...roots },
      rounds: 10,
    },
    {
      id: 'w3-ouvido-2',
      title: 'Ouvido II: terças no meio',
      summary: 'Distinguir terças dos intervalos justos.',
      teach: [
        { kind: 'text', text: 'Agora entram as terças. A maior soa luminosa; a menor, mais escura. Se ficar em dúvida entre as duas, ouça de novo pensando em "alegre ou triste".' },
        { kind: 'interval', semitones: 3, caption: 'Terça menor.' },
        { kind: 'interval', semitones: 4, caption: 'Terça maior.' },
      ],
      exercise: { type: 'hear-interval', intervals: [3, 4, 5, 7, 12], mode: 'melodic' },
      rounds: 10,
    },
    {
      id: 'w3-tocar',
      title: 'Agora no instrumento',
      summary: 'O app marca a fundamental e você toca o intervalo de verdade.',
      teach: [
        { kind: 'text', text: 'Hora de levar as formas para os dedos. Ligue a entrada de áudio (Ajustes → Entrada de áudio) e toque o intervalo pedido no seu instrumento. Vale a nota certa em qualquer oitava.' },
        { kind: 'tip', text: 'Toque devagar e deixe a nota soar. Sem pedaleira por perto? Dá para responder no braço da tela.' },
      ],
      exercise: { type: 'play-interval', input: 'play', intervals: [3, 4, 5, 7, 12], ...roots },
      rounds: 8,
    },
    {
      id: 'w3-ouvido-3',
      title: 'Ouvido III: juntas e separadas',
      summary: 'Intervalos melódicos e harmônicos, misturados.',
      teach: [
        { kind: 'text', text: 'Quando as duas notas soam juntas (intervalo harmônico), você ouve a "cor" do intervalo: consonante e calmo, ou dissonante e tenso. Segundas e sétimas são as mais tensas; terças, sextas e justas, as mais calmas.' },
        { kind: 'interval', semitones: 10, caption: 'Sétima menor junta: tensa, mas com cara de blues.' },
      ],
      exercise: { type: 'hear-interval', intervals: [2, 3, 4, 5, 7, 9, 10, 12], mode: 'both' },
      rounds: 12,
    },
    {
      id: 'w3-revisao',
      title: 'Revisão: todos os intervalos',
      summary: 'Os doze intervalos dentro da oitava, pela forma.',
      teach: [
        { kind: 'text', text: 'A revisão junta tudo: os doze intervalos, da segunda menor à oitava. Use as formas que você já conhece como referência e conte casas para os vizinhos.' },
        { kind: 'tip', text: 'Truque: a sétima maior é a oitava uma casa para trás; a segunda menor é a casa vizinha; o trítono fica entre a quarta e a quinta.' },
      ],
      exercise: { type: 'name-interval', intervals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ...roots },
      rounds: 12,
    },
  ],
}
