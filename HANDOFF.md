# Handoff: de onde continuar

> **Para o Claude que abrir este projeto:** leia este arquivo inteiro e depois execute a seção **"Primeiros passos"**, na ordem, sem esperar instrução. Responda ao usuário em **PT-BR**. Ao terminar uma etapa importante, atualize este arquivo (seções "Estado atual" e "Próximos passos").

Última atualização: 2026-10-15 (versão 1.0.0). Origem: sessão na nuvem (Claude Code web), migrada para uma sessão local no Mac do usuário.

## Quem é o usuário e o que ele quer

- Baixista e guitarrista. Lê tablatura, mas tem quase zero de teoria: acordes, escalas, CAGED, campo harmônico, notas no braço.
- Quer um app **pessoal** (sem fins comerciais) de estudo **progressivo e gamificado**, estilo Simply Piano, para guitarra e baixo.
- Usa **Songsterr Plus**: baixa as músicas como **MIDI** ou **Guitar Pro**.
- Ambiente principal: **macOS, monitor ultrawide 2560×1080, mouse e teclado**. O toque deve continuar funcionando, mas é secundário.
- Usa uma **pedaleira como interface de áudio USB**, que serve de entrada para a detecção de notas.
- Gosta de receber **prints/preview** da evolução para poder sugerir mudanças. Mande screenshots depois de mudanças visuais.
- Metodologia inspirada em Desi Serna (*Guitar Theory for Dummies*), William Leavitt (*Modern Method for Guitar*), Ralph Denyer (*The Guitar Handbook*), *Guitar All-in-One for Dummies* e Troy Nelson (*Guitar Aerobics*: treino diário curto e progressivo, com metrônomo). Use só a **abordagem**: **nunca copie texto** dos livros (ver `docs/METODOLOGIA.md`).
- Pode hospedar no próprio servidor (Docker + nginx prontos). O microfone exige HTTPS ou `localhost`.

## Primeiros passos (faça automaticamente)

1. `git status` e `git log --oneline -5`: confirme que está no `main` e atualizado (`git pull`).
2. `npm install`, depois `npx tsc -b && npx eslint . && npx vitest run`. Tudo deve passar (78 testes, 1 pulado).
3. Leia **"Versão 1.0.0"** logo abaixo e a seção **"Próximos passos"**; pergunte ao usuário o que ele quer agora.
4. App para Mac: `npm run desktop` (desenvolvimento) ou `npm run desktop:build` (gera `src-tauri/target/release/bundle/macos/FretLab.app`). Depois de instalar uma build, feche e abra o app.
5. Economize recursos: o usuário prefere testar ele mesmo no app. Faça as checagens automáticas, recompile, faça commit e **peça para ele testar**, com um roteiro curto.

## Versão 1.0.0 (2026-10-15)

Primeira versão "fechada" (package.json, `src-tauri/tauri.conf.json` e `Cargo.toml` em 1.0.0, tag `v1.0.0`). Resumo do que existe:
- **Trilha:** 13 mundos (O Braço, Ritmo I, Intervalos, Escalas, Acordes e arpejos, CAGED, Campo harmônico, **Harmonia**, Ritmo II, Leitura, **Modos gregos**, **Técnica de baixo** só no baixo, **Técnica de guitarra** só na guitarra), tudo desbloqueado, mundos recolhíveis.
- **Treino do Dia:** aquecimentos (aranha, pentatônica, escala, arpejos, oitavas, CAGED, slap/walking no baixo, legato/sweep na guitarra) com sentido (sobe/desce), "Ouvir exercício", **desafios aleatórios** (4 combinações de tema e tom; caixas estudadas uma por vez), **treino de intervalos de ouvido** (6 módulos de 2 intervalos + aleatório, ciclo de 4 tempos), **Ouvir e repetir** (frases por nível e grooves aplicados, conferidos pelo microfone), revisão espaçada por lição e **pontos fracos** (por fato errado).
- **Músicas:** player alphaTab (GP/MIDI), áudio original do YouTube sincronizado pelo Songsterr (sincronia salva na música), volumes por faixa, modos de prática, teoria da música; backups separados de estudos e de biblioteca.
- **Som:** timbres de baixo e guitarra do SoundFont (o do usuário, ex. GeneralUser GS, ou o padrão), notas cortando a anterior como num instrumento.
- **App para Mac (Tauri):** janela do Songsterr ao lado, downloads entram sozinhos na biblioteca, login Google, sem service worker.
- **Versão web no claude.ai** (sem microfone): ver "Estado atual".

## Estado atual

**Funciona (testado):**
- Trilha com 9 mundos completos (83 lições), validados automaticamente para baixo 4/5 e guitarra 6 (`generate.test.ts`):
  - **O Braço** (11) e **Ritmo I** (7);
  - **Intervalos** (12): tocar o intervalo (braço ou instrumento), nomear pela forma, identificar de ouvido;
  - **Escalas** (11), **Acordes e arpejos** (10) e **CAGED e mapas** (9): exercício "desenhe no braço" (`note-set`), que acha todas as notas de uma escala/acorde numa posição (`ShapeAnchor` = corda da fundamental + casas), clicando ou tocando subindo;
  - **Campo harmônico** (9): quiz de teoria gerado (`theory-quiz`) e ouvido de graus (`hear-degree`);
  - **Ritmo II** (7): ponto e tercina na notação (`q.`, `e.`, `te`), ditado rítmico;
  - **Leitura de partitura** (7): pauta própria com Bravura (`src/components/Staff.tsx`, `src/theory/staff.ts`), clave de sol/fá 8vb, ler a nota pelo nome, no braço ou tocando.
- Blocos de explicação: fórmula (passos T/S e som), mapa no braço com a posição, campo harmônico, forma de intervalo e pauta.
- **Treino do Dia** (`/treino`, `src/training/drills.ts`): aquecimento técnico à la *Guitar Aerobics*. São 5 exercícios, cada um com várias posições:
  - pentatônica nas 5 caixas, "2 notas por corda";
  - escala maior em 7 posições, "3 notas por corda";
  - arpejos nas formas E/A/D;
  - aranha em 3 regiões;
  - oitavas em 2 pares de cordas.
  Tom (ciclo das quintas) e posição rodam dia a dia e podem ser escolhidos. Cada exercício tem "por que" e "como tocar" e um link para a lição relacionada. A tela tem braço numerado, tablatura em SVG por compasso, metrônomo e "ouvir no andamento" (liga/desliga). A meta de BPM fica salva por exercício na tabela `drills`. e revisão espaçada por lição (reprovada volta no dia; 1★ em 1 dia; 2★ em 3; 3★ em 7), numa sessão mista.
- Trilha com mundos recolhíveis (nome, descrição e progresso; lições ao clicar).
- Gamificação: estrelas (60/80/95%), XP, nível e dias seguidos, tudo salvo em IndexedDB. **Tudo desbloqueado desde o início**, por pedido do usuário: a trilha só sugere a próxima lição (a primeira sem estrela).
- Exercícios:
  - achar a nota, clicando ou tocando;
  - nomear a nota;
  - quiz e quiz de teoria gerado;
  - intervalos, "desenhe no braço", ouvido de acordes e graus;
  - ritmo, por toque/espaço ou pelo instrumento, com metrônomo e avaliação em ms; ditado rítmico;
  - ler a nota na pauta.
  - A escolha do componente pelo tipo fica em `src/exercises/ExerciseView.tsx` (lições e Treino do Dia).
- Braço SVG: baixo 4/5, guitarra 6, afinações, canhoto. Fica horizontal no desktop e vertical em tela estreita, e é navegável por setas.
- Explorador do braço: escalas, acordes, campo harmônico, notas ou graus.
- Afinador e ajustes: instrumento, afinação, nomes das notas, dispositivo de entrada, sensibilidade, compensação de latência, backup JSON.
- Músicas:
  - importa Guitar Pro, MusicXML e **MIDI do Songsterr**. O MIDI é guardado como veio e convertido ao abrir (`midiToScore`), direto para o modelo do alphaTab. O conversor recupera:
    - corda e casa;
    - tercinas, sextinas e quintinas, e rasgueados;
    - slides, bends, vibrato, hammer-on/pull-off, staccato e nota morta;
    - a bateria.
    Comparado com o GP oficial da Dua Lipa, o baixo bate em 83 de 92 compassos. As diferenças restantes são staccatos seguidos de pausa, que o MIDI não distingue (o som é idêntico);
  - player alphaTab com faixas, velocidade, loop, metrônomo e silenciar a própria faixa;
  - modos "O que tocar" (teclas 1–4): banda, só a faixa, faixa + bateria, faixa + metrônomo; "Tirar faixa" (T);
  - controles flutuantes sobre a partitura, como no Songsterr: barra compacta sempre visível e painel expansível (C) com velocidade, "O que tocar", toggles e faixas. A escolha fica salva no `localStorage`;
  - **modo espera** (W): a cada nota da faixa escolhida o player pausa até ouvir a nota certa no instrumento;
  - metrônomo visual em destaque no topo da partitura, fora dos controles: uma luz por tempo, o tempo forte pisca maior, com o nº do compasso (eventos de metrônomo do alphaTab);
  - painel **"Teoria desta música"** (`src/theory/analysis.ts` + `src/library/songAnalysis.ts` + `src/components/SongTheory.tsx`):
    - tom e graus mais tocados pela faixa;
    - campo harmônico com os acordes usados (e funções T/S/D) e acordes fora do campo;
    - progressão que mais se repete;
    - análise do compasso (segue o cursor, ou `[`/`]`): acorde, grau e função, nota de repouso, notas com intervalo no acorde e grau no tom, escalas que servem e braço com as notas tocadas;
  - link do Songsterr abre em janela ao lado.
- Atalhos de teclado com `<Kbd>` visível; layouts para ultrawide.
- Versão publicada no claude.ai (sem microfone): https://claude.ai/artifact/LJUV58kSfHGGHbgwp58LAr (build: `npx vite build --mode artifact`).

**Testado no Mac (2026-10-14):** a pedaleira é reconhecida e o afinador funciona; o player toca GP e MIDI.

**Não testado ou limitações conhecidas:**
- Detecção de ataques no exercício de ritmo com a pedaleira. A latência pode precisar de calibração.
- Conversor MIDI: palm mute, harmônicos, dedilhado e afinações "inventadas" de piano não existem no MIDI. Para a tab idêntica, use o **GP do Songsterr**, que é o formato recomendado.
- A estimativa de tom confunde relativos (Sol maior × Mi menor) em trechos curtos.

## Próximos passos (prioridade)

> **Retome por aqui.** Última sessão: 2026-10-15, versão **1.0.0** (tag `v1.0.0`). Tudo commitado; app para Mac recompilado; checagens passando (78 testes). Não há pendências abertas: as próximas ideias estão em "E" abaixo.

### A. Pedidos do usuário: todos feitos

- **Treino do Dia:** controles flutuantes no rodapé, minimizáveis com `C`.
- **Player:** volume geral e por faixa, salvos por música (`Song.mix`).
- **Dica:** botão "Dica" (`H`) em todos os exercícios e no Treino. Os textos ficam em `src/exercises/hints.ts`. A rodada com dica vale no máximo 75%; o `ExerciseView` aplica o teto via `HintContext`.
- **SoundFont:** dá para carregar um SoundFont próprio em Ajustes (tabela `assets`, `applySoundFont`). Ele também é reaplicado ao voltar do modo YouTube.
- **Ajustes:** cartão explicando que plugins e pedaleiras USB não impedem a detecção.
- **Vídeo do YouTube:** pode ficar oculto (tecla `V`).
- **Download pelo Songsterr (app), validado de ponta a ponta com Toxicity:**
  - no macOS o `DownloadEvent::Finished` chega com `path=None`;
  - o destino escolhido em `Requested` fica guardado (`Pending`, por URL) e é usado no fim;
  - log do app em `~/Library/Logs/br.fretlab.desktop/FretLab.log` (tauri-plugin-log, também no app final; o front usa `@tauri-apps/plugin-log`).
- **Download pelo Songsterr (app), pop-ups:** o Songsterr baixa o Guitar Pro por uma janela nova (pop-up). Os pop-ups também usam `download_handler`, avisam o FretLab e fecham sozinhos ao terminar. Antes, o arquivo ia para Downloads sem ser importado.
- **Login com Google no Songsterr (app):** a janela do Songsterr se identifica como Safari (o Google recusa navegador "embutido") e abre os pop-ups (`on_new_window`) como janelas do app, ligadas à que abriu. Verificado: o Google mostrou a conta do usuário. Chave de acesso (passkey) pode não funcionar em app sem a permissão da Apple; nesse caso, entrar com senha e código.
- **Conserto:** "Abrir o Songsterr" no app (comandos declarados no `build.rs` e liberados na capability). Verificado com um autoteste: a janela abre na metade direita e o site carrega.

### B. Validado com o usuário (2026-10-14)

- O app para Mac abre o Songsterr ao lado, faz login com Google (o pop-up abre; se a chave de acesso falhar, entrar com senha) e importa downloads automaticamente. Testado com Toxicity.
- Os downloads vão para `~/Library/Application Support/br.fretlab.desktop/musicas` (backup) e para o banco do app.
- O GeneralUser GS (`~/Downloads/GeneralUser-GS/`) está carregado no app (Ajustes → SoundFont).
- O mostrar/ocultar do vídeo fica na barra flutuante do player (ícone de vídeo, tecla V).
- **Ainda não confirmado pelo usuário:** tocar com a "Gravação (YouTube)" no app. No navegador, o fluxo foi validado com dados injetados.

### C. Técnica (feito em 14/10, primeira versão)

- Mundo 10 **Técnica de baixo** (`world10-bass-technique.ts`): dois dedos, abafamento, ghost notes, slap, ligados, walking (arpejos de 7ª), palheta, tapping/revisão.
- Mundo 11 **Técnica de guitarra** (`world11-guitar-technique.ts`): alternada, palm mute, econômica/string skipping, legato, bends/vibrato, sweep (arpejos), pestana (formas de E e A), tapping/velocidade.
- `World.instrument` + `worldsFor(kind)`; a trilha e a "próxima lição" usam só os mundos do instrumento configurado. Teste em `generate.test.ts`.
- Treino do Dia: drills de técnica com `instrument` (`slap`, `walking` no baixo; `legato`, `sweep` na guitarra), `drillsFor(kind)`; o exercício do dia sorteia só entre os do instrumento.
- Service worker: registrado à mão em `main.tsx` (`injectRegister: false`) e só no navegador; no app para Mac ele é removido (e o cache apagado), então uma build nova aparece já na primeira abertura.
- Lição `w11-bend-afinado`: bend conferido pelo detector (reusa `play-interval` com ½ e 1 tom, input play).

### C0. Planejamento original (referência)

1. **Mundo de técnica de baixo:** pizzicato com dois dedos (alternância e "rest stroke"), slap (thumb e pop), tapping, abafamento (mão esquerda e direita), ghost notes, hammer-on/pull-off e slides, palhetada no baixo, walking bass. Por lição:
   - explicação da mecânica;
   - exercício rítmico com metrônomo, usando o `rhythm` com `input: 'play'` e padrões próprios;
   - "desenhe no braço" quando fizer sentido;
   - vínculo com o Treino do Dia (exercícios técnicos novos em `src/training/drills.ts`, com `why`/`how`/`tips`).
   Na notação, considerar símbolos de técnica (T/P do slap, x de ghost notes) na `RhythmStaff` ou em tabs curtas desenhadas (`TabView`).
2. **Mundo de técnica de guitarra:** palhetada alternada e econômica, palm mute, bends (com afinação-alvo ouvida pelo detector), vibrato, legato (hammer-on/pull-off), slides, sweep picking, tapping, abafamento e "string skipping", acordes com pestana (ligar ao CAGED).
3. Os mundos devem aparecer conforme o instrumento configurado (filtrar em `WORLDS` por `instrument`), mantendo a trilha toda aberta.

### D. Feito em 15/10 (antes eram "ideias para depois")

1. **Revisão por fato errado** (`src/progress/facts.ts`, tabela `facts` no Dexie v4): exercícios informam o fato da rodada com `useFact(key, label)` (Hint.tsx); `ExerciseView` grava acerto/erro (com dica = erro). Errou volta hoje; acertos vencidos: 1, 3, 7 dias; depois sai. Painel "Pontos fracos" no Treino abre uma revisão com as lições desses fatos. Entra no backup dos estudos.
2. **Leitura** na 5ª e na 7ª posição (`w9-quinta-posicao`, `w9-setima-posicao`).
3. **Modos gregos**: mundo 12 (`world12-modes.ts`), escala `locrian` em `SCALES`.
4. **Símbolos de técnica** na notação rítmica: `marks` em `RhythmSpec` (um por padrão) e no bloco `rhythm` (T/P, x = ghost note com cabeça em x, i/m, ⊓/V, PM). Teste confere um símbolo por ataque.

5. **Treino de intervalos de ouvido** (`src/training/IntervalEar.tsx`, lógica em `earModules.ts`): 6 módulos de dois intervalos (3M/5J, 2M/4J, 6M/8, 7m/7M, 3m/6m, 2m/4aum) + "Aleatório total" (os 12). Ciclo contínuo de 4 tempos (ouça, pausa, responda, confira), tônica sorteada entre as 12 notas, separadas/juntas/alternar, BPM ajustável, erro não para o jogo; grava fatos (`hear-interval:*`) na revisão. Pedido do usuário inspirado no método de Daniel Daibem (só a mecânica descrita por ele; nenhum material copiado).
6. **Mundo Harmonia** (`world13-harmony.ts`, logo depois de Campo harmônico): tétrades do campo, cadências (ouvido e nomes), ii–V–I, dominantes secundários, funções/substituições (inclui trítono), empréstimo modal, notas-guia, tétrades de ouvido.

7. **Timbres reais** (`src/audio/sf2.ts` lê o .sf2; `sfVoice.ts` toca): o SoundFont do usuário (Ajustes) ou o padrão. O `AppShell` liga `setNoteVoice` no `playNote` com baixo dedilhado (GM 33) ou guitarra limpa (GM 27) conforme o instrumento; sem SoundFont, cai no sintetizador. O treino de intervalos tem "Timbre": Baixo / Guitarra / Sintetizador (baixo uma oitava abaixo).

8. **Treino com propósito**: botão "Desafio aleatório" (tecla N) no aquecimento (`src/training/challenges.ts`): sorteia tom e tarefa sobre o tema. Escalas: todas as caixas em zigue-zague, conectar 2–3 caixas, começar em qualquer grau numa corda sorteada (`scaleFromString`), grupos de 3/4. Arpejos/sweep: outra corda, inversão (começar na 3ª/5ª), I–IV–V. Oitavas/slap: ciclo das quartas, progressões. Walking: progressão e tom sorteados. Aranha: permutações dos dedos. CAGED (drill `caged`, `cagedShape`): as 5 formas pelo braço em ordem, conectar duas, ou uma forma como maior/menor/7.
9. **Ouvir e repetir** (`src/training/EchoTrainer.tsx`, lógica `echo.ts`): o app toca uma frase (por nível, que sobe ao acertar, guardado em localStorage; ou "grooves aplicados" de baixo/guitarra com T/P, x, PM) e confere a repetição nota a nota pelo microfone/pedaleira (ordem das notas em qualquer oitava; ghost notes fora). Erro mostra onde e o que foi tocado. Teclas O (ouvir), P (outra), V (mostrar notas). Ideia futura: conferir também o ritmo (onsets vs `onsetBeats`).

Sem pendências abertas; próximas ideias ficam a critério do usuário (ex.: trechos curtos de leitura, ouvir modos).

- **Sessão 14/10 (fim):** sincronia do YouTube salva na música (`Song.sync`; segunda abertura não consulta o Songsterr); cursor suavizado no modo Gravação (interpolação entre leituras do YouTube); tab isolada (`isolate`) para o destaque do compasso não cobrir os painéis; backups separados: estudos (`exportProgress`) e biblioteca (`exportLibrary`, arquivos em base64 + sincronia + volumes); `importBackup` aceita os dois e não duplica músicas; cursor próprio `steadyCursor` (alphatab.ts): a animação de transição do alphaTab some no WebKit e a barra piscava; obs.: `enableAnimatedBeatCursor=false` não funciona no alphaTab 1.8.4 (bug em `_updateCursorHandler`); posição do YouTube nunca recua. No app para Mac o backup vai para Downloads (comando `save_backup`). **Aguardando teste do usuário.**

### E. Ideias para depois da 1.0.0

1. Ouvir e repetir: conferir também o ritmo (onsets × `onsetBeats`), não só a ordem das notas.
2. Versão para **Windows** (Tauri também gera `.msi`/`.exe`): ver a nota no fim deste arquivo.
3. Leitura de trechos curtos (várias notas na pauta), modos de ouvido, harmonia das músicas da biblioteca.

## App para Mac (Tauri)

- O app é servido em `http://localhost:47321` (`tauri-plugin-localhost`), e a janela principal é criada em `lib.rs`. Motivo: o iframe do YouTube exige referer de página web, e `tauri://` não manda.
- `tauri-plugin-http` está liberado só para `https://www.songsterr.com/api/*`. A capability `default.json` usa `remote.urls: http://localhost:*`.
- **Áudio original sincronizado** (`src/library/songsterrSync.ts`, `src/library/useOriginalAudio.ts`):
  - revisão atual: `GET /api/meta/{songId}`;
  - vídeos: `GET /api/video-points/{songId}/{revisionId}/list`, que devolve `videoId`, `feature` (original/alternative/backing/solo) e `points` (segundos do início de cada compasso **tocado**, com repetições expandidas);
  - os pontos viram `FlatSyncPoint` pela ordem do `api.tickCache.masterBars`, e o alphaTab passa para `PlayerMode.EnabledExternalMedia`, com o YouTube como `handler` e `updatePosition` a cada 40 ms;
  - armadilha: `seekTo` num vídeo parado faz o YouTube tocar. O handler pausa de novo e ignora o "PLAYING" por 800 ms;
  - armadilha: chame `api.stop()` antes de destruir o player do YouTube.
  - Vídeo grande, pequeno ou **oculto** (tecla V; só o som continua). O oculto fica fora da tela, sem sair do DOM, para o YouTube não pausar. Preferência no `localStorage`.
  - Em desenvolvimento dá para testar no navegador injetando `sessionStorage['fretlab.syncFixture']` com um `SongsterrSync` em JSON.

- `src-tauri/`: Tauri 2. Comandos Rust:
  - `open_songsterr`: abre o Songsterr numa janela do app, na metade direita da tela;
  - `read_download`: só lê arquivos que essa janela baixou.
- Os downloads da janela do Songsterr vão para `~/Downloads` e são importados na biblioteca automaticamente (`useSongsterrImports` no `AppShell`).
- `npm run desktop` roda em desenvolvimento, e `npm run desktop:build` gera `src-tauri/target/release/bundle/macos/FretLab.app`.
- O Rust foi instalado via rustup (`~/.cargo`).
- O app tem o próprio armazenamento: o progresso do navegador passa para ele pelo backup em Ajustes, e as músicas precisam ser importadas de novo.

## Mapa do código

| Pasta | O que tem |
|---|---|
| `src/theory` | notas, intervalos, escalas, acordes, campo harmônico (`notes.ts`), instrumento/braço (`instrument.ts`), estimativa de tom (`key.ts`) |
| `src/audio` | `engine.ts`: síntese Karplus-Strong, metrônomo, `input` (getUserMedia sem filtros de voz); `pitch.ts`: pitchy + estabilizador; `useInput.ts` |
| `src/exercises` | componentes de exercício, `ExerciseView.tsx` (escolhe pelo tipo), `generate.ts` (rodadas e perguntas geradas), `rhythmScore.ts` (pontuação do ritmo) |
| `src/curriculum` | lições como dados (`world1`…`world9`); `index.ts` tem os mundos e a próxima lição sugerida |
| `src/training` | Treino do Dia: exercícios técnicos gerados e revisão espaçada |
| `src/progress` | Dexie (`db.ts`), XP/estrelas/dias seguidos (`scoring.ts`, `progress.ts`), ajustes (`settings.ts`, Zustand) |
| `src/library` | `alphatab.ts` (carregamento UMD, caminhos, Songsterr), `midiImport.ts` (MIDI → GP) |
| `src/components` | `Fretboard.tsx`, `RhythmStaff.tsx` (glifos Bravura), `TeachBlocks.tsx`, `ui.tsx`, `useHotkeys.tsx`, `AppShell.tsx` |
| `src/pages` | Trilha, Lição, Braço, Afinador, Músicas, Player, Ajustes |
| `scripts/` | `copy-alphatab.mjs` (postinstall), `screenshots.mjs` (Playwright: `VIEWPORTS=ultrawide,desktop,mobile`) |

## Armadilhas já encontradas (não repetir)

- **Caminhos do `public/`**: use `import.meta.env.BASE_URL`, nunca um caminho relativo à página. Em `/musicas/1`, o caminho `vendor/...` virava `/musicas/vendor/...` (404) e o player ficava em "Carregando som…".
- **`useEffect` com corpo sem chaves**: no Chrome novo, `window.scrollTo` devolve uma Promise. Quando o efeito a devolvia, o React quebrava com "destroy is not a function".
- **MIDI do Songsterr "toca" as articulações**:
  - slide = escala cromática de notas curtas e iguais, mais fracas que a origem; o alvo pode ter duração zero;
  - slide de um semitom = rampa de pitch bend (faixa de ±24) no fim da nota;
  - ligado = nota mais fraca que a última nota palhetada;
  - staccato = soa metade do intervalo até o próximo ataque;
  - nota morta = ~1/30 de semínima.
  Para testar o conversor, compare com o GP oficial da mesma música.

- **Maiúsculas no macOS**: não crie arquivos que só diferem na caixa. Há um teste para isso.
- **alphaTab**:
  - carregado via UMD de `public/vendor/alphatab` (o plugin Vite do pacote está quebrado);
  - o worker roda de um blob, então os caminhos precisam ser **URLs absolutas** (`alphaTabPaths()`).
- **Dexie + React**: `useLiveQuery` devolve **um Blob novo a cada leitura**. Não use o Blob como dependência de efeito: isso gerou um loop que recriava o player. Use uma chave estável (id + nome + tamanho).
- **MIDI do Songsterr**: uma trilha-cabeçalho **com nome** abre cada instrumento, e as trilhas seguintes, **sem nome**, são uma por corda, com **canal = corda** (0 = mais aguda). A afinação é inferida pela nota mais grave de cada corda.
- O pacote `@tonaljs/tonal` veio quebrado do npm. Por isso a teoria é própria.
- **Versão claude.ai** (`--mode artifact`):
  - sem service worker;
  - rotas em memória;
  - o soundfont vai como `.b64.txt`, porque `.sf2` não é servido lá;
  - `confirm()`/`alert()` não funcionam, então as confirmações são feitas na própria página.
- Contraste: `pearl-faint` foi ajustado para passar AA. Use só cores dos tokens (`src/design/tokens.css`).

## Convenções

Ver `CLAUDE.md`. Resumo:
- PT-BR em tudo;
- alvo ultrawide com teclado;
- currículo como dados;
- testes para a lógica;
- nunca versionar músicas do usuário;
- checagens antes de commit: `npx tsc -b && npx eslint . && npx vitest run && npx vite build`.

## Windows (avaliado em 2026-10-15)

O app é Tauri 2 + React, então o mesmo código compila para Windows (WebView2). O que precisa de atenção:
- **Compilar no Windows** (ou em CI `windows-latest` com GitHub Actions): `npm run desktop:build` gera `.msi`/`.exe` (NSIS). Cross-compilar do Mac não é prático.
- `src-tauri/src/lib.rs`: o tratamento de downloads foi feito para o WebKit do macOS (que não informa o caminho do arquivo, por isso o mapa `Pending`). No WebView2 o evento de download informa o caminho; revisar e testar. O user agent "Safari" do login Google talvez precise virar um UA de Edge/Chrome no Windows.
- `save_backup` usa `open -R` (Finder): trocar por `explorer /select,` no Windows.
- Scripts `desktop`/`desktop:build` do package.json usam `PATH=$HOME/.cargo/bin:...` (sintaxe de shell Unix): criar variantes para Windows.
- Áudio: entrada pela pedaleira via WebView2 (Chromium) deve funcionar; a latência no Windows depende do driver (ASIO não é usado pelo navegador).
- O cursor e a animação que piscavam no WebKit não são problema no WebView2.
