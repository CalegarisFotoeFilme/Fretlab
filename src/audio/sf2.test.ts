import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GM, parseSf2, playbackRate, zonesFor } from './sf2'

const PATH = 'public/vendor/alphatab/soundfont/sonivox.sf2'

describe.skipIf(!existsSync(PATH))('SoundFont', () => {
  const file = readFileSync(PATH)
  const sf = parseSf2(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength))

  it('acha baixo e guitarra em toda a região usada pelo treino', () => {
    for (let midi = 28; midi <= 76; midi++) {
      expect(zonesFor(sf, GM.fingerBass, midi).length, `baixo ${midi}`).toBeGreaterThan(0)
      expect(zonesFor(sf, GM.cleanGuitar, midi).length, `guitarra ${midi}`).toBeGreaterThan(0)
      expect(zonesFor(sf, GM.slapBass1, midi).length, `slap ${midi}`).toBeGreaterThan(0)
      expect(zonesFor(sf, GM.slapBass2, midi).length, `slap 2 ${midi}`).toBeGreaterThan(0)
    }
  })
  it('a velocidade de reprodução leva o sample até a nota certa', () => {
    const [z] = zonesFor(sf, GM.fingerBass, 40)
    const s = sf.samples[z.sample]
    expect(s.end).toBeGreaterThan(s.start)
    expect(playbackRate(z, z.rootKey + 12) / playbackRate(z, z.rootKey)).toBeCloseTo(2, 5)
  })
  it('recusa arquivos que não são SoundFont', () => {
    expect(() => parseSf2(new ArrayBuffer(64))).toThrow()
  })
})
