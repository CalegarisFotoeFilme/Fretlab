import type * as AT from '@coderline/alphatab'
import { Midi } from '@tonejs/midi'

/*
  MIDI → Guitar Pro.

  Os MIDIs exportados pelo Songsterr seguem um padrão útil:
  - um instrumento pode começar com uma trilha "cabeçalho" só com o nome (ex.: "Cliff Burton | ... | Bass"),
    mas nem sempre: às vezes o instrumento vem sem nome nenhum;
  - as trilhas seguintes trazem as notas de UMA corda cada, com o canal MIDI = índice da corda
    (0 = corda mais aguda). Isso permite recuperar a tablatura exata (corda + casa);
  - a bateria vem no canal 10 (índice 9), também podendo vir sem nome.
  Para MIDIs de outras fontes (tudo num canal só), as cordas são escolhidas pela posição mais baixa possível.

  O ritmo é reconstruído tempo a tempo: cada semínima recebe a subdivisão mais simples que explica as notas
  (binária até 64 avos, ou quiálteras de 3, 5, 6, 7 e 12). Acordes "rasgueados" (cordas defasadas por poucos
  ticks) voltam a ser um acorde só, com o efeito de rasgueado.
*/

type AlphaTab = typeof AT

const STANDARD = {
  bass: [43, 38, 33, 28, 23], // G D A E B (aguda → grave)
  guitar: [64, 59, 55, 50, 45, 40, 35], // E B G D A E B
}

/** Unidades por semínima: múltiplo comum de todas as subdivisões aceitas (16, 12, 5, 7). */
export const R = 1680
const U64 = R / 16 // uma semifusa (1/64)

/** Subdivisões da semínima, da mais simples para a mais complexa. */
const DIVISIONS = [1, 2, 4, 3, 8, 6, 16, 12, 5, 7]
const isBinary = (d: number) => (d & (d - 1)) === 0

export interface ImportedTrackInfo {
  name: string
  program: number
  strings: number
  notes: number
  isBass: boolean
  isPercussion: boolean
}

export interface MidiImportResult {
  title: string
  artist: string
  bytes: Uint8Array
  tracks: ImportedTrackInfo[]
  /** Mantido por compatibilidade: hoje nenhuma faixa com notas é descartada. */
  skipped: string[]
}

interface MidiNote {
  midi: number
  ticks: number
  durationTicks: number
  velocity: number
  channel: number
  /** curva de pitch bend durante a nota: [tick, semitons] */
  bends: [number, number][]
}

export interface Group {
  name: string
  program: number
  percussion: boolean
  channels: Set<number>
  notes: MidiNote[]
}

/**
 * Agrupa as trilhas do MIDI por instrumento. Começa um instrumento novo quando aparece um nome,
 * quando muda o timbre (programa), quando entra ou sai a bateria, ou quando um canal (corda) se repete.
 */
export function groupTracks(midi: Midi): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  let pendingName = ''
  midi.tracks.forEach((t) => {
    const named = t.name.trim()
    if (named) {
      pendingName = named
      current = null
    }
    if (!t.notes.length) return
    const percussion = t.instrument.percussion || t.channel === 9
    const program = t.instrument.number
    const g = current as Group | null
    if (!g || g.percussion !== percussion || (!percussion && (g.program !== program || g.channels.has(t.channel)))) {
      current = { name: pendingName, program, percussion, channels: new Set(), notes: [] }
      pendingName = ''
      groups.push(current)
    }
    const cur = current!
    cur.channels.add(t.channel)
    // faixa do pitch bend (RPN 0, data entry = CC 6); o Songsterr usa ±24 semitons
    const range = t.controlChanges[6]?.length ? Math.round(t.controlChanges[6][0].value * 127) || 2 : 2
    const pb = t.pitchBends
    let k = 0
    for (const n of t.notes) {
      const end = n.ticks + n.durationTicks
      while (k < pb.length && pb[k].ticks < n.ticks) k++
      // valor em vigor no ataque (bend prévio) + mudanças durante a nota
      const before = k > 0 ? pb[k - 1].value * range : 0
      const bends: [number, number][] = before ? [[n.ticks, before]] : []
      for (let j = k; j < pb.length && pb[j].ticks < end; j++) bends.push([pb[j].ticks, pb[j].value * range])
      cur.notes.push({ midi: n.midi, ticks: n.ticks, durationTicks: n.durationTicks, velocity: n.velocity, channel: t.channel, bends })
    }
  })
  return groups
}

const isBassProgram = (p: number) => p >= 32 && p <= 39

// famílias General MIDI (programa / 8), para instrumentos sem nome
const GM_FAMILIES = ['Piano', 'Percussão melódica', 'Órgão', 'Guitarra', 'Baixo', 'Cordas', 'Ensemble', 'Metais', 'Palhetas', 'Sopros', 'Synth lead', 'Synth pad', 'Efeitos de synth', 'Étnico', 'Percussão', 'Efeitos']

/** Nome do instrumento a partir do cabeçalho do Songsterr ("Músico | Instrumento | Papel"). */
function trackName(g: Group, isBass: boolean) {
  const parts = g.name.split('|').map((s) => s.trim()).filter(Boolean)
  // a ordem varia ("Músico | Papel | Equipamento" ou "Músico | Equipamento | Papel"): acha o papel por palavra-chave
  const role = [...parts.slice(1)].reverse().find((p) => /vocal|voz|guitar|bass|baixo|drum|bateria|key|piano|synth|effect|delay|ensemble/i.test(p))
  if (parts.length >= 2) return `${role ?? parts.at(-1)} (${parts[0]})`
  if (parts.length) return parts[0]
  if (g.percussion) return 'Bateria'
  if (isBass) return 'Baixo'
  return GM_FAMILIES[Math.floor(g.program / 8)] ?? 'Guitarra'
}

export interface RawNote {
  midi: number
  tick: number
  end: number
  /** corda (índice a partir da mais aguda) ou, na bateria, a peça (nota MIDI) */
  key: number
  velocity: number
  bends: [number, number][]
  slideOut?: 'shift' | 'legato' | 'up' | 'down'
  slideIn?: 'below' | 'above'
  vibrato?: boolean
  hammer?: boolean
  dead?: boolean
  staccato?: boolean
}

/** Define afinação e corda de cada nota. */
export function assignStrings(g: Group) {
  const isBass = isBassProgram(g.program) || Math.min(...g.notes.map((n) => n.midi)) < 36
  const maxCh = Math.max(...g.channels)
  // canal = corda quando há várias trilhas em canais distintos e cada uma cabe numa corda
  const perString = g.channels.size > 1 && maxCh < 8
  let nStrings = isBass ? 4 : 6
  if (perString) nStrings = Math.max(nStrings, maxCh + 1)
  const std = (isBass ? STANDARD.bass : STANDARD.guitar).slice(0, nStrings)
  const tuning = [...std]
  // cordas além do padrão (ex.: 8 cordas): uma quarta abaixo da anterior
  while (tuning.length < nStrings) tuning.push(tuning.at(-1)! - 5)

  const notes: RawNote[] = []
  const raw = (n: MidiNote, key: number): RawNote => ({ midi: n.midi, tick: n.ticks, end: n.ticks + n.durationTicks, key, velocity: n.velocity, bends: n.bends })
  if (perString) {
    // afinação: se alguma nota fica abaixo da corda solta padrão, a corda foi afinada mais grave (drop D etc.)
    for (let s = 0; s < nStrings; s++) {
      const low = Math.min(...g.notes.filter((n) => n.channel === s).map((n) => n.midi), Infinity)
      if (low < tuning[s]) tuning[s] = low
    }
    for (const n of g.notes) notes.push(raw(n, n.channel))
  } else {
    // sem informação de corda: posição mais baixa possível (preferindo a corda mais grave)
    const lowest = Math.min(...g.notes.map((n) => n.midi))
    if (lowest < tuning[nStrings - 1]) tuning[nStrings - 1] = lowest
    for (const n of g.notes) {
      let s = nStrings - 1
      while (s > 0 && n.midi - tuning[s] > 4 && n.midi - tuning[s - 1] >= 0) s--
      notes.push(raw(n, s))
    }
  }
  return { isBass, nStrings, tuning, notes }
}

// Figuras binárias em semifusas (1/64) → [semifusas, Duration do alphaTab, pontos].
const BINARY_STEPS: [number, number, number][] = [
  [64, 1, 0],
  [48, 2, 1],
  [32, 2, 0],
  [24, 4, 1],
  [16, 4, 0],
  [12, 8, 1],
  [8, 8, 0],
  [6, 16, 1],
  [4, 16, 0],
  [3, 32, 1],
  [2, 32, 0],
  [1, 64, 0],
]

/** Quebra um comprimento (em semifusas, a partir de `start` no compasso) em figuras, respeitando o tempo. */
export function splitDuration(start: number, len: number): [number, number][] {
  const out: [number, number][] = []
  let pos = start
  let left = len
  // se uma figura só (com ou sem ponto) cobre tudo, ela é usada, como no Guitar Pro (síncope)
  const single = BINARY_STEPS.find(([n]) => n === len)
  if (single) return [[single[1], single[2]]]
  while (left > 0) {
    // contratempo vai até o próximo tempo; tempo 2/4 não atravessa a metade do compasso (leitura mais fácil)
    const maxLen = pos % 16 !== 0 ? 16 - (pos % 16) : pos % 32 !== 0 ? 32 - (pos % 32) : 64
    // já no tempo, o resto numa figura só (ex.: mínima pontuada começando no 2º tempo)
    const whole = pos % 16 === 0 ? BINARY_STEPS.find(([n]) => n === left) : undefined
    const step = whole ?? BINARY_STEPS.find(([n]) => n <= left && n <= maxLen)!
    out.push([step[1], step[2]])
    pos += step[0]
    left -= step[0]
  }
  return out
}

/**
 * Quebra `k` fatias de uma quiáltera em figuras. A fatia vale a figura `base` (ex.: 16 = semicolcheia
 * de sextina). Devolve [fatias, Duration, pontos].
 */
export function splitTuplet(k: number, base: number): [number, number, number][] {
  const steps: [number, number, number][] = (
    [
      [8, base / 8, 0],
      [6, base / 4, 1],
      [4, base / 4, 0],
      [3, base / 2, 1],
      [2, base / 2, 0],
      [1, base, 0],
    ] as [number, number, number][]
  ).filter(([, d]) => Number.isInteger(d) && d >= 1)
  const out: [number, number, number][] = []
  while (k > 0) {
    const s = steps.find(([u]) => u <= k)!
    out.push(s)
    k -= s[0]
  }
  return out
}

/** Escolhe a subdivisão mais simples da semínima que explica os ataques (posições relativas, 0..1). */
export function chooseDivision(rel: number[], len = 1, tol = 1 / 64): number {
  const candidates = len < 1 ? DIVISIONS.filter(isBinary) : DIVISIONS
  let best = 16
  let bestErr = Infinity
  for (const d of candidates) {
    const err = Math.max(0, ...rel.map((r) => Math.abs(r * d - Math.round(r * d)) / d))
    if (err <= tol) return d
    if (err < bestErr) [best, bestErr] = [d, err]
  }
  return best
}

function parseFileName(name: string) {
  // "Metallica-Master_of_Puppets-10-08-2026.mid" → artista "Metallica", título "Master of Puppets"
  const base = name.replace(/\.[^.]+$/, '').replace(/-\d{2}-\d{2}-\d{4}$/, '').replace(/^[0-9a-f]{8}-/, '')
  const [artist, ...rest] = base.split('-')
  const clean = (s: string) => s.replace(/_/g, ' ').trim()
  return rest.length ? { artist: clean(artist), title: clean(rest.join(' - ')) } : { artist: '', title: clean(base) }
}

interface BarInfo {
  tick: number
  ticks: number
  unit: number // início em unidades R
  units: number
  num: number
  den: number
}

interface BeatSlot {
  tick: number
  ticks: number
  unit: number
  units: number
  d: number
}

/*
  O MIDI do Songsterr "toca" as articulações em vez de descrevê-las. Aqui elas voltam a ser notação:
  - slide longo: escala cromática de notas curtíssimas entre a nota de origem e o alvo;
  - slide de um semitom: rampa de pitch bend no fim da nota, chegando na nota seguinte;
  - bend: curva de pitch bend durante a nota; vibrato: curva que oscila.
  Alvo de slide mais fraco que a origem = legato (não palhetado).
*/
export function articulate(input: RawNote[], ppq: number): RawNote[] {
  const tol = ppq / 64
  // notas de slide do Songsterr: curtas, todas iguais e não palhetadas (mais fracas que a nota de referência)
  const short = ppq / 8
  const out: RawNote[] = []
  const byKey = new Map<number, RawNote[]>()
  for (const n of input) byKey.set(n.key, [...(byKey.get(n.key) ?? []), { ...n }])
  for (const list of byKey.values()) {
    list.sort((a, b) => a.tick - b.tick || a.end - b.end)
    const drop = new Set<RawNote>()
    // 1) escalas cromáticas curtas = slides
    for (let i = 0; i < list.length; i++) {
      const first = list[i]
      // duração zero é a nota de origem de um slide, não parte dele
      if (first.end - first.tick > short || first.end - first.tick < tol) continue
      let j = i
      let dir = 0
      while (j + 1 < list.length) {
        const a = list[j]
        const b = list[j + 1]
        const step = b.midi - a.midi
        if (b.end - b.tick > short || b.end - b.tick < tol || Math.abs(b.end - b.tick - (first.end - first.tick)) > tol || Math.abs(b.tick - a.end) > tol || Math.abs(step) !== 1 || (dir && step !== dir)) break
        dir = step
        j++
      }
      if (j === i || !dir) continue
      const run = list.slice(i, j + 1)
      const runStart = first.tick
      const runEnd = run.at(-1)!.end
      const target = list.find((n) => !drop.has(n) && Math.abs(n.tick - runEnd) <= tol && n.midi === run.at(-1)!.midi + dir)
      const origin = [...list.slice(0, i)].reverse().find((n) => !drop.has(n) && n.midi === first.midi - dir && (Math.abs(n.end - runStart) <= tol || Math.abs(n.tick - runStart) <= tol))
      const ref = (origin ?? target)?.velocity ?? 0
      if (!run.every((n) => n.velocity <= ref)) continue
      if (origin) {
        origin.end = runEnd
        origin.slideOut = target ? (target.velocity < origin.velocity ? 'legato' : 'shift') : dir > 0 ? 'up' : 'down'
      } else if (target) target.slideIn = dir > 0 ? 'below' : 'above'
      else continue
      for (const n of run) drop.add(n)
      i = j
    }
    const kept = list.filter((n) => !drop.has(n))
    // uma corda só soa uma nota por vez: a anterior acaba quando a próxima começa
    for (let i = 0; i + 1 < kept.length; i++) if (kept[i].end > kept[i + 1].tick && kept[i + 1].tick > kept[i].tick) kept[i].end = kept[i + 1].tick
    // 2) curvas de pitch bend
    kept.forEach((n, i) => {
      const curve = n.bends.filter(([t]) => t < n.end)
      if (!curve.some(([, v]) => Math.abs(v) > 0.05)) {
        n.bends = []
        return
      }
      const len = n.end - n.tick
      const final = curve.at(-1)![1]
      const startsAtZero = Math.abs(curve.find(([t]) => t >= n.tick)?.[1] ?? 0) < 0.05 && (curve[0][0] > n.tick || Math.abs(curve[0][1]) < 0.05)
      const firstMove = curve.find(([, v]) => Math.abs(v) > 0.05)![0]
      const monotonic = curve.every(([, v], k) => k === 0 || Math.sign(v - curve[k - 1][1]) !== -Math.sign(final) || Math.abs(v - curve[k - 1][1]) < 0.02)
      const next = kept[i + 1]
      // rampa só no fim da nota, até um semitom inteiro: é slide para a próxima nota
      if (startsAtZero && monotonic && firstMove - n.tick >= len * 0.5 && Math.abs(final - Math.round(final)) < 0.1 && Math.round(final) !== 0) {
        const goal = n.midi + Math.round(final)
        if (next && Math.abs(next.tick - n.end) <= tol && next.midi === goal) n.slideOut = next.velocity < n.velocity ? 'legato' : 'shift'
        else n.slideOut = final > 0 ? 'up' : 'down'
        n.bends = []
        return
      }
      // vibrato: oscila várias vezes com amplitude pequena
      let turns = 0
      let prevDir = 0
      for (let k = 1; k < curve.length; k++) {
        const d = Math.sign(curve[k][1] - curve[k - 1][1])
        if (d && prevDir && d !== prevDir) turns++
        if (d) prevDir = d
      }
      const amp = Math.max(...curve.map(([, v]) => Math.abs(v)))
      if (turns >= 4 && amp <= 1) {
        n.vibrato = true
        n.bends = []
      }
    })
    // 3) ligado (hammer-on/pull-off): nota seguinte na mesma corda, sem pausa e mais fraca que a última
    //    nota palhetada (numa sequência de ligados, todas as notas ligadas têm o mesmo volume)
    let picked = kept[0]?.velocity ?? 0
    for (let i = 0; i + 1 < kept.length; i++) {
      const a = kept[i]
      const b = kept[i + 1]
      const legato = !a.slideOut && b.midi !== a.midi && Math.abs(b.tick - a.end) <= tol && b.velocity < picked * 0.85
      if (legato) a.hammer = true
      else picked = b.velocity
    }
    out.push(...kept)
  }
  out.sort((a, b) => a.tick - b.tick)

  // 4) duração escrita × duração tocada, comparando com o próximo ataque da faixa:
  //    soando a metade = staccato; soando quase nada = nota morta (x)
  const onsets = [...new Set(out.map((n) => n.tick))].sort((a, b) => a - b)
  let k = 0
  for (const n of out) {
    while (k < onsets.length && onsets[k] <= n.tick + tol) k++
    const next = onsets[k]
    if (next === undefined) continue
    const ioi = next - n.tick
    const len = n.end - n.tick
    if (n.slideOut || n.hammer || n.bends.length) continue
    if (len < ppq * 0.05 && len >= tol) {
      n.dead = true
      n.end = n.tick + Math.min(ioi, ppq)
    } else if (ioi >= ppq / 4 && Math.abs(len - ioi / 2) <= tol) {
      n.staccato = true
      n.end = next
    }
  }
  return out
}

/** Reduz uma curva [posição, valor] mantendo a forma (Ramer–Douglas–Peucker). */
export function simplifyCurve(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length <= 2) return pts
  const [x0, y0] = pts[0]
  const [x1, y1] = pts.at(-1)!
  let worst = 0
  let at = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    const yLine = x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    const d = Math.abs(y - yLine)
    if (d > worst) [worst, at] = [d, i]
  }
  if (worst <= eps) return [pts[0], pts.at(-1)!]
  return [...simplifyCurve(pts.slice(0, at + 1), eps).slice(0, -1), ...simplifyCurve(pts.slice(at), eps)]
}

export interface MidiScore {
  title: string
  artist: string
  score: AT.model.Score
  tracks: ImportedTrackInfo[]
}

/** Converte e exporta como Guitar Pro 7 (o GP7 guarda no máximo 4 pontos por bend). */
export function midiToGuitarPro(at: AlphaTab, data: Uint8Array, fileName = 'musica.mid'): MidiImportResult {
  const { title, artist, score, tracks } = midiToScore(at, data, fileName)
  const bytes = new at.exporter.Gp7Exporter().export(score, new at.Settings())
  return { title, artist, bytes, tracks, skipped: [] }
}

/** Converte o MIDI direto para o modelo do alphaTab, sem perdas de arquivo intermediário. */
export function midiToScore(at: AlphaTab, data: Uint8Array, fileName = 'musica.mid'): MidiScore {
  const midi = new Midi(data)
  const ppq = midi.header.ppq
  const { title, artist } = parseFileName(fileName)

  const groups = groupTracks(midi)
  if (!groups.length) throw new Error('Nenhuma nota encontrada nesse MIDI.')

  // compassos a partir das fórmulas de compasso
  const sigs = midi.header.timeSignatures.length ? midi.header.timeSignatures : [{ ticks: 0, timeSignature: [4, 4] }]
  const endTick = Math.max(...groups.flatMap((g) => g.notes.map((n) => n.ticks + n.durationTicks)))
  const bars: BarInfo[] = []
  for (let t = 0, u = 0, si = 0; t < endTick; ) {
    while (si + 1 < sigs.length && sigs[si + 1].ticks <= t) si++
    const [num, den] = sigs[si].timeSignature
    const ticks = Math.max(1, Math.round((num * 4 * ppq) / den))
    const units = Math.round((num * 4 * R) / den)
    bars.push({ tick: t, ticks, unit: u, units, num, den })
    t += ticks
    u += units
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
    // andamento no começo do compasso e mudanças no meio dele, na posição exata
    const before = [...tempos].reverse().find((t) => t.ticks <= b.tick) ?? tempos[0]
    const changes = [before, ...tempos.filter((t) => t.ticks > b.tick && t.ticks < b.tick + b.ticks)]
    for (const t of changes) {
      const bpm = Math.round(t.bpm * 100) / 100
      if (bpm === lastTempo) continue
      const ratio = Math.max(0, (t.ticks - b.tick) / b.ticks)
      mb.tempoAutomations.push(at.model.Automation.buildTempoAutomation(false, ratio, bpm, 2))
      lastTempo = bpm
    }
    score.addMasterBar(mb)
  }

  // tempos (semínimas) de cada compasso; o último pode ser parcial (ex.: 7/8)
  const beats: BeatSlot[] = []
  for (const b of bars)
    for (let u = 0; u < b.units; u += R) {
      const units = Math.min(R, b.units - u)
      beats.push({ tick: b.tick + (u / R) * ppq, ticks: (units / R) * ppq, unit: b.unit + u, units, d: 1 })
    }
  const beatAt = (tick: number) => {
    let lo = 0
    let hi = beats.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (beats[mid].tick <= tick) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  const info: ImportedTrackInfo[] = []
  let channel = 0
  groups.forEach((g) => {
    const drums = g.percussion
    const strings = drums ? null : assignStrings(g)
    const isBass = strings?.isBass ?? false
    const notes: RawNote[] = strings
      ? articulate(strings.notes, ppq)
      : g.notes.map((n) => ({ midi: n.midi, tick: n.ticks, end: n.ticks + n.durationTicks, key: n.midi, velocity: n.velocity, bends: [] }))

    const track = new at.model.Track()
    track.name = trackName(g, isBass)
    const staff = new at.model.Staff()
    if (drums) {
      track.playbackInfo.program = 0
      track.playbackInfo.primaryChannel = 9
      track.playbackInfo.secondaryChannel = 9
      staff.isPercussion = true
      staff.showTablature = false
      staff.showStandardNotation = true
    } else {
      track.playbackInfo.program = g.program
      // canais 0..15 sem o 9 (bateria); dois por faixa como no Guitar Pro
      const next = () => {
        const c = channel++ % 15
        return c >= 9 ? c + 1 : c
      }
      track.playbackInfo.primaryChannel = next()
      track.playbackInfo.secondaryChannel = next()
      staff.stringTuning = new at.model.Tuning('', strings!.tuning, false)
      staff.showTablature = true
      staff.showStandardNotation = true
    }
    track.addStaff(staff)
    score.addTrack(track)

    // 1) rasgueado: ataques em cordas diferentes, muito próximos, viram um acorde
    const strumTol = ppq / 24
    const sorted = [...notes].sort((a, b) => a.tick - b.tick)
    const strum = new Map<RawNote, { start: number; spread: number; down: boolean }>()
    for (let i = 0; i < sorted.length; ) {
      const first = sorted[i]
      const cluster = [first]
      let j = i + 1
      while (j < sorted.length && sorted[j].tick - first.tick <= strumTol && !cluster.some((c) => c.key === sorted[j].key)) cluster.push(sorted[j++])
      const spread = cluster.at(-1)!.tick - first.tick
      // "para baixo" = começa pela corda mais grave
      const down = cluster.length > 1 && cluster[0].midi <= cluster.at(-1)!.midi
      for (const n of cluster) strum.set(n, { start: first.tick, spread, down })
      i = j
    }

    // 2) subdivisão de cada tempo, a partir dos ataques que caem nele
    const slots = beats.map((b) => ({ ...b, rel: [] as number[] }))
    const tol = ppq / 64
    for (const n of sorted) {
      const t = strum.get(n)!.start
      const bi = beatAt(t + tol)
      slots[bi].rel.push((t - slots[bi].tick) / ppq)
    }
    for (const s of slots) s.d = s.rel.length ? chooseDivision(s.rel, s.units / R) : 1

    // 3) posições em unidades R
    const snap = (tick: number, forEnd: boolean) => {
      const bi = beatAt(tick + tol)
      const s = slots[bi]
      // fins de nota em tempos binários usam a grade fina (1/64), para não encurtar/alongar notas
      const d = forEnd && isBinary(s.d) ? 16 : s.d
      const step = R / d
      const k = Math.round(((tick - s.tick) / ppq) * d)
      return Math.min(s.unit + s.units, s.unit + Math.max(0, k) * step)
    }
    type Q = RawNote & { s: number; e: number; spread: number; down: boolean }
    // posição (em unidades) de um tick dentro da nota, para distribuir o bend entre as ligaduras
    const unitOf = (n: Q, tick: number) => n.s + ((tick - n.tick) / Math.max(1, n.end - n.tick)) * (n.e - n.s)
    const q: Q[] = sorted.map((n) => {
      const st = strum.get(n)!
      const s = snap(st.start, false)
      const bi = beatAt(st.start + tol)
      const minLen = isBinary(slots[bi].d) ? U64 : R / slots[bi].d
      return { ...n, s, e: Math.max(s + minLen, snap(n.end, true)), spread: st.spread, down: st.down }
    })
    if (drums) {
      // bateria: cada ataque dura até o próximo ataque (no máximo até o fim do tempo), sem ligaduras
      const starts = [...new Set(q.map((n) => n.s))].sort((a, b) => a - b)
      let k = 0
      for (const n of q) {
        while (starts[k] <= n.s) k++
        const s = slots.findLast((x) => x.unit <= n.s)!
        n.e = Math.min(s.unit + s.units, starts[k] ?? Infinity)
      }
    }

    // 4) compassos → beats do alphaTab
    let ni = 0
    let beatIdx = 0
    for (const b of bars) {
      const barStart = b.unit
      const barEnd = b.unit + b.units
      while (ni < q.length && q[ni].e <= barStart) ni++
      const inBar: Q[] = []
      for (let k = ni; k < q.length && q[k].s < barEnd; k++) if (q[k].e > barStart) inBar.push(q[k])
      // tempos deste compasso
      const bSlots: (typeof slots)[number][] = []
      while (beatIdx < slots.length && slots[beatIdx].unit < barEnd) bSlots.push(slots[beatIdx++])

      const bar = new at.model.Bar()
      staff.addBar(bar)
      const voice = new at.model.Voice()
      bar.addVoice(voice)

      const cuts = new Set<number>([barStart, barEnd])
      for (const n of inBar) {
        cuts.add(Math.max(barStart, n.s))
        cuts.add(Math.min(barEnd, n.e))
      }
      // quiálteras ficam contidas no próprio tempo
      for (const s of bSlots)
        if (!isBinary(s.d)) {
          cuts.add(s.unit)
          cuts.add(s.unit + s.units)
        }
      const points = [...cuts].sort((a, b) => a - b)

      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i]
        const to = points[i + 1]
        const slot = bSlots.find((s) => from >= s.unit && from < s.unit + s.units)!
        // uma nota por corda (ou peça da bateria): a mais recente vence
        const active = new Map<number, Q>()
        for (const n of inBar) if (n.s <= from && n.e >= to && (!drums || n.s === from)) active.set(n.key, n)

        let pieces: { dur: number; dots: number; len: number; tuplet?: [number, number] }[]
        if (isBinary(slot.d)) {
          pieces = splitDuration((from - barStart) / U64, (to - from) / U64).map(([dur, dots]) => ({
            dur,
            dots,
            len: BINARY_STEPS.find(([, d, dt]) => d === dur && dt === dots)![0] * U64,
          }))
        } else {
          const den = 2 ** Math.floor(Math.log2(slot.d)) // 3→2, 5/6/7→4, 12→8
          const step = R / slot.d
          pieces = splitTuplet(Math.round((to - from) / step), 4 * den).map(([k, dur, dots]) => ({ dur, dots, len: k * step, tuplet: [slot.d, den] }))
        }

        let pieceStart = from
        for (const p of pieces) {
          const beat = new at.model.Beat()
          beat.duration = p.dur as AT.model.Duration
          beat.dots = p.dots
          if (p.tuplet) {
            beat.tupletNumerator = p.tuplet[0]
            beat.tupletDenominator = p.tuplet[1]
          }
          let brush: Q | null = null
          for (const n of active.values()) {
            const note = new at.model.Note()
            if (drums) {
              note.percussionArticulation = n.midi
            } else {
              note.string = strings!.nStrings - n.key // 1 = corda mais grave
              note.fret = n.midi - strings!.tuning[n.key]
            }
            const pieceEnd = pieceStart + p.len
            // continuação de uma nota que começou antes vira ligadura
            if (n.s < pieceStart) note.isTieDestination = true
            else {
              if (n.spread > 0 && active.size > 1) brush = n
              if (n.slideIn) note.slideInType = n.slideIn === 'below' ? at.model.SlideInType.IntoFromBelow : at.model.SlideInType.IntoFromAbove
            }
            if (n.slideOut && n.e <= pieceEnd)
              note.slideOutType = { shift: at.model.SlideOutType.Shift, legato: at.model.SlideOutType.Legato, up: at.model.SlideOutType.OutUp, down: at.model.SlideOutType.OutDown }[n.slideOut]
            if (n.vibrato) note.vibrato = at.model.VibratoType.Slight
            if (n.dead) note.isDead = true
            if (n.staccato) note.isStaccato = true
            if (n.hammer && n.e <= pieceEnd) note.isHammerPullOrigin = true
            if (n.bends.length) addBend(at, note, n, pieceStart, pieceEnd, unitOf)
            beat.addNote(note)
          }
          if (brush) {
            beat.brushType = brush.down ? at.model.BrushType.BrushDown : at.model.BrushType.BrushUp
            beat.brushDuration = Math.round((brush.spread / ppq) * 960)
          }
          voice.addBeat(beat)
          pieceStart += p.len
        }
      }
    }
    info.push({
      name: track.name,
      program: track.playbackInfo.program,
      strings: strings?.nStrings ?? 0,
      notes: notes.length,
      isBass,
      isPercussion: drums,
    })
  })

  score.finish(new at.Settings())
  return { title, artist, score, tracks: info }
}

/** Recorta a curva de pitch bend da nota para o trecho [from, to) (em unidades) e grava como pontos de bend. */
function addBend<N extends RawNote & { s: number; e: number }>(
  at: AlphaTab,
  note: AT.model.Note,
  n: N,
  from: number,
  to: number,
  unitOf: (n: N, tick: number) => number,
) {
  const curve = n.bends.map(([t, v]) => [unitOf(n, t), v] as [number, number])
  const valueAt = (u: number) => {
    let v = 0
    for (const [x, y] of curve) if (x <= u) v = y
    return v
  }
  // offsets do alphaTab: 0..60 ao longo da duração da figura; valores em quartos de tom
  const pts: [number, number][] = [[0, valueAt(from)]]
  for (const [x, y] of curve) if (x > from && x < to) pts.push([((x - from) / (to - from)) * 60, y])
  pts.push([60, valueAt(to - 1e-6)])
  if (pts.every(([, v]) => Math.abs(v) < 0.05)) return
  for (const [x, y] of simplifyCurve(pts, 0.15)) note.addBendPoint(new at.model.BendPoint(Math.round(x), Math.round(y * 2)))
}
