// Copia o build UMD do alphaTab (fontes + soundfont) para public/vendor.
// Carregamos via <script> em vez do plugin Vite: assim o alphaTab encontra
// fontes, soundfont e o próprio script do worker pelo mesmo caminho.
import { cpSync, mkdirSync } from 'node:fs'

const src = 'node_modules/@coderline/alphatab/dist'
const dest = 'public/vendor/alphatab'
mkdirSync(`${dest}/soundfont`, { recursive: true })
cpSync(`${src}/alphaTab.min.js`, `${dest}/alphaTab.min.js`)
cpSync(`${src}/font`, `${dest}/font`, { recursive: true })
cpSync(`${src}/soundfont/sonivox.sf2`, `${dest}/soundfont/sonivox.sf2`)
cpSync(`${src}/soundfont/LICENSE`, `${dest}/soundfont/LICENSE`)
