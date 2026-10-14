import type { ShapeAnchor, World } from './types'

const low = (offset: number, name: string): ShapeAnchor => ({ string: 0, offset, width: 3, name })
const majLow = low(-1, 'fundamental na corda mais grave')
const minLow = low(0, 'fundamental na corda mais grave')

export const world10: World = {
  id: 'tecnica-baixo',
  title: 'Técnica de baixo',
  tagline: 'Dedos, slap, abafamento, ghost notes e walking',
  instrument: 'bass',
  approach:
    'Técnica como nos métodos clássicos de baixo elétrico: uma mecânica por vez, devagar e com metrônomo, e só depois a velocidade. O app ouve os ataques e mede o tempo.',
  lessons: [
    {
      id: 'w10-dois-dedos',
      title: 'Dois dedos alternados',
      summary: 'Indicador e médio, sempre alternando.',
      teach: [
        { kind: 'text', text: 'O pizzicato do baixo elétrico usa indicador (i) e médio (m), alternando sempre: i-m-i-m. Mesmo quando muda de corda, a alternância continua. É ela que dá som igual e velocidade.' },
        { kind: 'text', text: 'Use o "rest stroke": depois de puxar a corda, o dedo para apoiado na corda de baixo (a mais grave seguinte). O som fica mais cheio e a corda vizinha já fica abafada.' },
        { kind: 'rhythm', pattern: 'e e e e e e e e', caption: 'Oito colcheias: i-m-i-m-i-m-i-m.' },
        { kind: 'tip', text: 'Ataque perto do captador da ponte para um som mais seco; mais perto do braço, o som fica mais redondo. O dedo puxa para dentro, não para cima.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 70, patterns: ['e e e e e e e e', 'q e e q e e', 'e e q e e q', 'q q e e e e'] },
      rounds: 5,
    },
    {
      id: 'w10-abafamento',
      title: 'Abafamento',
      summary: 'As pausas também se tocam.',
      teach: [
        { kind: 'text', text: 'No baixo, a pausa é tão importante quanto a nota. Para cortar o som: alivie a pressão da mão esquerda (sem tirar o dedo da corda) ou encoste um dedo da mão direita na corda que está soando.' },
        { kind: 'text', text: 'Cordas que não estão sendo tocadas também precisam ficar quietas. O polegar da mão direita abafa as mais graves (polegar "flutuante") e os dedos livres da mão esquerda abafam as mais agudas.' },
        { kind: 'rhythm', pattern: 'q rq q rq', caption: 'Nota e pausa: a nota não pode continuar soando na pausa.' },
        { kind: 'tip', text: 'Grave você tocando: se a pausa ainda tiver som, o abafamento não está funcionando.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 72, patterns: ['q rq q rq', 'e re e re q q', 'q re e q re e', 'e e rq e e rq'] },
      rounds: 5,
    },
    {
      id: 'w10-ghost',
      title: 'Ghost notes',
      summary: 'Notas abafadas que dão o groove.',
      teach: [
        { kind: 'text', text: 'Ghost note (nota fantasma, escrita com "x" na tab) é um ataque com a corda abafada pela mão esquerda: sai um "tuc" percussivo, sem altura definida. Ela preenche as semicolcheias entre as notas reais e é a alma do funk.' },
        { kind: 'text', text: 'Para tocar: encoste os dedos da mão esquerda na corda sem apertar contra a casa e ataque normalmente. A mão direita não muda nada; quem decide se a nota soa ou não é a esquerda.' },
        { kind: 'rhythm', pattern: 'e s s e s s q q', caption: 'A colcheia é a nota real; as semicolcheias podem ser ghost notes.' },
        { kind: 'tip', text: 'Toque as ghost notes mais fracas que as notas reais. O app conta todos os ataques, então toque todas as figuras.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 66, patterns: ['e s s e s s q q', 's s s s s s s s q q', 'q e s s q e s s', 'e s s q e s s q'] },
      rounds: 5,
    },
    {
      id: 'w10-slap',
      title: 'Slap: thumb e pop',
      summary: 'Polegar na grave, puxada na aguda.',
      teach: [
        { kind: 'text', text: 'No slap, o polegar (T, de thumb) bate na corda grave perto do fim do braço e quica, como uma baqueta. O indicador ou o médio (P, de pop) engancha uma corda aguda e solta, fazendo ela estalar contra os trastes.' },
        { kind: 'text', text: 'O padrão mais clássico é a oitava: T na fundamental (por exemplo, corda E solta) e P na mesma nota uma oitava acima (2 cordas acima, 2 casas à frente). Entre um e outro, a mão esquerda abafa.' },
        { kind: 'rhythm', pattern: 'e e e e q q', caption: 'T-P-T-P e duas semínimas de polegar.' },
        { kind: 'tip', text: 'O movimento vem do giro do antebraço, como girar uma maçaneta, e não do polegar dobrando. Comece bem devagar; o som limpo vem antes da força.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 70, patterns: ['e e e e q q', 'e e re e e e re e', 's s e s s e q q', 'e s s e s s e s s e s s'] },
      rounds: 5,
    },
    {
      id: 'w10-ligados',
      title: 'Hammer-on, pull-off e slide',
      summary: 'Notas tocadas pela mão esquerda.',
      teach: [
        { kind: 'text', text: 'Hammer-on (h): ataque uma nota e "martele" outro dedo numa casa mais alta da mesma corda; a segunda nota soa sem novo ataque. Pull-off (p): o contrário, o dedo de cima puxa a corda de lado ao sair, fazendo soar a nota de baixo, que já estava presa.' },
        { kind: 'text', text: 'Slide (/ ou \\): ataque e deslize o mesmo dedo até outra casa, mantendo a pressão. No baixo, slides curtos de 1 ou 2 casas para chegar na fundamental são um recurso clássico de groove.' },
        { kind: 'tip', text: 'Ligados soam iguais aos ataques normais só quando a mão esquerda é firme. Treine com metrônomo e compare o volume das duas notas.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'No hammer-on, como soa a segunda nota?', options: ['Com um novo ataque da mão direita', 'Pela batida do dedo da mão esquerda', 'Só com o slap', 'Ela não soa'], answer: 1, explain: 'O dedo da mão esquerda bate na casa e faz a corda soar, sem novo ataque.' },
          { prompt: 'No pull-off de 7 para 5, o que precisa estar preso antes?', options: ['Só a casa 7', 'Só a casa 5', 'As casas 7 e 5', 'Nenhuma'], answer: 2, explain: 'A casa 5 já fica presa; quando o dedo sai da 7 puxando a corda, a 5 soa.' },
          { prompt: 'O que indica "5/7" na tab?', options: ['Pull-off', 'Slide subindo da 5 para a 7', 'Duas notas juntas', 'Bend'], answer: 1, explain: 'A barra inclinada para cima é slide subindo.' },
          { prompt: 'Qual é o erro mais comum no pull-off?', options: ['Tirar o dedo reto, sem puxar a corda', 'Prender a casa de baixo', 'Tocar devagar', 'Usar o dedo 1'], answer: 0, explain: 'Se o dedo sai reto, a nota de baixo quase não soa: ele precisa puxar a corda de leve.' },
          { prompt: 'Para que serve um slide curto antes da fundamental?', options: ['Afinar o baixo', 'Dar uma chegada com balanço na nota', 'Abafar a corda', 'Trocar de corda'], answer: 1, explain: 'Chegar deslizando de uma casa abaixo dá movimento e groove à nota alvo.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w10-walking',
      title: 'Walking bass',
      summary: 'Uma nota por tempo, caminhando pelo acorde.',
      teach: [
        { kind: 'text', text: 'Walking bass é a linha de semínimas do jazz e do blues: uma nota por tempo, sem parar. A receita básica para cada compasso: tempo 1 na fundamental do acorde, tempos 2 e 3 em notas do arpejo (ou da escala) e tempo 4 numa nota de aproximação, a meio tom do próximo acorde.' },
        { kind: 'map', set: { chord: 'dom7' }, root: 7, from: 0, to: 8, anchor: majLow, caption: 'G7, o acorde do blues: 1, 3, 5 e b7 numa posição só.' },
        { kind: 'rhythm', pattern: 'q q q q', caption: 'Quatro semínimas, todas com a mesma duração e volume.' },
        { kind: 'tip', text: 'Primeiro, ache o arpejo de cada acorde sem pensar. No exercício: marque todas as notas do arpejo de 7ª pedido dentro da posição.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'dom7' }, anchor: majLow },
          { set: { chord: 'min7' }, anchor: minLow },
        ],
        roots: 'all',
        frets: { from: 2, to: 10 },
      },
      rounds: 6,
    },
    {
      id: 'w10-palheta',
      title: 'Palheta no baixo',
      summary: 'Ataque preciso para rock e punk.',
      teach: [
        { kind: 'text', text: 'Com palheta, o baixo ganha ataque e definição: é o som de muito rock, punk e metal. Use palhetada alternada (para baixo e para cima) nas colcheias e semicolcheias, e só para baixo quando quiser um som mais agressivo e regular.' },
        { kind: 'text', text: 'A lateral da mão direita pode encostar nas cordas perto da ponte para um som mais seco e controlado (palm mute).' },
        { kind: 'rhythm', pattern: 's s s s s s s s q q', caption: 'Dois tempos de semicolcheias com palhetada alternada.' },
        { kind: 'tip', text: 'Movimento pequeno, vindo do pulso. A palheta passa pouco da corda.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 90, patterns: ['e e e e e e e e', 's s s s s s s s q q', 'q s s s s q s s s s', 'e e s s s s e e s s s s'] },
      rounds: 5,
    },
    {
      id: 'w10-tapping',
      title: 'Tapping e revisão',
      summary: 'As duas mãos no braço.',
      teach: [
        { kind: 'text', text: 'No tapping, a mão direita também toca no braço: o dedo bate na casa como num hammer-on e sai com um pull-off. Com as duas mãos fazendo ligados, dá para tocar linhas e acordes que seriam impossíveis com uma só.' },
        { kind: 'text', text: 'O segredo é o silêncio: com tanta corda solta vibrando, abafe tudo o que não está tocando (um elástico ou faixa perto da pestana ajuda a começar).' },
        { kind: 'tip', text: 'Feche o mundo revisando: qual técnica você usaria em cada situação?' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'No tapping, a nota da mão direita soa como…', options: ['Um hammer-on', 'Um slap', 'Um harmônico', 'Uma ghost note'], answer: 0, explain: 'O dedo bate na casa e faz a corda soar, exatamente como um hammer-on.' },
          { prompt: 'Qual técnica dá o "tuc" percussivo entre as notas de um funk?', options: ['Slide', 'Ghost note', 'Rest stroke', 'Bend'], answer: 1, explain: 'A ghost note é um ataque com a corda abafada, sem altura definida.' },
          { prompt: 'No dedilhado com dois dedos, ao trocar de corda você…', options: ['Repete o mesmo dedo', 'Mantém a alternância', 'Usa o polegar', 'Para a mão'], answer: 1, explain: 'A alternância i-m nunca para; é ela que mantém o tempo regular.' },
          { prompt: 'No slap, o que faz o polegar quicar na corda?', options: ['O giro do antebraço', 'Dobrar o polegar', 'Apertar com força', 'A palheta'], answer: 0, explain: 'O movimento vem do giro do antebraço; o polegar quase não se mexe sozinho.' },
          { prompt: 'Num walking bass, onde fica a nota de aproximação?', options: ['No tempo 1', 'No tempo 4, a meio tom do próximo acorde', 'Em qualquer lugar', 'Só no fim da música'], answer: 1, explain: 'Ela prepara a fundamental do compasso seguinte, chegando por meio tom.' },
          { prompt: 'Para que serve o rest stroke?', options: ['Som mais cheio e abafar a corda vizinha', 'Tocar mais agudo', 'Fazer harmônicos', 'Afinar'], answer: 0, explain: 'O dedo para apoiado na corda de baixo: som mais cheio e uma corda a menos vibrando à toa.' },
        ],
      },
      rounds: 6,
    },
  ],
}
