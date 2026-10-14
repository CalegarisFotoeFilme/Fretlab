# FretLab: notas para agentes

- Interface e textos em **PT-BR**. Os comentários de código também são em português.
- Alvo principal: **macOS em ultrawide 2560×1080 com mouse e teclado**. Telas largas usam layouts lado a lado (`xl:`/`2xl:`) e evitam rolagem vertical nos exercícios. O celular é secundário (braço vertical, toque).
- Toda ação frequente tem atalho de teclado (`src/components/useHotkeys.tsx`, com `<Kbd>` no botão). O braço (`Fretboard`) é navegável por setas.
- Design: tokens em `src/design/tokens.css` ("Rosewood & Stompbox"). Não introduzir cores fora dos tokens.
- Currículo é **dado** (`src/curriculum/*.ts`). Um exercício novo = tipo em `src/exercises/` + spec em `curriculum/types.ts`. O teste `generate.test.ts` valida todo o currículo para baixo 4/5 e guitarra 6.
- A teoria é própria (`src/theory`), sem dependência externa, e testada.
- alphaTab é carregado como **UMD** de `public/vendor/alphatab` (copiado no `postinstall`). Use `alphaTabPaths()` (URLs absolutas: o worker roda de um blob).
- MIDI do Songsterr: uma trilha-cabeçalho com nome + uma trilha por corda (canal = corda, 0 = aguda). Ver `src/library/midiImport.ts`.
- Nada de arquivos cujo nome só difere na caixa (ex.: `Rhythm.tsx` e `rhythm.ts`): no macOS isso quebra os imports. `src/filenames.test.ts` verifica.
- Nunca versionar arquivos de música do usuário (Songsterr). Para testar com um real: `FRETLAB_MIDI=... npx vitest run src/library`.

## Checagens antes de commit

```bash
npx tsc -b && npx eslint . && npx vitest run && npx vite build
```

Para revisão visual: `scripts/screenshots.mjs` (Playwright; viewports `ultrawide`, `desktop`, `mobile`).
