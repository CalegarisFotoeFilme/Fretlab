import type { World } from './types'

export const world2: World = {
  id: 'ritmo',
  title: 'Ritmo I',
  tagline: 'Tocar no tempo, ler as figuras',
  lessons: [
    {
      id: 'w2-pulso',
      title: 'O pulso',
      summary: 'A batida constante que todo mundo na banda sente.',
      teach: [
        { kind: 'text', text: 'O pulso é a batida que você acompanha com o pé. O BPM diz quantas batidas cabem em um minuto: 60 BPM é uma por segundo.' },
        { kind: 'text', text: 'A maioria das músicas conta em grupos de 4 (compasso 4/4). O primeiro tempo de cada grupo é o mais forte, e o metrônomo marca ele com um clique mais agudo.' },
        { kind: 'rhythm', pattern: 'q q q q', caption: 'Quatro semínimas: uma nota em cada tempo.' },
        { kind: 'tip', text: 'Toque na tela (ou aperte espaço) junto com cada nota. O primeiro compasso é só contagem: escute antes de tocar.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 70, patterns: ['q q q q', 'q q q q', 'q q q q', 'q q q q'] },
      rounds: 4,
    },
    {
      id: 'w2-figuras',
      title: 'Quanto vale cada figura',
      summary: 'Semibreve, mínima, semínima e colcheia.',
      teach: [
        { kind: 'text', text: 'Cada figura diz por quanto tempo a nota dura. Em 4/4, a semínima vale 1 tempo, e as outras são dobros e metades dela.' },
        { kind: 'figures' },
        { kind: 'tip', text: 'Na tablatura do Songsterr, essas mesmas figuras aparecem como hastes embaixo dos números. Repare na próxima música que abrir.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Quantos tempos vale uma mínima em 4/4?', options: ['1', '2', '4', '½'], answer: 1, explain: 'Mínima = 2 semínimas = 2 tempos.' },
          { prompt: 'Quantas colcheias cabem em uma semínima?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Colcheia é metade da semínima.' },
          { prompt: 'Qual figura ocupa um compasso inteiro de 4/4?', options: ['Semibreve', 'Mínima', 'Semínima', 'Colcheia'], answer: 0, explain: 'Semibreve = 4 tempos.' },
          { prompt: 'Quantas semicolcheias cabem em 1 tempo?', options: ['2', '3', '4', '8'], answer: 2, explain: 'Semicolcheia é metade da colcheia: 4 por tempo.' },
          { prompt: 'Uma semínima + duas colcheias somam…', options: ['1 tempo', '2 tempos', '3 tempos', '1 tempo e meio'], answer: 1, explain: '1 + ½ + ½ = 2 tempos.' },
          { prompt: 'Uma pausa de semínima dura…', options: ['Nada, é só um sinal', '1 tempo em silêncio', '2 tempos', 'Meio tempo'], answer: 1, explain: 'Cada figura tem uma pausa com a mesma duração.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w2-minimas',
      title: 'Notas longas',
      summary: 'Mínimas e semibreves: tocar e segurar.',
      teach: [
        { kind: 'text', text: 'Nas notas longas, você toca uma vez e continua contando enquanto ela soa. O difícil é não apressar a próxima.' },
        { kind: 'rhythm', pattern: 'h h', caption: 'Duas mínimas: toque no 1 e no 3.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 70, patterns: ['h h', 'q q h', 'h q q', 'w', 'q h q'] },
      rounds: 5,
    },
    {
      id: 'w2-colcheias',
      title: 'Colcheias',
      summary: 'Duas notas por tempo: "1 e 2 e 3 e 4 e".',
      teach: [
        { kind: 'text', text: 'Colcheias dividem cada tempo em dois. Conte "um-e, dois-e": a nota do "e" cai bem no meio entre dois cliques.' },
        { kind: 'rhythm', pattern: 'e e e e q q', caption: 'Colcheias nos tempos 1 e 2, semínimas no 3 e no 4.' },
        { kind: 'tip', text: 'Muita linha de baixo de rock é só colcheia constante. Domine isso e metade do repertório fica mais fácil.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 70, patterns: ['e e e e q q', 'q e e q e e', 'e e q e e q', 'q q e e e e', 'e e e e e e e e'] },
      rounds: 5,
    },
    {
      id: 'w2-pausas',
      title: 'Pausas',
      summary: 'O silêncio também é tocado.',
      teach: [
        { kind: 'text', text: 'Pausa é tempo contado em silêncio. No baixo, abafar a corda na hora certa é tão importante quanto tocar.' },
        { kind: 'rhythm', pattern: 'q rq q rq', caption: 'Toca, pausa, toca, pausa.' },
      ],
      exercise: { type: 'rhythm', input: 'tap', bpm: 70, patterns: ['q rq q rq', 'rq q rq q', 'q q rh', 'e e rq e e rq', 'rq e e q rq'] },
      rounds: 5,
    },
    {
      id: 'w2-misturando',
      title: 'Misturando tudo',
      summary: 'Figuras e pausas juntas, um pouco mais rápido.',
      teach: [{ kind: 'text', text: 'Agora a 80 BPM. Leia o compasso inteiro durante a contagem, antes de começar.' }],
      exercise: { type: 'rhythm', input: 'tap', bpm: 80, patterns: ['q e e h', 'e e rq q q', 'h e e q', 'q re e q rq', 'e e e e h', 'rq q e e q'] },
      rounds: 6,
    },
    {
      id: 'w2-no-instrumento',
      title: 'Ritmo no instrumento',
      summary: 'Mesmos ritmos, tocando uma corda solta.',
      teach: [
        { kind: 'text', text: 'Agora troque o toque na tela pelo instrumento: toque a corda solta mais grave no ritmo. O FretLab detecta cada ataque.' },
        { kind: 'tip', text: 'Abafe a corda nas pausas: se ela continuar soando, o ataque seguinte fica mais difícil de detectar. Se os acertos aparecerem sempre atrasados, ajuste a compensação de atraso em Ajustes.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 75, patterns: ['q q q q', 'e e e e q q', 'q rq q rq', 'h e e q', 'e e rq e e rq'] },
      rounds: 5,
    },
  ],
}
