import { midiToFreq } from '../theory/notes'
import { NoteStabilizer, PitchAnalyzer, rms, type PitchReading } from './pitch'

// Um único AudioContext para saída e entrada: os tempos do metrônomo e dos ataques
// detectados ficam no mesmo relógio (ctx.currentTime).

let ctx: AudioContext | null = null
export function audioCtx() {
  if (!ctx) ctx = new AudioContext({ latencyHint: 'interactive' })
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const pluckCache = new Map<number, AudioBuffer>()

/** Corda dedilhada por Karplus-Strong: soa como instrumento de corda, sem samples. */
function pluckBuffer(midi: number): AudioBuffer {
  const c = audioCtx()
  const cached = pluckCache.get(midi)
  if (cached) return cached
  const sr = c.sampleRate
  const freq = midiToFreq(midi)
  const dur = midi < 45 ? 2.2 : 1.6
  const len = Math.floor(sr * dur)
  const buf = c.createBuffer(1, len, sr)
  const out = buf.getChannelData(0)
  const period = Math.max(2, Math.round(sr / freq))
  const ring = new Float32Array(period)
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1
  // graves decaem mais devagar e mais escuros
  const damping = midi < 45 ? 0.996 : 0.994
  let idx = 0
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period
    const v = damping * 0.5 * (ring[idx] + ring[next])
    out[i] = ring[idx]
    ring[idx] = v
    idx = next
  }
  // ataque suave para não estalar
  for (let i = 0; i < 64 && i < len; i++) out[i] *= i / 64
  pluckCache.set(midi, buf)
  return buf
}

export function playNote(midi: number, when = 0, gain = 0.6) {
  const c = audioCtx()
  const src = c.createBufferSource()
  src.buffer = pluckBuffer(midi)
  const g = c.createGain()
  g.gain.value = gain
  // corpo: um passa-baixa leve
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(6000, midiToFreq(midi) * 10)
  src.connect(lp).connect(g).connect(c.destination)
  src.start(when || c.currentTime)
}

export function playSequence(midis: number[], gapSec = 0.35) {
  const c = audioCtx()
  midis.forEach((m, i) => playNote(m, c.currentTime + 0.05 + i * gapSec))
}

/** Toca um intervalo: melódico (uma nota depois da outra) ou harmônico (as duas juntas). */
export function playInterval(root: number, semis: number, harmonic = false) {
  if (harmonic) {
    const c = audioCtx()
    const t = c.currentTime + 0.05
    playNote(root, t, 0.45)
    playNote(root + semis, t, 0.45)
  } else playSequence([root, root + semis], 0.6)
}

export function playClick(when: number, accent = false) {
  const c = audioCtx()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'square'
  osc.frequency.value = accent ? 1760 : 1175
  g.gain.setValueAtTime(0.0001, when)
  g.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, when + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05)
  osc.connect(g).connect(c.destination)
  osc.start(when)
  osc.stop(when + 0.06)
}

/** Sons de interface: curtos e discretos. */
export function uiSound(kind: 'ok' | 'miss' | 'star') {
  const c = audioCtx()
  const t = c.currentTime
  const notes = kind === 'ok' ? [76, 83] : kind === 'star' ? [72, 76, 79, 84] : [52]
  notes.forEach((m, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = kind === 'miss' ? 'triangle' : 'sine'
    osc.frequency.value = midiToFreq(m)
    const at = t + i * 0.07
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(kind === 'miss' ? 0.15 : 0.12, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + (kind === 'miss' ? 0.25 : 0.18))
    osc.connect(g).connect(c.destination)
    osc.start(at)
    osc.stop(at + 0.3)
  })
}

// ---------- Metrônomo ----------

export interface MetronomeHandle {
  startTime: number
  stop: () => void
}

/**
 * Agenda cliques com lookahead (padrão "A Tale of Two Clocks").
 * onBeat recebe o índice do tempo e o horário (ctx) em que ele soa.
 */
export function startMetronome(
  bpm: number,
  beatsPerBar: number,
  onBeat?: (beat: number, time: number) => void,
  opts: { totalBeats?: number; leadIn?: number; clicks?: boolean } = {},
): MetronomeHandle {
  const c = audioCtx()
  const spb = 60 / bpm
  const startTime = c.currentTime + (opts.leadIn ?? 0.15)
  let beat = 0
  let stopped = false
  const tick = () => {
    if (stopped) return
    while (startTime + beat * spb < c.currentTime + 0.12) {
      if (opts.totalBeats !== undefined && beat >= opts.totalBeats) return
      const t = startTime + beat * spb
      if (opts.clicks !== false) playClick(t, beat % beatsPerBar === 0)
      const b = beat
      const delay = Math.max(0, (t - c.currentTime) * 1000)
      setTimeout(() => !stopped && onBeat?.(b, t), delay)
      beat++
    }
  }
  tick()
  const id = setInterval(tick, 25)
  return {
    startTime,
    stop: () => {
      stopped = true
      clearInterval(id)
    },
  }
}

// ---------- Entrada (microfone / pedaleira) ----------

export interface InputDevice {
  id: string
  label: string
}

export async function listInputDevices(): Promise<InputDevice[]> {
  const devs = await navigator.mediaDevices.enumerateDevices()
  return devs
    .filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({ id: d.deviceId, label: d.label || `Entrada ${i + 1}` }))
}

export interface InputListener {
  onReading?: (r: PitchReading | null, level: number) => void
  onNote?: (midi: number, time: number) => void
  onOnset?: (time: number) => void
}

class InputEngine {
  private stream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private buf = new Float32Array(4096)
  private analyzer = new PitchAnalyzer(4096)
  private stabilizer = new NoteStabilizer(3)
  private listeners = new Set<InputListener>()
  private raf = 0
  private lastLevel = 0
  private lastOnset = 0
  deviceId: string | null = null
  sensitivity = 0.01

  get running() {
    return !!this.stream
  }

  private generation = 0

  async start(deviceId?: string | null) {
    if (this.stream && deviceId === this.deviceId) return
    this.stop()
    const gen = this.generation
    const c = audioCtx()
    // Desliga os "melhoramentos" de voz: eles destroem o sinal de instrumento.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    })
    // stop() foi chamado enquanto esperávamos a permissão: descarta este stream
    if (gen !== this.generation) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    this.stream = stream
    this.deviceId = deviceId ?? null
    this.source = c.createMediaStreamSource(this.stream)
    this.analyser = c.createAnalyser()
    this.analyser.fftSize = 4096
    this.source.connect(this.analyser)
    this.analyzer.minRms = this.sensitivity
    this.loop()
  }

  setSensitivity(v: number) {
    this.sensitivity = v
    this.analyzer.minRms = v
  }

  private loop = () => {
    if (!this.analyser) return
    const c = audioCtx()
    this.analyser.getFloatTimeDomainData(this.buf)
    const now = c.currentTime
    // nível dos últimos ~20 ms, para detectar ataques
    const tail = this.buf.subarray(this.buf.length - 1024)
    const level = rms(tail)
    if (level > this.sensitivity * 2 && level > this.lastLevel * 1.8 && now - this.lastOnset > 0.08) {
      this.lastOnset = now
      this.listeners.forEach((l) => l.onOnset?.(now - 512 / c.sampleRate))
    }
    this.lastLevel = level * 0.6 + this.lastLevel * 0.4
    const reading = this.analyzer.analyze(this.buf, c.sampleRate)
    const note = this.stabilizer.push(reading)
    this.listeners.forEach((l) => {
      l.onReading?.(reading, level)
      if (note !== null) l.onNote?.(note, now)
    })
    this.raf = requestAnimationFrame(this.loop)
  }

  subscribe(l: InputListener) {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  stop() {
    this.generation++
    cancelAnimationFrame(this.raf)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.source?.disconnect()
    this.stream = null
    this.analyser = null
    this.source = null
    this.stabilizer.reset()
  }
}

export const input = new InputEngine()
