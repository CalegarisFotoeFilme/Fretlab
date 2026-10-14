import type * as AT from '@coderline/alphatab'
import { Midi } from '@tonejs/midi'

/*
  MIDI → Guitar Pro.

  Os MIDIs exportados pelo Songsterr seguem um padrão útil:
  - cada instrumento começa com uma trilha "cabeçalho" só com o nome (ex.: "Cliff Burton | ... | Bass");
  - as trilhas seguintes, sem nome, trazem as notas de UMA corda cada, com o canal MIDI = índice da corda
    (0 = corda mais aguda). Isso permite recuperar a tablatura exata (corda + casa).
  Para MIDIs de outras fontes (tudo num canal só), as cordas são escolhidas pela posição mais baixa possível.
*/

type AlphaTab = typeof AT

const STANDARD = {
  bass: [43, 38, 33, 28, 23], // G D A E B (aguda → grave)
  guitar: [64, 59, 55, 50, 45, 40, 35], // E B G D A E B
}

export interface ImportedTrackInfo {
  name: string
  program: number
  strings: number
  notes: number
  isBass: boolean
}

export interface MidiImportResult {
  title: string
  artist: string
  bytes: Uint8Array
  tracks: ImportedTrackInfo[]
  skipped: string[]
}

interface RawNote {
  midi: number
  tick: number
  end: number
  string: number // índice a partir da corda mais aguda
}

interface Group {
  name: string
  program: number
  percussion: boolean
  channels: Set<number>
  notes: { midi: number; ticks: number; durationTicks: number; channel: number }[]
}

/** Agrupa as trilhas do MIDI por instrumento (cabeçalho com nome + trilhas de cordas). */
export function groupTracks(midi: Midi): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  const start = (name: string) => {
    current = { name, program: -1, percussion: false, channels: new Set(), notes: [] }
    groups.push(current)
    return current
  }
  midi.tracks.forEach((t) => {
    const named = t.name.trim()
    // toda trilha com nome abre um instrumento novo; as de corda do Songsterr vêm sem nome
    if (named) start(named)
    else if (!current) start(midi.name || `Faixa ${groups.length + 1}`)
    const g = current!
    if (!t.notes.length) return
    if (g.program < 0) g.program = t.instrument.number
    g.percussion ||= t.instrument.percussion || t.channel === 9
    g.channels.add(t.channel)
    for (const n of t.notes) g.notes.push({ midi: n.midi, ticks: n.ticks, durationTicks: n.durationTicks, channel: t.channel })
  })
  return groups.filter((g) => g.notes.length > 0)
}

const isBassProgram = (p: number) => p >= 32 && p <= 39

/** Nome do instrumento a partir do cabeçalho do Songsterr ("Músico | Instrumento | Papel"). */
function trackName(raw: string, isBass: boolean) {
  const parts = raw.split('|').map((s) => s.trim()).filter(Boolean)
  // a ordem varia ("Músico | Papel | Equipamento" ou "Músico | Equipamento | Papel"): acha o papel por palavra-chave
  const role = [...parts.slice(1)].reverse().find((p) => /vocal|voz|guitar|bass|baixo|drum|bateria|key|piano|synth|effect|delay|ensemble/i.test(p))
  if (parts.length >= 2) return `${role ?? parts.at(-1)} (${parts[0]})`
  if (parts.length) return parts[0]
  return isBass ? 'Baixo' : 'Guitarra'
}

/** Define afinação e corda de cada nota. */
export function assignStrings(g: Group) {
  const isBass = isBassProgram(g.program) || Math.min(...g.notes.map((n) => n.midi)) < 36
  const maxCh = Math.max(...g.channels)
  // canal = corda quando há várias trilhas em canais distintos e cada uma cabe numa corda
  const perString = g.channels.size > 1 && maxCh < 7
  let nStrings = isBass ? 4 : 6
  if (perString) nStrings = Math.max(nStrings, maxCh + 1)
  const std = (isBass ? STANDARD.bass : STANDARD.guitar).slice(0, nStrings)
  const tuning = [...std]

  const notes: RawNote[] = []
  if (perString) {
    // afinação: se alguma nota fica abaixo da corda solta padrão, a corda foi afinada mais grave (drop D etc.)
    for (let s = 0; s < nStrings; s++) {
      const low = Math.min(...g.notes.filter((n) => n.channel === s).map((n) => n.midi), Infinity)
      if (low < tuning[s]) tuning[s] = low
    }
    for (const n of g.notes) notes.push({ midi: n.midi, tick: n.ticks, end: n.ticks + n.durationTicks, string: n.channel })
  } else {
    // sem informação de corda: posição mais baixa possível (preferindo a corda mais grave)
    const lowest = Math.min(...g.notes.map((n) => n.midi))
    if (lowest < tuning[nStrings - 1]) tuning[nStrings - 1] = lowest
    for (const n of g.notes) {
      let s = nStrings - 1
      while (s > 0 && n.midi - tuning[s] > 4 && n.midi - tuning[s - 1] >= 0) s--
      notes.push({ midi: n.midi, tick: n.ticks, end: n.ticks + n.durationTicks, string: s })
    }
  }
  return { isBass, nStrings, tuning, notes }
}

// Durações em fusas (1/32) → figura do alphaTab (com ponto quando preciso).
// Quiálteras são aproximadas para a fusa mais próxima.
const DURATION_STEPS: [number, number, number][] = [
  // [fusas, Duration, pontos]
  [32, 1, 0],
  [24, 2, 1],
  [16, 2, 0],
  [12, 4, 1],
  [8, 4, 0],
  [6, 8, 1],
  [4, 8, 0],
  [3, 16, 1],
  [2, 16, 0],
  [1, 32, 0],
]

/** Quebra um comprimento (em fusas) em figuras, respeitando o tempo forte. */
export function splitDuration(start: number, len: number): [number, number][] {
  const out: [number, number][] = []
  let pos = start
  let left = len
  while (left > 0) {
    // contratempo vai até o próximo tempo; tempo 2/4 não atravessa a metade do compasso (leitura mais fácil)
    const maxLen = pos % 8 !== 0 ? 8 - (pos % 8) : pos % 16 !== 0 ? 16 - (pos % 16) : 32
    const step = DURATION_STEPS.find(([n]) => n <= left && n <= maxLen)!
    out.push([step[1], step[2]])
    pos += step[0]
    left -= step[0]
  }
  return out
}

function parseFileName(name: string) {
  // "Metallica-Master_of_Puppets-10-08-2026.mid" → artista "Metallica", título "Master of Puppets"
  const base = name.replace(/\.[^.]+$/, '').replace(/-\d{2}-\d{2}-\d{4}$/, '').replace(/^[0-9a-f]{8}-/, '')
  const [artist, ...rest] = base.split('-')
  const clean = (s: string) => s.replace(/_/g, ' ').trim()
  return rest.length ? { artist: clean(artist), title: clean(rest.join(' - ')) } : { artist: '', title: clean(base) }
}

export function midiToGuitarPro(at: AlphaTab, data: Uint8Array, fileName = 'musica.mid'): MidiImportResult {
  const midi = new Midi(data)
  const ppq = midi.header.ppq
  const grid = ppq / 8 // fusa
  const { title, artist } = parseFileName(fileName)
  const skipped: string[] = []

  const groups = groupTracks(midi).filter((g) => {
    if (g.percussion) skipped.push(`${trackName(g.name, false)} (bateria)`)
    return !g.percussion
  })
  if (!groups.length) throw new Error('Nenhuma faixa de guitarra ou baixo encontrada nesse MIDI.')

  // compassos a partir das fórmulas de compasso
  const sigs = midi.header.timeSignatures.length ? midi.header.timeSignatures : [{ ticks: 0, timeSignature: [4, 4] }]
  const endTick = Math.max(...groups.flatMap((g) => g.notes.map((n) => n.ticks + n.durationTicks)))
  const bars: { start: number; len: number; num: number; den: number }[] = []
  for (let t = 0, si = 0; t < endTick; ) {
    while (si + 1 < sigs.length && sigs[si + 1].ticks <= t) si++
    const [num, den] = sigs[si].timeSignature
    const len = Math.max(1, Math.round((num * 32) / den))
    bars.push({ start: t, len, num, den })
    t += len * grid
  }

  const score = new at.model.Score()
  score.title = title
  score.artist = artist
  const tempos = midi.header.tempos.length ? midi.header.tempos : [{ ticks: 0, bpm: 120 }]
  let lastTempo = -1
  for (const b of bars) {
    const mb = new at.model.MasterBar()
    mb.timeSignatureNumerator = b.num
    mb.timeSignatureDenominator = b.den
    const tempo = Math.round([...tempos].reverse().find((t) => t.ticks <= b.start)!.bpm)
    if (tempo !== lastTempo) {
      mb.tempoAutomations.push(at.model.Automation.buildTempoAutomation(false, 0, tempo, 2))
      lastTempo = tempo
    }
    score.addMasterBar(mb)
  }

  const info: ImportedTrackInfo[] = []
  groups.forEach((g, gi) => {
    const { isBass, nStrings, tuning, notes } = assignStrings(g)
    const track = new at.model.Track()
    track.name = trackName(g.name, isBass)
    track.playbackInfo.program = g.program < 0 ? (isBass ? 33 : 29) : g.program
    // canais 0..15 sem o 9 (bateria); dois por faixa como no Guitar Pro
    const ch = (gi * 2) % 14
    track.playbackInfo.primaryChannel = ch >= 9 ? ch + 1 : ch
    track.playbackInfo.secondaryChannel = ch + 1 >= 9 ? ch + 2 : ch + 1
    const staff = new at.model.Staff()
    staff.stringTuning = new at.model.Tuning('', tuning, false)
    staff.showTablature = true
    staff.showStandardNotation = true
    track.addStaff(staff)
    score.addTrack(track)

    // quantiza na grade de fusas
    const q = notes
      .map((n) => {
        const s = Math.round(n.tick / grid)
        return { ...n, s, e: Math.max(s + 1, Math.round(n.end / grid)) }
      })
      .sort((a, b) => a.s - b.s)

    let barStart = 0
    for (const b of bars) {
      const barEnd = barStart + b.len
      const inBar = q.filter((n) => n.s < barEnd && n.e > barStart)
      const bar = new at.model.Bar()
      staff.addBar(bar)
      const voice = new at.model.Voice()
      bar.addVoice(voice)

      // fatias entre todos os inícios e fins de nota dentro do compasso
      const cuts = new Set<number>([barStart, barEnd])
      for (const n of inBar) {
        cuts.add(Math.max(barStart, n.s))
        cuts.add(Math.min(barEnd, n.e))
      }
      const points = [...cuts].sort((a, b) => a - b)
      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i]
        const to = points[i + 1]
        // uma nota por corda: a mais recente vence
        const byString = new Map<number, (typeof inBar)[number]>()
        for (const n of inBar) if (n.s <= from && n.e >= to) byString.set(n.string, n)
        const pieces = splitDuration(from - barStart, to - from)
        let pieceStart = from
        pieces.forEach(([dur, dots], pi) => {
          const beat = new at.model.Beat()
          beat.duration = dur as AT.model.Duration
          beat.dots = dots
          for (const n of byString.values()) {
            const note = new at.model.Note()
            note.string = nStrings - n.string // 1 = corda mais grave
            note.fret = n.midi - tuning[n.string]
            // continuação de uma nota que começou antes vira ligadura
            if (n.s < pieceStart || pi > 0) note.isTieDestination = true
            beat.addNote(note)
          }
          voice.addBeat(beat)
          pieceStart += DURATION_STEPS.find(([, d, dt]) => d === dur && dt === dots)![0]
        })
      }
      barStart = barEnd
    }
    info.push({ name: track.name, program: track.playbackInfo.program, strings: nStrings, notes: notes.length, isBass })
  })

  const settings = new at.Settings()
  score.finish(settings)
  const bytes = new at.exporter.Gp7Exporter().export(score, settings)
  return { title, artist, bytes, tracks: info, skipped }
}
