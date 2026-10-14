import type { World } from './types'

const firstPosition = { from: 0, to: 5 }

export const world9: World = {
  id: 'leitura',
  title: 'Leitura de partitura',
  tagline: 'Da tablatura para a pauta',
  approach:
    'Leitura por posição, como em William Leavitt: primeiro as cordas soltas, depois as notas naturais nas primeiras casas, sempre ligando a nota escrita ao lugar no braço.',
  lessons: [
    {
      id: 'w9-pauta',
      title: 'A pauta e a clave',
      summary: 'Cinco linhas, quatro espaços e uma oitava "escondida".',
      teach: [
        { kind: 'text', text: 'A pauta tem cinco linhas e quatro espaços; quanto mais alta a nota no desenho, mais aguda ela soa. A clave no começo diz qual nota mora em qual linha.' },
        { kind: 'text', text: 'Guitarra lê na clave de sol, e baixo na clave de fá. Os dois instrumentos são escritos uma oitava acima do som real, para as notas caberem na pauta. Por isso a clave leva um 8 pequeno embaixo.' },
        { kind: 'staff', notes: 'open-strings', caption: 'As cordas soltas do seu instrumento na pauta, da mais grave para a mais aguda.' },
        { kind: 'tip', text: 'Notas fora da pauta ganham linhas suplementares: pequenos tracinhos que continuam a pauta para cima ou para baixo.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Quantas linhas tem a pauta?', options: ['4', '5', '6', '7'], answer: 1, explain: 'Cinco linhas e quatro espaços entre elas.' },
          { prompt: 'Uma nota mais alta na pauta soa…', options: ['Mais grave', 'Mais aguda', 'Mais forte', 'Mais longa'], answer: 1, explain: 'Altura no papel = altura do som.' },
          { prompt: 'Em que clave se escreve a guitarra?', options: ['Clave de fá', 'Clave de dó', 'Clave de sol', 'Não usa clave'], answer: 2, explain: 'Clave de sol, com um 8 embaixo: soa uma oitava abaixo do escrito.' },
          { prompt: 'Em que clave se escreve o baixo?', options: ['Clave de sol', 'Clave de fá', 'Clave de dó', 'Não usa clave'], answer: 1, explain: 'Clave de fá, também uma oitava acima do som real.' },
          { prompt: 'Para que servem as linhas suplementares?', options: ['Marcar o compasso', 'Escrever notas acima ou abaixo da pauta', 'Indicar o andamento', 'Indicar a corda'], answer: 1, explain: 'Elas continuam a pauta para notas muito graves ou agudas.' },
          { prompt: 'O que o 8 pequeno embaixo da clave indica?', options: ['Oito compassos', 'Que soa uma oitava abaixo do escrito', 'Oito notas por compasso', 'A 8ª casa'], answer: 1, explain: 'É a convenção de guitarra e baixo: escrito uma oitava acima do som.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w9-cordas-soltas',
      title: 'Cordas soltas na pauta',
      summary: 'O primeiro mapa entre o papel e o braço.',
      teach: [
        { kind: 'text', text: 'Comece reconhecendo as cordas soltas: elas são os pontos de referência para todo o resto. Repare onde cada uma fica, em linha ou em espaço, e quantas linhas suplementares usa.' },
        { kind: 'staff', notes: 'open-strings', caption: 'Cordas soltas, da mais grave para a mais aguda.' },
      ],
      exercise: { type: 'read-note', answer: 'name', pool: 'all', strings: 'all', frets: { from: 0, to: 0 } },
      rounds: 8,
    },
    {
      id: 'w9-graves',
      title: 'Notas naturais nas cordas graves',
      summary: 'Primeira posição, casas 0 a 5.',
      teach: [
        { kind: 'text', text: 'Agora as notas naturais (sem sustenido nem bemol) das duas cordas mais graves, até a casa 5. Uma nota sobe um degrau na pauta (de linha para espaço, ou o contrário) a cada nota do alfabeto.' },
        { kind: 'staff', notes: { string: 0, frets: [0, 1, 3, 5] }, caption: 'Naturais na corda mais grave (afinação padrão): E, F, G, A.' },
        { kind: 'staff', notes: { string: 1, frets: [0, 2, 3, 5] }, caption: 'Naturais na segunda corda: A, B, C, D.' },
      ],
      exercise: { type: 'read-note', answer: 'name', pool: 'naturals', strings: [0, 1], frets: firstPosition },
      rounds: 10,
    },
    {
      id: 'w9-todas',
      title: 'Notas naturais em todas as cordas',
      summary: 'A primeira posição inteira.',
      teach: [
        { kind: 'text', text: 'Com todas as cordas, a primeira posição cobre mais de duas oitavas. Use as cordas soltas como âncora: ache a corda solta mais próxima da nota e conte degraus.' },
      ],
      exercise: { type: 'read-note', answer: 'name', pool: 'naturals', strings: 'all', frets: firstPosition },
      rounds: 10,
    },
    {
      id: 'w9-no-braco',
      title: 'Da pauta para o braço',
      summary: 'Clique a nota na altura exata.',
      teach: [
        { kind: 'text', text: 'Ler é saber onde tocar. O app mostra a nota na pauta e você clica no braço, na altura certa: a mesma nota uma oitava acima ou abaixo não vale.' },
        { kind: 'tip', text: 'Algumas notas existem em duas cordas (casa 5 de uma = corda solta de cima). As duas valem: é a mesma altura.' },
      ],
      exercise: { type: 'read-note', answer: 'fretboard', pool: 'naturals', strings: 'all', frets: firstPosition },
      rounds: 10,
    },
    {
      id: 'w9-acidentes',
      title: 'Sustenidos e bemóis na pauta',
      summary: 'O # e o b antes da nota.',
      teach: [
        { kind: 'text', text: 'O sustenido (#) antes da nota sobe meio tom; o bemol (b), desce meio tom. Na pauta, a nota continua no mesmo lugar: só ganha o sinal na frente. No braço, é a casa vizinha.' },
        { kind: 'staff', notes: { string: 0, frets: [1, 2, 3, 4] }, caption: 'F, F#, G, G# na corda mais grave.' },
      ],
      exercise: { type: 'read-note', answer: 'name', pool: 'all', strings: 'all', frets: firstPosition },
      rounds: 10,
    },
    {
      id: 'w9-tocar',
      title: 'Lendo no instrumento',
      summary: 'Veja a nota, toque a nota.',
      teach: [
        { kind: 'text', text: 'O fechamento: a nota aparece na pauta e você toca no instrumento. É o primeiro passo para ler uma partitura de verdade, nota a nota, como se lê uma tablatura.' },
        { kind: 'tip', text: 'Ligue a pedaleira em Ajustes → Entrada de áudio. Se a detecção confundir a oitava no grave, tudo bem: o app aceita a nota certa em qualquer oitava aqui.' },
      ],
      exercise: { type: 'read-note', answer: 'play', pool: 'naturals', strings: 'all', frets: firstPosition },
      rounds: 8,
    },
  ],
}
