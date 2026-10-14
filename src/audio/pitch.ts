import { PitchDetector } from 'pitchy'
import { freqToMidiFloat } from '../theory/notes'

export interface PitchReading {
  freq: number
  clarity: number
  midi: number // fracionário
  cents: number // desvio em relação à nota mais próxima
  rms: number
}

export function rms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

/** Envolve o detector McLeod (pitchy) com gate de volume e de clareza. */
export class PitchAnalyzer {
  private detector: PitchDetector<Float32Array>
  constructor(
    public size: number,
    public minClarity = 0.9,
    public minRms = 0.01,
    public minFreq = 28, // abaixo do Si grave do baixo de 5 cordas (30,9 Hz)
    public maxFreq = 1400,
  ) {
    this.detector = PitchDetector.forFloat32Array(size)
    this.detector.minVolumeDecibels = -60
  }

  analyze(buf: Float32Array, sampleRate: number): PitchReading | null {
    const level = rms(buf)
    if (level < this.minRms) return null
    const [freq, clarity] = this.detector.findPitch(buf, sampleRate)
    if (clarity < this.minClarity || freq < this.minFreq || freq > this.maxFreq) return null
    const midi = freqToMidiFloat(freq)
    return { freq, clarity, midi, cents: Math.round((midi - Math.round(midi)) * 100), rms: level }
  }
}

/**
 * Confirma uma nota só depois de N leituras seguidas iguais, e só a emite de novo
 * depois de silêncio ou de outra nota (um ataque novo).
 */
export class NoteStabilizer {
  private candidate: number | null = null
  private count = 0
  private emitted: number | null = null
  private silentFrames = 0

  constructor(public framesToConfirm = 3, public framesToRelease = 2) {}

  push(reading: PitchReading | null): number | null {
    if (!reading) {
      this.silentFrames++
      if (this.silentFrames >= this.framesToRelease) {
        this.emitted = null
        this.candidate = null
        this.count = 0
      }
      return null
    }
    this.silentFrames = 0
    const note = Math.round(reading.midi)
    if (note === this.candidate) this.count++
    else {
      this.candidate = note
      this.count = 1
    }
    if (this.count >= this.framesToConfirm && note !== this.emitted) {
      this.emitted = note
      return note
    }
    return null
  }

  reset() {
    this.candidate = null
    this.emitted = null
    this.count = 0
  }
}
