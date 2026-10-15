import { audioCtx, setNoteVoice } from './engine'
import { GM, parseSf2, playbackRate, zonesFor, type SoundFont } from './sf2'

/*
  Timbres de baixo e guitarra a partir do SoundFont de melhor qualidade disponível: o que o usuário
  carregou em Ajustes (ex.: GeneralUser GS) ou, sem ele, o padrão que vem com o app.
*/

let loading: Promise<SoundFont | null> | null = null
const buffers = new Map<number, AudioBuffer>()

/** Carrega (uma vez) o SoundFont. `null` se não houver nenhum disponível (versão do claude.ai). */
export function loadVoices(): Promise<SoundFont | null> {
  loading ??= (async () => {
    const { customSoundFont, alphaTabPaths } = await import('../library/alphatab')
    const custom = await customSoundFont()
    if (custom) return parseSf2(await custom.data.arrayBuffer())
    const url = alphaTabPaths().soundFont
    if (!url) return null
    return parseSf2(await (await fetch(url)).arrayBuffer())
  })().catch((e) => {
    console.error('SoundFont para o treino de ouvido:', e)
    return null
  })
  return loading
}

/** O SoundFont mudou em Ajustes: recarregar na próxima nota. */
export function resetVoices() {
  loading = null
  buffers.clear()
}

function sampleBuffer(sf: SoundFont, index: number) {
  const cached = buffers.get(index)
  if (cached) return cached
  const s = sf.samples[index]
  const len = Math.max(1, s.end - s.start)
  const c = audioCtx()
  const buf = c.createBuffer(1, len, s.sampleRate)
  const out = buf.getChannelData(0)
  for (let i = 0; i < len; i++) out[i] = sf.data[s.start + i] / 32768
  buffers.set(index, buf)
  return buf
}

/**
 * Toca uma nota com o timbre do programa GM. Devolve `false` se o SoundFont não estiver pronto
 * (quem chama pode cair no sintetizador).
 */
export function playVoice(sf: SoundFont, program: number, midi: number, when: number, gain = 0.6, duration = 1.6) {
  const zones = zonesFor(sf, program, midi)
  if (!zones.length) return false
  const c = audioCtx()
  for (const z of zones) {
    const s = sf.samples[z.sample]
    const src = c.createBufferSource()
    src.buffer = sampleBuffer(sf, z.sample)
    src.playbackRate.value = playbackRate(z, midi)
    const offset = Math.max(0, z.startOffset) / s.sampleRate
    if (z.loop) {
      src.loop = true
      src.loopStart = (s.loopStart - s.start + z.loopStartOffset) / s.sampleRate
      src.loopEnd = (s.loopEnd - s.start + z.loopEndOffset) / s.sampleRate
    }
    const g = c.createGain()
    const level = (gain * 10 ** (-z.attenuation / 20)) / Math.sqrt(zones.length)
    g.gain.setValueAtTime(level, when)
    // solta a nota no fim, com um decaimento curto (sem estalo)
    g.gain.setValueAtTime(level, when + duration)
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.3)
    src.connect(g).connect(c.destination)
    src.start(when, offset)
    src.stop(when + duration + 0.35)
  }
  return true
}

/**
 * Todas as notas do app (lições de ouvido, braço, acordes) passam a soar com o timbre do
 * instrumento configurado, assim que o SoundFont carregar.
 */
export async function applyInstrumentVoice(kind: 'bass' | 'guitar') {
  const sf = await loadVoices()
  const program = kind === 'bass' ? GM.fingerBass : GM.cleanGuitar
  setNoteVoice(sf ? (midi, when, gain) => playVoice(sf, program, midi, when, gain) : null)
}
