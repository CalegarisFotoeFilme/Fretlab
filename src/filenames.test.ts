import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

// macOS (e Windows) não diferenciam maiúsculas: "Rhythm.tsx" e "rhythm.ts" viram o mesmo módulo
// e quebram o app com uma tela branca. Este teste impede nomes que só diferem na caixa.
it('não há arquivos com o mesmo nome diferindo só em maiúsculas', () => {
  const clashes: string[] = []
  const walk = (dir: string) => {
    const seen = new Map<string, string>()
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      const key = name.toLowerCase().replace(/\.(tsx?|jsx?|mjs)$/, '')
      if (seen.has(key)) clashes.push(`${join(dir, seen.get(key)!)} × ${full}`)
      else seen.set(key, name)
    }
  }
  walk('src')
  expect(clashes).toEqual([])
})
