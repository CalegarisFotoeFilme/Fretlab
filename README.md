# FretLab

App pessoal de estudo de teoria musical para **baixo e guitarra**, no estilo Simply Piano: lições curtas, exercícios interativos, o app ouvindo o instrumento e as músicas do Songsterr dentro do estudo.

É um PWA *local-first*: não tem servidor nem conta, e o progresso fica salvo no navegador (IndexedDB). Ele pode ser hospedado como site estático e instalado no Mac/celular.

## O que já tem

- **Trilha gamificada**: mundos que vão sendo desbloqueados, com estrelas (60/80/95% de acerto), XP, nível e sequência de dias.
  - **O Braço** (11 lições): cordas soltas, alfabeto musical, notas por corda, casa 12, sustenidos/bemóis, oitavas e o desafio final.
  - **Ritmo I** (7 lições): pulso, figuras, colcheias, pausas e ritmo tocado no instrumento.
- **Exercícios**: achar a nota (clique ou tocando), nomear a nota, quiz e ritmo com metrônomo (avaliação em ms).
- **Ouve o instrumento**: detecção de nota (McLeod/pitchy) pelo microfone ou pela pedaleira como interface USB. Tem afinador e funciona até o Si grave do baixo de 5 cordas.
- **Braço livre**: escalas, acordes e campo harmônico em qualquer tom, com rótulos de nota ou de grau.
- **Músicas**:
  - importa **Guitar Pro**, **MusicXML** e o **MIDI do Songsterr**. O MIDI é convertido em tablatura com a corda e a casa exatas, porque o Songsterr grava uma corda por canal;
  - player com velocidade, loop, metrônomo e opção de silenciar a sua faixa;
  - painel **"Teoria desta música"** com tom estimado, escala no braço e campo harmônico;
  - o Songsterr não pode rodar dentro de um site (ele bloqueia iframes), então há um botão que o abre numa janela ao lado.
- **Instrumentos**: baixo de 4 e 5 cordas, guitarra de 6 cordas, afinações alternativas e modo canhoto.
- **Interface pensada para desktop/ultrawide** com mouse e teclado. Os atalhos aparecem nos botões, e o braço é navegável pelas setas. O toque também funciona no celular, onde o braço fica vertical.

## Rodando

```bash
npm install        # também copia o alphaTab (fontes + soundfont) para public/vendor
npm run dev        # http://localhost:5173
npm test           # testes (teoria, áudio, ritmo, pontuação, currículo, conversor MIDI)
npm run build      # gera dist/
```

O microfone só funciona em `localhost` ou **HTTPS**.

### Teste com um MIDI real (opcional)

```bash
FRETLAB_MIDI=/caminho/Artista-Musica.mid npx vitest run src/library
```

### Screenshots para revisão de design

```bash
npm run build && npx vite preview --port 4173 &
CHROMIUM_PATH=/caminho/do/chromium VIEWPORTS=ultrawide,desktop,mobile node scripts/screenshots.mjs
```

## Hospedando no seu servidor

```bash
docker build -t fretlab .
docker run -d -p 8080:80 fretlab
```

Coloque o container atrás do seu proxy com HTTPS (Caddy, Traefik, nginx…), porque sem HTTPS o navegador não libera o microfone.

## Estrutura

```
src/theory      notas, intervalos, escalas, acordes, campo harmônico, braço, tonalidade
src/audio       síntese (Karplus-Strong), metrônomo, entrada de áudio e detecção de nota
src/exercises   tipos de exercício e geradores
src/curriculum  lições (dados) e regras de desbloqueio
src/progress    IndexedDB, pontuação, XP, sequência, ajustes
src/library     alphaTab e conversor MIDI → Guitar Pro
src/components  braço SVG, pauta rítmica, UI base
src/pages       telas
docs/           metodologia
```

Veja também [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md), [`THIRD_PARTY.md`](THIRD_PARTY.md) e, para continuar o desenvolvimento, [`HANDOFF.md`](HANDOFF.md).
