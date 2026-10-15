import type { World } from './types'

export const world13: World = {
  id: 'harmonia',
  title: 'Harmonia',
  tagline: 'Cadências, ii–V–I, dominantes secundários e empréstimos',
  approach:
    'Harmonia funcional como na escola de música popular brasileira e no jazz: cada acorde tem uma função (repouso, afastamento, tensão), e o ouvido aprende a reconhecer o caminho entre eles. Continuação do mundo Campo harmônico.',
  lessons: [
    {
      id: 'w13-tetrades',
      title: 'Campo harmônico com tétrades',
      summary: 'Os sete acordes com sétima.',
      teach: [
        { kind: 'text', text: 'Empilhando mais uma terça em cada acorde do campo, aparecem as tétrades. Em tom maior: I7M, ii7 (m7), iii7 (m7), IV7M, V7, vi7 (m7) e viiø (m7(b5)). Repare que só existe um acorde dominante (V7): é ele que cria a tensão que leva de volta ao I.' },
        { kind: 'field', root: 0, mode: 'major', sevenths: true, caption: 'Dó maior com tétrades.' },
        { kind: 'tip', text: 'Decore pela sequência de tipos: 7M, m7, m7, 7M, 7, m7, m7(b5). Vale para qualquer tom maior.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Em Dó maior, qual é a tétrade do V grau?', options: ['G7M', 'G7', 'Gm7', 'Gø'], answer: 1, explain: 'Sol–Si–Ré–Fá: tríade maior com 7ª menor, o dominante G7.' },
          { prompt: 'Em Dó maior, qual é a tétrade do IV grau?', options: ['F7', 'Fm7', 'F7M', 'F6'], answer: 2, explain: 'Fá–Lá–Dó–Mi: maior com 7ª maior.' },
          { prompt: 'Em Sol maior, qual é o ii7?', options: ['Am7', 'A7', 'Bm7', 'Em7'], answer: 0, explain: 'O 2º grau de Sol é Lá; o ii é sempre m7.' },
          { prompt: 'Qual grau do tom maior é meio-diminuto (m7(b5))?', options: ['ii', 'iii', 'vi', 'vii'], answer: 3, explain: 'O vii: em Dó, Si–Ré–Fá–Lá = Bm7(b5).' },
          { prompt: 'Quantos acordes dominantes (7) há no campo maior?', options: ['Nenhum', 'Um, o V7', 'Dois', 'Três'], answer: 1, explain: 'Só o V7. Os outros "7" que aparecem nas músicas vêm de fora do campo (dominantes secundários).' },
          { prompt: 'Em Ré maior, qual é o I com tétrade?', options: ['D7', 'Dm7', 'D7M', 'D6'], answer: 2, explain: 'O I é sempre 7M: D7M.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w13-cadencias',
      title: 'Cadências',
      summary: 'Como uma frase harmônica termina.',
      teach: [
        { kind: 'text', text: 'Cadência é o final de uma frase. Autêntica: V → I, a conclusão mais forte. Plagal: IV → I, o "amém", mais suave. Meia cadência: a frase para no V, como uma vírgula, pedindo continuação. Deceptiva (ou de engano): V → vi, o ouvido espera o I e recebe o relativo menor.' },
        { kind: 'tip', text: 'No exercício, o app toca o I e depois outro acorde: ouça se ele descansa, afasta ou pede para voltar.' },
      ],
      exercise: { type: 'hear-degree', mode: 'major', degrees: [1, 4, 5, 6] },
      rounds: 8,
    },
    {
      id: 'w13-cadencias-teoria',
      title: 'Nomes das cadências',
      summary: 'Autêntica, plagal, meia e deceptiva.',
      teach: [
        { kind: 'text', text: 'Agora pelo nome. Lembre da função do último acorde: se termina no I, é conclusiva (autêntica ou plagal); se termina no V, é suspensiva (meia); se o V vai para outro lugar, é de engano.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'G7 → C, em Dó maior, é uma cadência…', options: ['Plagal', 'Autêntica', 'Meia', 'Deceptiva'], answer: 1, explain: 'V → I: autêntica.' },
          { prompt: 'F → C, em Dó maior, é uma cadência…', options: ['Plagal', 'Autêntica', 'Meia', 'Deceptiva'], answer: 0, explain: 'IV → I: plagal, o "amém".' },
          { prompt: 'G7 → Am, em Dó maior, é uma cadência…', options: ['Plagal', 'Autêntica', 'Meia', 'Deceptiva'], answer: 3, explain: 'V → vi: o ouvido esperava o I.' },
          { prompt: 'Uma frase que termina em D, em Sol maior, faz uma…', options: ['Cadência autêntica', 'Meia cadência', 'Plagal', 'Deceptiva'], answer: 1, explain: 'Terminar no V (Ré, em Sol) deixa a frase em suspenso.' },
          { prompt: 'Qual cadência soa mais conclusiva?', options: ['V → I', 'I → V', 'V → vi', 'I → IV'], answer: 0, explain: 'A dominante resolvendo na tônica é a resolução mais forte.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w13-ii-v-i',
      title: 'ii–V–I',
      summary: 'A progressão mais importante do jazz e da bossa.',
      teach: [
        { kind: 'text', text: 'O ii–V–I junta preparação (ii, subdominante), tensão (V7, dominante) e resolução (I). Em Dó: Dm7 → G7 → C7M. As fundamentais andam por quartas (Ré → Sol → Dó), o caminho mais "natural" para o ouvido.' },
        { kind: 'text', text: 'Em tom menor fica iiø → V7 → i: Bm7(b5) → E7 → Am. O V vira maior (com a sensível) emprestado da menor harmônica, para ter força de resolução.' },
        { kind: 'tip', text: 'Treine o ii–V–I em vários tons: quando aparecer um m7 seguido de um 7 uma quarta acima, você já sabe para onde a música vai.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Qual é o ii–V–I de Fá maior?', options: ['Gm7 – C7 – F7M', 'Am7 – D7 – G7M', 'Dm7 – G7 – C7M', 'Gm7 – C7M – F7'], answer: 0, explain: 'ii de Fá = Gm7, V = C7, I = F7M.' },
          { prompt: 'Qual é o ii–V–I de Sol maior?', options: ['Dm7 – G7 – C7M', 'Am7 – D7 – G7M', 'Em7 – A7 – D7M', 'Bm7 – E7 – A7M'], answer: 1, explain: 'ii de Sol = Am7, V = D7, I = G7M.' },
          { prompt: 'Dm7 – G7 leva a qual acorde?', options: ['C', 'F', 'A', 'E'], answer: 0, explain: 'É o ii–V de Dó.' },
          { prompt: 'Em Lá menor, qual é o ii–V–i?', options: ['Bm7(b5) – E7 – Am', 'Dm7 – G7 – C', 'Bm7 – Em7 – Am', 'Em7 – Am – Dm'], answer: 0, explain: 'iiø = Bm7(b5), V7 = E7 (com Sol#), i = Am.' },
          { prompt: 'Por que o V do tom menor costuma ser maior (E7 em Lá menor)?', options: ['Por acaso', 'Para ter a sensível, meio tom abaixo da tônica', 'Para soar mais triste', 'Porque é mais fácil de tocar'], answer: 1, explain: 'O Sol# (sensível) puxa para o Lá e dá força à resolução.' },
          { prompt: 'Em que intervalo andam as fundamentais do ii–V–I?', options: ['Em segundas', 'Em quartas justas, subindo', 'Em terças', 'Em oitavas'], answer: 1, explain: 'Ré → Sol → Dó: cada uma uma quarta acima da anterior.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w13-dominantes-secundarios',
      title: 'Dominantes secundários',
      summary: 'O V7 de outros acordes do campo.',
      teach: [
        { kind: 'text', text: 'Qualquer acorde do campo (menos o vii) pode ganhar o "seu" dominante: o acorde 7 uma quinta acima dele. Em Dó maior, A7 é o V7 do Dm (escreve-se V7/ii); E7 é o V7 do Am (V7/vi); D7 é o V7 do G (V7/V). Eles trazem notas de fora do tom e dão impulso para o acorde-alvo.' },
        { kind: 'tip', text: 'Viu um acorde 7 que não é o V do tom? Procure o acorde uma quarta acima dele (ou uma quinta abaixo): é para lá que ele quer ir.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Em Dó maior, qual é o V7/vi (dominante do Am)?', options: ['E7', 'A7', 'D7', 'B7'], answer: 0, explain: 'A quinta acima de Lá é Mi: E7.' },
          { prompt: 'Em Dó maior, qual é o V7/V (dominante do G)?', options: ['C7', 'D7', 'A7', 'F7'], answer: 1, explain: 'A quinta acima de Sol é Ré: D7.' },
          { prompt: 'Em Dó maior, para onde A7 quer ir?', options: ['C', 'Dm', 'Em', 'G'], answer: 1, explain: 'A7 é o dominante de Ré: resolve em Dm (ii).' },
          { prompt: 'Em Sol maior, qual é o V7/ii?', options: ['E7', 'A7', 'B7', 'D7'], answer: 0, explain: 'O ii de Sol é Am; o dominante de Lá é E7.' },
          { prompt: 'Qual nota de fora do tom o E7 traz em Dó maior?', options: ['Fá#', 'Sol#', 'Si', 'Dó#'], answer: 1, explain: 'E7 = Mi–Sol#–Si–Ré. O Sol# é a sensível do Lá.' },
          { prompt: 'C7 em Dó maior é o dominante de qual acorde?', options: ['F (IV)', 'G (V)', 'Am (vi)', 'Dm (ii)'], answer: 0, explain: 'C7 leva a Fá: V7/IV. O Sib dá a cor de blues.' },
        ],
      },
      rounds: 6,
    },
    {
      id: 'w13-substituicoes',
      title: 'Funções e substituições',
      summary: 'Acordes que fazem o mesmo papel.',
      teach: [
        { kind: 'text', text: 'Acordes que dividem notas costumam dividir a função. Tônica: I, iii e vi (C, Em e Am têm Mi e Sol ou Dó em comum). Subdominante: IV e ii (F e Dm). Dominante: V e vii° (G7 e B°). Trocar um pelo outro muda a cor sem mudar o caminho.' },
        { kind: 'text', text: 'Uma substituição famosa do jazz é o trítono: G7 pode virar Db7, porque os dois têm o mesmo trítono (Si–Fá / Dó♭–Fá). O baixo desce em semitons: Dm7 → Db7 → C7M.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['function'], keys: [0, 7, 2, 5, 9, 4], mode: 'major' },
      rounds: 8,
    },
    {
      id: 'w13-emprestimo',
      title: 'Empréstimo modal',
      summary: 'Acordes do tom menor no tom maior.',
      teach: [
        { kind: 'text', text: 'O tom maior pode "pegar emprestado" acordes do tom menor com a mesma tônica. Em Dó maior, os mais comuns são Fm (iv), Bb (bVII), Ab (bVI) e Eb (bIII). O iv menor dá aquele aperto nostálgico (F → Fm → C); o bVII → I é o som do rock.' },
        { kind: 'tip', text: 'Viu um acorde com bemol num tom de sustenidos (ou um acorde menor no IV)? Pense em empréstimo da menor homônima.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Em Dó maior, qual acorde é o iv emprestado?', options: ['F', 'Fm', 'F7', 'Dm'], answer: 1, explain: 'O iv de Dó menor é Fm (com Láb).' },
          { prompt: 'Em Sol maior, qual é o bVII?', options: ['F', 'F#°', 'E', 'C'], answer: 0, explain: 'A 7ª abaixada de Sol é Fá: o acorde F.' },
          { prompt: 'De onde vêm os acordes de empréstimo modal?', options: ['Do tom relativo', 'Do tom menor com a mesma tônica', 'De qualquer tom', 'Do campo do V'], answer: 1, explain: 'Dó maior empresta de Dó menor (homônimo), não de Lá menor (relativo).' },
          { prompt: 'Em Ré maior, qual é o bVI?', options: ['Bb', 'B', 'Bm', 'G'], answer: 0, explain: 'A 6ª abaixada de Ré é Sib: o acorde Bb.' },
          { prompt: 'F → Fm → C, em Dó, é um exemplo de…', options: ['Cadência autêntica', 'iv menor emprestado indo para o I', 'Dominante secundário', 'Modulação para Fá'], answer: 1, explain: 'O Fm vem de Dó menor e resolve no I com uma cor nostálgica.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w13-notas-guia',
      title: 'Notas-guia: 3ª e 7ª',
      summary: 'As notas que contam a harmonia.',
      teach: [
        { kind: 'text', text: 'Num acorde com sétima, a 3ª diz se ele é maior ou menor, e a 7ª diz se é 7M, 7 ou m7. Por isso 3ª e 7ª são as notas-guia: tocando só elas (sem fundamental e quinta), a harmonia já aparece. No ii–V–I, as guias andam por meio tom: a 7ª de um acorde desce para a 3ª do próximo.' },
        { kind: 'formula', set: { chord: 'dom7' }, root: 7, caption: 'G7: a 3ª (Si) e a 7ª (Fá) formam o trítono que resolve em Dó–Mi.' },
        { kind: 'tip', text: 'No baixo, as guias servem para walking bass e para escolher notas de passagem; na guitarra, são os acordes de duas notas do jazz e da bossa.' },
      ],
      exercise: { type: 'theory-quiz', asks: ['spell-chord'], keys: [0, 2, 5, 7, 9], mode: 'major', qualities: ['maj7', 'dom7', 'min7'] },
      rounds: 8,
    },
    {
      id: 'w13-ouvido',
      title: 'Harmonia de ouvido',
      summary: 'Reconhecer os tipos de tétrade.',
      teach: [
        { kind: 'text', text: 'Feche ouvindo as tétrades. 7M: sonhador, aberto. 7 (dominante): tenso, blueseiro, pede resolução. m7: macio, escuro. Junte isso com o treino de intervalos do Treino do Dia (3ª e 7ª): é exatamente o que diferencia esses acordes.' },
      ],
      exercise: { type: 'hear-chord', qualities: ['maj7', 'dom7', 'min7', 'm7b5'] },
      rounds: 8,
    },
  ],
}
