// Gera screenshots das telas principais (mobile e desktop) para revisão visual.
// Uso: npm run build && npx vite preview --port 4173 & node scripts/screenshots.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const OUT = process.env.OUT_DIR ?? 'screenshots'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
})

async function seed(page, stars) {
  await page.evaluate((stars) => new Promise((res, rej) => {
    const req = indexedDB.open('fretlab')
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(['lessons', 'days'], 'readwrite')
      const now = Date.now()
      stars.forEach(([id, s]) => tx.objectStore('lessons').put({ lessonId: id, stars: s, bestAccuracy: 0.9, attempts: 1, lastPlayedAt: now }))
      const d = new Date()
      const key = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
      for (let i = 0; i < 4; i++) {
        const day = new Date(d)
        day.setDate(d.getDate() - i)
        tx.objectStore('days').put({ day: key(day), xp: 45, minutes: 12 })
      }
      tx.oncomplete = res
      tx.onerror = rej
    }
    req.onerror = rej
  }), stars)
}

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, dpr: 2 },
  desktop: { viewport: { width: 1440, height: 900 }, dpr: 2 },
  ultrawide: { viewport: { width: 2560, height: 1080 }, dpr: 1 },
}

for (const name of (process.env.VIEWPORTS ?? 'ultrawide,desktop').split(',')) {
  const { viewport, dpr } = VIEWPORTS[name]
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr })
  const page = await ctx.newPage()
  const shot = async (file, full = false) => {
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/${name}-${file}.png`, fullPage: full })
  }
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await shot('01-trilha-inicio')
  await seed(page, [['w1-cordas-soltas', 3], ['w1-alfabeto', 2], ['w1-corda-grave', 1]])
  await page.reload()
  await page.waitForLoadState('networkidle')
  await shot('02-trilha-progresso', true)

  await page.goto(`${BASE}/licao/w1-alfabeto`)
  await shot('03-licao-explicacao', true)
  await page.goto(`${BASE}/licao/w1-segunda-corda`)
  await page.getByRole('button', { name: 'Praticar' }).click()
  await shot('04-exercicio-achar-nota')
  await page.locator('.fret-hit:not([aria-disabled])').nth(3).click({ force: true })
  await shot('05-exercicio-feedback')

  await page.goto(`${BASE}/licao/w1-cordas-soltas`)
  await page.getByRole('button', { name: 'Praticar' }).click()
  await shot('06-exercicio-nomear-nota')

  await seed(page, [['w1-cordas-soltas', 3], ['w1-alfabeto', 2], ['w1-corda-grave', 1], ['w2-pulso', 1], ['w2-figuras', 1], ['w2-minimas', 2]])
  await page.goto(`${BASE}/licao/w2-colcheias`)
  await shot('07-ritmo-explicacao', true)
  await page.getByRole('button', { name: 'Praticar' }).click()
  await shot('08-ritmo-exercicio')

  await page.goto(`${BASE}/braco`)
  await shot('09-braco-explorador', true)
  await page.goto(`${BASE}/afinador`)
  await shot('10-afinador', true)
  await page.goto(`${BASE}/ajustes`)
  await shot('11-ajustes', true)

  await page.goto(`${BASE}/musicas`)
  await shot('12-musicas-vazio')
  await page.locator('input[type=file]').first().setInputFiles('tests/fixtures/exemplo-baixo-mi-menor.musicxml')
  await page.waitForURL(/\/musicas\/\d+/)
  await page.waitForSelector('.alphatab-host svg', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await shot('13-player')
  await ctx.close()
}
await browser.close()
