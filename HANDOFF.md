# Handoff: de onde continuar

> **Para o Claude que abrir este projeto:** leia este arquivo inteiro e depois execute a seção **"Primeiros passos"**, na ordem, sem esperar instrução. Responda ao usuário em **PT-BR**. Ao terminar uma etapa importante, atualize este arquivo (seções "Estado atual" e "Próximos passos").

Última atualização: 2026-10-14. Origem: sessão na nuvem (Claude Code web), migrada para uma sessão local no Mac do usuário.

## Quem é o usuário e o que ele quer

- Baixista e guitarrista. Lê tablatura, mas tem quase zero de teoria: acordes, escalas, CAGED, campo harmônico, notas no braço.
- Quer um app **pessoal** (sem fins comerciais) de estudo **progressivo e gamificado**, estilo Simply Piano, para guitarra e baixo.
- Usa **Songsterr Plus**: baixa as músicas como **MIDI** ou **Guitar Pro**.
- Ambiente principal: **macOS, monitor ultrawide 2560×1080, mouse e teclado**. O toque deve continuar funcionando, mas é secundário.
- Usa uma **pedaleira como interface de áudio USB**, que serve de entrada para a detecção de notas.
- Gosta de receber **prints/preview** da evolução para poder sugerir mudanças. Mande screenshots depois de mudanças visuais.
- Metodologia inspirada em Desi Serna (*Guitar Theory for Dummies*), William Leavitt (*Modern Method for Guitar*), Ralph Denyer (*The Guitar Handbook*) e *Guitar All-in-One for Dummies*. Use só a **abordagem**: **nunca copie texto** dos livros (ver `docs/METODOLOGIA.md`).
- Pode hospedar no próprio servidor (Docker + nginx prontos). O microfone exige HTTPS ou `localhost`.

## Primeiros passos (faça automaticamente)

1. `git status` e `git log --oneline -5`: confirme que está no `main` e atualizado (`git pull`).
2. `npm install`, depois `npx tsc -b && npx eslint . && npx vitest run`. Tudo deve passar: 29 testes, 1 pulado.
3. Suba o servidor de desenvolvimento (`npm run dev`, em background) e peça ao usuário para abrir **http://localhost:5173** no Chrome.
4. **Confirme que a tela branca do macOS foi resolvida.** O erro era `The requested module '/src/exercises/Rhythm.ts' does not provide an export named 'previewPattern'`. Causa: `rhythm.ts` e `Rhythm.tsx` colidiam no sistema de arquivos sem distinção de maiúsculas. Foi corrigido renomeando para `src/exercises/rhythmScore.ts`. Se ainda aparecer, procure outra colisão (`src/filenames.test.ts`) ou cache do Vite (`rm -rf node_modules/.vite`).
5. Guie o teste da **pedaleira**: Ajustes → Entrada de áudio → Atualizar → escolher a pedaleira → Afinador → Ligar entrada → tocar uma corda solta. A detecção nunca foi testada com áudio real (só com senoides nos testes). Ajuste a sensibilidade e o buffer se necessário (`src/audio/pitch.ts`, `src/audio/engine.ts`).
6. Peça para o usuário importar o MIDI do Songsterr (Master of Puppets) em **Músicas** e confirme que **o som toca** no player. Até agora, o player só foi verificado como "pronto" num navegador headless.
7. Depois disso, siga os **Próximos passos**.

## Estado atual

**Funciona (testado):**
- Trilha com 2 mundos completos:
  - **O Braço**: 11 lições;
  - **Ritmo I**: 7 lições.
- Gamificação: estrelas (60/80/95%), XP, nível, dias seguidos e desbloqueio, tudo salvo em IndexedDB.
- Exercícios:
  - achar a nota, clicando ou tocando;
  - nomear a nota;
  - quiz;
  - ritmo, por toque/espaço ou pelo instrumento, com metrônomo e avaliação em ms.
- Braço SVG: baixo 4/5, guitarra 6, afinações, canhoto. Fica horizontal no desktop e vertical em tela estreita, e é navegável por setas.
- Explorador do braço: escalas, acordes, campo harmônico, notas ou graus.
- Afinador e ajustes: instrumento, afinação, nomes das notas, dispositivo de entrada, sensibilidade, compensação de latência, backup JSON.
- Músicas:
  - importa Guitar Pro, MusicXML e **MIDI do Songsterr** (convertido para GP com corda/casa exatas);
  - player alphaTab com faixas, velocidade, loop, metrônomo e silenciar a própria faixa;
  - painel **"Teoria desta música"** com tom estimado, escala no braço e campo harmônico;
  - link do Songsterr abre em janela ao lado.
- Atalhos de teclado com `<Kbd>` visível; layouts para ultrawide.
- Versão publicada no claude.ai (sem microfone): https://claude.ai/artifact/LJUV58kSfHGGHbgwp58LAr (build: `npx vite build --mode artifact`).

**Não testado ou limitações conhecidas:**
- Detecção de nota e de ataques com a pedaleira real. A latência no ritmo pode precisar de calibração.
- Som do player alphaTab num Chrome real.
- Conversor MIDI:
  - a bateria fica de fora (alphaTab precisa de mapeamento de articulações de percussão);
  - quiálteras são aproximadas para fusas;
  - o Songsterr usa compassos como 21/32, que são mantidos como vieram.
- A estimativa de tom confunde relativos (Sol maior × Mi menor) em trechos curtos.

## Próximos passos (prioridade)

1. Validar no Mac os itens "não testados" acima e corrigir o que aparecer.
2. **Fase 2 do currículo**: os Mundos 3–7 já aparecem como "em construção" em `src/curriculum/index.ts`.
   - **Intervalos** (formas no braço à la Serna, reconhecimento auditivo). Precisa de novos tipos de exercício: "tocar o intervalo" e "identificar o intervalo ouvido".
   - **Escalas**: padrões e estudo por posição à la Leavitt.
   - **Acordes e arpejos**: construção pela fórmula à la Denyer.
   - **CAGED** na guitarra e mapas de arpejo no baixo.
   - **Campo harmônico**, ligado à biblioteca de músicas.
3. **Treino do Dia** com repetição espaçada (SRS) de fatos errados: nota na corda/casa, intervalos, graus.
4. **Modo espera** no player: o app pausa até você tocar a nota certa, estilo Simply Piano. Usa `input` + o cursor do alphaTab.
5. Bateria no conversor MIDI (faixa de percussão do alphaTab) para ter acompanhamento completo.
6. Ritmo II (semicolcheias, tercinas, síncopes, ditado) e leitura de partitura (VexFlow).
7. Opcional: casco desktop com **Tauri** para abrir o Songsterr embutido. O site bloqueia iframe (`X-Frame-Options: Deny`).

## Mapa do código

| Pasta | O que tem |
|---|---|
| `src/theory` | notas, intervalos, escalas, acordes, campo harmônico (`notes.ts`), instrumento/braço (`instrument.ts`), estimativa de tom (`key.ts`) |
| `src/audio` | `engine.ts`: síntese Karplus-Strong, metrônomo, `input` (getUserMedia sem filtros de voz); `pitch.ts`: pitchy + estabilizador; `useInput.ts` |
| `src/exercises` | componentes de exercício + `generate.ts` (rodadas) + `rhythmScore.ts` (pontuação do ritmo) |
| `src/curriculum` | lições como dados; `index.ts` tem os mundos e as regras de desbloqueio |
| `src/progress` | Dexie (`db.ts`), XP/estrelas/dias seguidos (`scoring.ts`, `progress.ts`), ajustes (`settings.ts`, Zustand) |
| `src/library` | `alphatab.ts` (carregamento UMD, caminhos, Songsterr), `midiImport.ts` (MIDI → GP) |
| `src/components` | `Fretboard.tsx`, `RhythmStaff.tsx` (glifos Bravura), `TeachBlocks.tsx`, `ui.tsx`, `useHotkeys.tsx`, `AppShell.tsx` |
| `src/pages` | Trilha, Lição, Braço, Afinador, Músicas, Player, Ajustes |
| `scripts/` | `copy-alphatab.mjs` (postinstall), `screenshots.mjs` (Playwright: `VIEWPORTS=ultrawide,desktop,mobile`) |

## Armadilhas já encontradas (não repetir)

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
