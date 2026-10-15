import { eventBeats, type HitResult, type RhythmEvent } from '../exercises/rhythmScore'

// Glifos SMuFL da fonte Bravura (a mesma usada pelo alphaTab).
const G = {
  head: { whole: '', half: '', black: '' },
  rest: { whole: '', half: '', quarter: '', eighth: '', sixteenth: '' },
  flag8: '',
  flag16: '',
  dot: '',
  tuplet3: '',
  headX: '\uE0A9',
}
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6

const GRADE_COLOR: Record<HitResult['grade'], string> = {
  perfect: 'var(--color-led-green)',
  good: 'var(--color-led-green)',
  early: 'var(--color-led-amber)',
  late: 'var(--color-led-amber)',
  miss: 'var(--color-led-red)',
}

interface Props {
  events: RhythmEvent[]
  hits?: (HitResult | null)[] // um por ataque (não-pausa)
  playhead?: number | null // posição em tempos
  beats?: number
  showCounts?: boolean
  /** técnica por ataque (não-pausa): "T"/"P" do slap, "⊓"/"V" da palhetada; "x" = ghost note (cabeça em x) */
  marks?: string[]
}

const BEAT_W = 92
const PAD_L = 26
const LINE_Y = 70
const FS = 40
const SP = FS / 4 // um espaço de pauta

export function RhythmStaff({ events, hits, playhead = null, beats = 4, showCounts = true, marks }: Props) {
  const width = PAD_L * 2 + BEAT_W * beats
  const xOf = (beat: number) => PAD_L + beat * BEAT_W + 6

  // posição de cada evento
  const items: (RhythmEvent & { beat: number; onset: number })[] = []
  for (let i = 0, t = 0, onset = 0; i < events.length; i++) {
    const e = events[i]
    items.push({ ...e, beat: t, onset: e.rest ? -1 : onset++ })
    t += eventBeats(e)
  }

  // agrupa colcheias/semicolcheias do mesmo tempo para a barra de ligação
  const beamGroups: (typeof items)[] = []
  for (const it of items) {
    const short = !it.rest && (it.figure === 'eighth' || it.figure === 'sixteenth')
    const last = beamGroups.at(-1)
    const prev = last?.at(-1)
    if (short && prev && !prev.rest && Math.floor(prev.beat + 1e-6) === Math.floor(it.beat + 1e-6) && near(prev.beat + eventBeats(prev), it.beat) && !!prev.triplet === !!it.triplet) last!.push(it)
    else beamGroups.push([it])
  }
  const beamed = new Set(beamGroups.filter((g) => g.length > 1).flat())
  const stemTop = LINE_Y - SP * 3.5
  // contagem: "1 e 2 e"; com semicolcheias "1 · e ·"; com tercinas "1 · ·"
  const sub = events.some((e) => e.triplet) ? 3 : events.some((e) => e.figure === 'sixteenth' || (e.dotted && e.figure === 'eighth')) ? 4 : 2
  const headW = SP * 1.18

  return (
    <svg viewBox={`0 0 ${width} 118`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Pauta rítmica">
      {/* tempo atual */}
      {playhead !== null && playhead >= 0 && playhead < beats && (
        <rect x={PAD_L + Math.floor(playhead) * BEAT_W} y={18} width={BEAT_W} height={78} rx={8} fill="var(--color-enclosure)" opacity={0.09} />
      )}
      <line x1={PAD_L - 10} x2={width - PAD_L + 10} y1={LINE_Y} y2={LINE_Y} stroke="var(--color-pearl-faint)" strokeWidth={1.2} />
      <line x1={width - PAD_L + 10} x2={width - PAD_L + 10} y1={LINE_Y - 14} y2={LINE_Y + 14} stroke="var(--color-pearl-faint)" strokeWidth={2} />

      {items.map((it, i) => {
        const x = xOf(it.beat)
        const color = it.onset >= 0 && hits?.[it.onset] ? GRADE_COLOR[hits[it.onset]!.grade] : 'var(--color-pearl)'
        if (it.rest) {
          return (
            <text key={i} x={x} y={LINE_Y} fontFamily="Bravura" fontSize={FS} fill="var(--color-pearl-dim)">
              {G.rest[it.figure]}
              {it.dotted ? ` ${G.dot}` : ''}
            </text>
          )
        }
        const mark = it.onset >= 0 ? marks?.[it.onset] : undefined
        const head = mark === 'x' ? G.headX : it.figure === 'whole' ? G.head.whole : it.figure === 'half' ? G.head.half : G.head.black
        const hasStem = it.figure !== 'whole'
        const flag = !beamed.has(it) && (it.figure === 'eighth' ? G.flag8 : it.figure === 'sixteenth' ? G.flag16 : null)
        return (
          <g key={i} fill={color} stroke={color}>
            <text x={x} y={LINE_Y} fontFamily="Bravura" fontSize={FS} stroke="none">
              {head}
            </text>
            {mark && mark !== 'x' && (
              <text x={x + headW / 2} y={14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={13} fontWeight={700} fill="var(--color-enclosure)" stroke="none">
                {mark}
              </text>
            )}
            {it.dotted && (
              <text x={x + headW + SP * 0.5} y={LINE_Y - SP * 0.5} fontFamily="Bravura" fontSize={FS} stroke="none">
                {G.dot}
              </text>
            )}
            {hasStem && <line x1={x + headW - 0.6} x2={x + headW - 0.6} y1={LINE_Y - 2} y2={stemTop} strokeWidth={1.6} />}
            {flag && (
              <text x={x + headW - 1.4} y={stemTop} fontFamily="Bravura" fontSize={FS} stroke="none">
                {flag}
              </text>
            )}
          </g>
        )
      })}

      {/* barras de colcheia/semicolcheia */}
      {beamGroups
        .filter((g) => g.length > 1)
        .map((g, gi) => {
          const x1 = xOf(g[0].beat) + headW - 1.4
          const x2 = xOf(g.at(-1)!.beat) + headW + 0.2
          const both16 = g.every((n) => n.figure === 'sixteenth')
          return (
            <g key={`b${gi}`} fill="var(--color-pearl)">
              <rect x={x1} y={stemTop} width={x2 - x1} height={SP * 0.5} />
              {both16 && <rect x={x1} y={stemTop + SP * 0.75} width={x2 - x1} height={SP * 0.5} />}
              {/* semicolcheia junto de colcheia (pontuada): meia barra só nela */}
              {!both16 &&
                g.map((n, k) =>
                  n.figure === 'sixteenth' ? (
                    <rect key={k} x={k === g.length - 1 ? xOf(n.beat) + headW - 1.4 - SP * 1.2 : xOf(n.beat) + headW - 1.4} y={stemTop + SP * 0.75} width={SP * 1.2} height={SP * 0.5} />
                  ) : null,
                )}
              {g[0].triplet && (
                <text x={(x1 + x2) / 2} y={stemTop - SP * 0.6} textAnchor="middle" fontFamily="Bravura" fontSize={FS * 0.7}>
                  {G.tuplet3}
                </text>
              )}
            </g>
          )
        })}

      {/* contagem "1 e 2 e" */}
      {showCounts &&
        Array.from({ length: beats * sub }, (_, i) => {
          const beat = i / sub
          const on = playhead !== null && Math.floor(playhead * sub) === i
          const main = i % sub === 0
          return (
            <text
              key={`c${i}`}
              x={xOf(beat) + headW / 2}
              y={108}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={main ? 13 : 11}
              fontWeight={main ? 600 : 400}
              fill={on ? 'var(--color-enclosure)' : main ? 'var(--color-pearl-dim)' : 'var(--color-pearl-faint)'}
            >
              {main ? Math.floor(beat) + 1 : sub === 2 || (sub === 4 && i % sub === 2) ? 'e' : '·'}
            </text>
          )
        })}
    </svg>
  )
}
