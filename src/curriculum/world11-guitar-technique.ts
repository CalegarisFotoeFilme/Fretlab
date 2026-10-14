import type { ShapeAnchor, World } from './types'

const low = (offset: number, name: string): ShapeAnchor => ({ string: 0, offset, width: 3, name })
const majLow = low(-1, 'fundamental na corda mais grave')
const minLow = low(0, 'fundamental na corda mais grave')
const E: ShapeAnchor = { string: 0, offset: 0, width: 3, name: 'pestana na forma de E' }
const A: ShapeAnchor = { string: 1, offset: 0, width: 3, name: 'pestana na forma de A' }

export const world11: World = {
  id: 'tecnica-guitarra',
  title: 'Técnica de guitarra',
  tagline: 'Palhetada, palm mute, legato, bends, sweep e pestana',
  instrument: 'guitar',
  approach:
    'Técnica no espírito de Guitar Aerobics e dos métodos de palhetada: mecânica limpa primeiro, sempre com metrônomo, e velocidade só quando o movimento sai sem esforço.',
  lessons: [
    {
      id: 'w11-alternada',
      title: 'Palhetada alternada',
      summary: 'Baixo, cima, baixo, cima.',
      teach: [
        { kind: 'text', text: 'Na palhetada alternada, cada nota troca a direção da palheta: para baixo (⊓) e para cima (V). Nas semicolcheias, a regra é simples: no tempo e no "e" a palheta desce; no "e" e no "a" (as semicolcheias de dentro), sobe.' },
        { kind: 'text', text: 'Segure a palheta entre o polegar e a lateral do indicador, com pouca ponta para fora. O movimento é pequeno e vem do pulso, como sacudir uma gota de água.' },
        { kind: 'rhythm', pattern: 's s s s s s s s q q', caption: 'Semicolcheias: ⊓ V ⊓ V ⊓ V ⊓ V.' },
        { kind: 'tip', text: 'Quando houver pausa, a mão continua subindo e descendo no ar: assim a direção da próxima nota nunca se perde.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 60, patterns: ['s s s s s s s s q q', 'e e s s s s e e s s s s', 'q s s s s q s s s s', 's s s s q s s s s q'] },
      rounds: 5,
    },
    {
      id: 'w11-palm-mute',
      title: 'Palm mute',
      summary: 'O "chug" do rock e do metal.',
      teach: [
        { kind: 'text', text: 'No palm mute (P.M.), a lateral da mão direita encosta de leve nas cordas, logo em cima da ponte. A nota sai curta e grave, com aquele "chug". Muito para frente, a nota some; muito para trás, não abafa nada.' },
        { kind: 'text', text: 'O contraste entre notas abafadas e abertas é o que dá peso a um riff: as abertas aparecem como acentos.' },
        { kind: 'rhythm', pattern: 'e e e e e e q', caption: 'Colcheias abafadas e uma semínima aberta no fim.' },
        { kind: 'tip', text: 'Use palhetadas para baixo nas colcheias abafadas: o som fica mais firme e igual.' },
      ],
      exercise: { type: 'rhythm', input: 'play', bpm: 80, patterns: ['e e e e e e q', 'e e q e e q', 's s e s s e e e q', 'e e re e e e re e'] },
      rounds: 5,
    },
    {
      id: 'w11-economica',
      title: 'Econômica e string skipping',
      summary: 'Trocar de corda sem perder o caminho.',
      teach: [
        { kind: 'text', text: 'Palhetada econômica: ao trocar de corda na mesma direção do movimento, a palheta segue reto para a próxima corda em vez de voltar. Se você desce da corda 5 para a 4, a última nota da 5 e a primeira da 4 saem as duas para baixo, num só movimento.' },
        { kind: 'text', text: 'String skipping é pular uma corda (ou mais) entre notas. Exige pontaria da palheta e abafamento: a corda pulada não pode soar.' },
        { kind: 'tip', text: 'Na alternada estrita, a mão nunca muda o padrão; na econômica, ela "escorrega". As duas servem; o que importa é saber qual você está usando.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Na palhetada econômica, descendo para a corda de baixo (mais aguda) depois de uma palhetada para baixo, a próxima é…', options: ['Para cima', 'Para baixo, continuando o movimento', 'Com o dedo', 'Tanto faz'], answer: 1, explain: 'A palheta segue na mesma direção até a próxima corda: menos movimento.' },
          { prompt: 'Em semicolcheias com alternada, o "e" (a 3ª semicolcheia do tempo) sai…', options: ['Para baixo', 'Para cima', 'Abafado', 'Com hammer-on'], answer: 0, explain: '1 (⊓) e (V) e (⊓) a (V): a 3ª é para baixo.' },
          { prompt: 'No string skipping, o maior cuidado é…', options: ['A corda pulada não soar', 'Usar só palhetada para cima', 'Tocar mais forte', 'Afinar no meio'], answer: 0, explain: 'A corda do meio precisa estar abafada, pela mão esquerda ou pela direita.' },
          { prompt: 'Por que manter a mão em movimento nas pausas?', options: ['Para fazer barulho', 'Para não perder a direção da palhetada', 'Para descansar', 'Não precisa'], answer: 1, explain: 'A mão funciona como um metrônomo: as notas caem sempre na direção certa.' },
          { prompt: 'Qual movimento é o mais eficiente para a palhetada?', options: ['Braço inteiro, desde o ombro', 'Pequeno, vindo do pulso', 'Só os dedos', 'Grande e lento'], answer: 1, explain: 'Movimento pequeno e do pulso: rápido, preciso e sem cansar.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w11-legato',
      title: 'Legato',
      summary: 'Hammer-ons e pull-offs fluindo.',
      teach: [
        { kind: 'text', text: 'Legato é tocar várias notas com um ataque só da palheta, fazendo o resto com a mão esquerda: hammer-on (h) para subir, pull-off (p) para descer. O som fica fluido, como uma voz cantando.' },
        { kind: 'text', text: 'Hammer-on: bata o dedo com firmeza, logo atrás do traste. Pull-off: ao sair, puxe a corda de leve para o lado (para baixo, na direção do chão). As notas ligadas precisam soar tão alto quanto a palhetada.' },
        { kind: 'rhythm', pattern: 'te te te q te te te q', caption: 'Tercinas: palheta só na primeira de cada grupo, as outras duas ligadas.' },
        { kind: 'tip', text: 'Abafe as cordas vizinhas: no legato, qualquer corda solta encostada soa junto.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Num grupo "5h7p5", quantas palhetadas?', options: ['Uma', 'Duas', 'Três', 'Nenhuma'], answer: 0, explain: 'Só a primeira nota é palhetada; a 7 é hammer-on e a 5 volta por pull-off.' },
          { prompt: 'Onde bater o dedo no hammer-on?', options: ['No meio da casa', 'Logo atrás do traste', 'Em cima do traste', 'Tanto faz'], answer: 1, explain: 'Perto do traste a nota soa limpa e com menos força.' },
          { prompt: 'Para onde puxar a corda no pull-off?', options: ['Para cima, soltando reto', 'De leve para o lado (para baixo)', 'Para longe do braço', 'Não puxa'], answer: 1, explain: 'O dedo "belisca" a corda ao sair, como uma palhetada da mão esquerda.' },
          { prompt: 'Qual o maior inimigo do legato limpo?', options: ['Cordas vizinhas soando', 'Palheta grossa', 'Metrônomo', 'Afinação'], answer: 0, explain: 'Sem abafamento, as cordas soltas vibram junto e sujam as frases.' },
          { prompt: 'As notas ligadas devem soar…', options: ['Bem mais baixas', 'Com volume parecido com as palhetadas', 'Abafadas', 'Só no fim da frase'], answer: 1, explain: 'Esse é o objetivo do treino: legato sem buracos de volume.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w11-bends',
      title: 'Bends e vibrato',
      summary: 'Afinação pelo ouvido, com a corda.',
      teach: [
        { kind: 'text', text: 'Bend é empurrar (ou puxar) a corda para o lado até a nota subir. Um bend de 1 tom (full) precisa chegar exatamente na nota de 2 casas acima; de ½ tom, na nota de 1 casa acima. Teste: toque a nota-alvo presa, depois faça o bend e compare.' },
        { kind: 'text', text: 'Use mais de um dedo: o dedo 3 empurra e os dedos 1 e 2 ficam atrás na mesma corda ajudando. A força vem do giro do pulso, não dos dedos.' },
        { kind: 'text', text: 'Vibrato é um bend pequeno repetido: sobe e volta para a nota, num ritmo regular. Vibrato largo e lento, ou estreito e rápido, é a assinatura de cada guitarrista.' },
        { kind: 'tip', text: 'Use o afinador do app como juiz: faça o bend e veja se ele marca a nota-alvo no centro.' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'Bend de 1 tom na casa 7 da corda G. Que nota precisa soar?', options: ['A da casa 8', 'A da casa 9', 'A da casa 10', 'A da casa 7'], answer: 1, explain: '1 tom = 2 casas: o bend precisa soar como a casa 9.' },
          { prompt: 'Bend de ½ tom na casa 10. Soa como a casa…', options: ['10', '11', '12', '9'], answer: 1, explain: '½ tom = 1 casa.' },
          { prompt: 'Como conferir a afinação de um bend?', options: ['Pelo tamanho do movimento', 'Tocando a nota-alvo presa e comparando', 'Não precisa', 'Pelo metrônomo'], answer: 1, explain: 'Toque a nota-alvo, memorize, e faça o bend até chegar nela.' },
          { prompt: 'De onde vem a força do bend?', options: ['Só do dedo 3', 'Do giro do pulso, com dedos ajudando', 'Do braço inteiro', 'Do polegar da mão direita'], answer: 1, explain: 'O pulso gira e os dedos juntos empurram a corda.' },
          { prompt: 'O vibrato é…', options: ['Um bend pequeno repetido em ritmo', 'Um slide rápido', 'Um harmônico', 'Uma ghost note'], answer: 0, explain: 'Sobe e volta à nota, várias vezes, de forma regular.' },
        ],
      },
      rounds: 5,
    },
    {
      id: 'w11-sweep',
      title: 'Sweep picking',
      summary: 'Arpejos numa varrida só.',
      teach: [
        { kind: 'text', text: 'Sweep é palhetada econômica levada ao extremo: um arpejo com uma nota por corda tocado com um único movimento da palheta, varrendo as cordas. Subindo para as agudas, tudo para baixo; voltando, tudo para cima.' },
        { kind: 'text', text: 'O truque está na mão esquerda: cada dedo prende a nota só enquanto ela toca e solta logo depois (o "rolar" do dedo quando duas notas estão na mesma casa). Senão, o arpejo vira um acorde.' },
        { kind: 'map', set: { chord: 'min' }, root: 9, from: 3, to: 10, anchor: minLow, caption: 'Am na casa 5: as notas do arpejo para varrer.' },
        { kind: 'tip', text: 'Comece com 3 cordas, bem devagar, conferindo que cada nota soa separada. No exercício: marque todas as notas do arpejo dentro da posição.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'maj' }, anchor: majLow },
          { set: { chord: 'min' }, anchor: minLow },
        ],
        roots: 'all',
        frets: { from: 2, to: 10 },
      },
      rounds: 6,
    },
    {
      id: 'w11-pestana',
      title: 'Acordes com pestana',
      summary: 'As formas de E e de A, móveis pelo braço.',
      teach: [
        { kind: 'text', text: 'Na pestana, o dedo 1 deita sobre todas as cordas numa casa, fazendo o papel da pestana do instrumento. Os outros dedos montam a forma de E (fundamental na 6ª corda) ou de A (fundamental na 5ª). Mudar de casa muda o acorde.' },
        { kind: 'text', text: 'Não é só força: use a lateral do dedo 1 (mais dura), deixe ele bem perto do traste e puxe o braço da guitarra de leve com o peso do braço, em vez de apertar com o polegar.' },
        { kind: 'map', set: { chord: 'maj' }, root: 7, from: 1, to: 7, anchor: E, caption: 'G com pestana na casa 3, forma de E.' },
        { kind: 'tip', text: 'Toque corda por corda para achar a que não soa e ajuste só aquele dedo. No exercício: marque as notas do acorde na forma pedida.' },
      ],
      exercise: {
        type: 'note-set',
        input: 'tap',
        shapes: [
          { set: { chord: 'maj' }, anchor: E },
          { set: { chord: 'maj' }, anchor: A },
          { set: { chord: 'min' }, anchor: E },
          { set: { chord: 'min' }, anchor: A },
        ],
        roots: 'all',
        frets: { from: 3, to: 12 },
      },
      rounds: 6,
    },
    {
      id: 'w11-tapping',
      title: 'Tapping e velocidade',
      summary: 'A mão direita no braço e o método da velocidade.',
      teach: [
        { kind: 'text', text: 'No tapping, um dedo da mão direita (em geral o médio, para a palheta continuar na mão) bate numa casa alta e sai com um pull-off para uma nota da mão esquerda. Com isso surgem saltos grandes, impossíveis só com uma mão.' },
        { kind: 'text', text: 'Velocidade se constrói assim: ache o andamento em que sai limpo, toque várias vezes perfeito e suba 4 a 5 bpm. Se sujar, volte. O metrônomo do Treino do Dia ajuda a registrar o progresso.' },
        { kind: 'tip', text: 'Feche o mundo revisando: qual técnica você usaria em cada situação?' },
      ],
      exercise: {
        type: 'quiz',
        questions: [
          { prompt: 'No tapping, a nota batida pela mão direita soa como…', options: ['Um hammer-on', 'Um bend', 'Um palm mute', 'Uma palhetada para cima'], answer: 0, explain: 'O dedo bate na casa e faz a corda soar, como um hammer-on.' },
          { prompt: 'Por que muitos guitarristas usam o dedo médio no tapping?', options: ['É mais forte', 'A palheta continua entre polegar e indicador', 'Soa mais agudo', 'Por tradição só'], answer: 1, explain: 'Assim dá para alternar tapping e palhetada sem largar a palheta.' },
          { prompt: 'Para ganhar velocidade, o melhor caminho é…', options: ['Tocar no máximo sempre', 'Subir aos poucos a partir do andamento limpo', 'Treinar sem metrônomo', 'Tocar só legato'], answer: 1, explain: 'A mão aprende o movimento limpo; a velocidade vem por pequenos aumentos.' },
          { prompt: 'Qual técnica dá o "chug" de um riff de metal?', options: ['Vibrato', 'Palm mute', 'Sweep', 'Slide'], answer: 1, explain: 'A mão encostada na ponte deixa a nota curta e grave.' },
          { prompt: 'Num arpejo varrido (sweep), cada nota deve…', options: ['Soar junto com as outras', 'Soar separada, como notas de uma melodia', 'Ser abafada', 'Ter bend'], answer: 1, explain: 'A mão esquerda solta cada nota após tocá-la, senão vira acorde.' },
          { prompt: 'Na pestana, o dedo 1 fica melhor…', options: ['No meio da casa', 'Perto do traste, de lado', 'Em cima do traste', 'Com a ponta'], answer: 1, explain: 'Perto do traste e com a lateral do dedo, as cordas soam com menos força.' },
        ],
      },
      rounds: 6,
    },
  ],
}
