import { useEffect, useId, useRef, useState } from 'react'
import { DOUBLE_INLAYS, INLAY_FRETS, stringNumber, type FretPos, type Instrument } from '../theory/instrument'
import { midiName } from '../theory/notes'

export type MarkerTone = 'neutral' | 'target' | 'ok' | 'miss' | 'ghost' | 'root'

export interface Marker extends FretPos {
  label?: string
  tone?: MarkerTone
}

interface Props {
  inst: Instrument
  from?: number
  to?: number
  markers?: Marker[]
  activeStrings?: number[]
  leftHanded?: boolean
  onPick?: (pos: FretPos) => void
  className?: string
  ariaLabel?: string
  /** 'auto' = vertical em telas estreitas (celular em pé), horizontal no resto. */
  orientation?: 'auto' | 'horizontal' | 'vertical'
}

const TONE: Record<MarkerTone, { fill: string; text: string; ring?: string; glow?: boolean }> = {
  neutral: { fill: 'var(--color-pearl)', text: 'var(--color-wood-950)' },
  root: { fill: 'var(--color-enclosure)', text: 'var(--color-wood-950)' },
  target: { fill: 'var(--color-enclosure)', text: 'var(--color-wood-950)', glow: true },
  ok: { fill: 'var(--color-led-green)', text: 'var(--color-wood-950)', glow: true },
  miss: { fill: 'var(--color-led-red)', text: 'var(--color-wood-950)', glow: true },
  ghost: { fill: 'transparent', text: 'var(--color-pearl)', ring: 'var(--color-pearl-dim)' },
}

function useIsNarrow(ref: React.RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 600))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return narrow
}

export function Fretboard({
  inst, from = 0, to = 12, markers = [], activeStrings, leftHanded = false, onPick, className, ariaLabel, orientation = 'auto',
}: Props) {
  const gid = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const narrow = useIsNarrow(wrap)
  const vertical = orientation === 'vertical' || (orientation === 'auto' && narrow)
  const [cursor, setCursor] = useState<FretPos | null>(null)

  const nStrings = inst.openMidi.length
  const showOpen = from === 0
  const firstFret = Math.max(1, from)

  // Geometria abstrata: "along" corre pelo braço (pestana → corpo), "across" atravessa as cordas.
  const STRING_GAP = vertical ? (nStrings > 4 ? 54 : 66) : 42
  const OPEN = vertical ? 46 : 44
  const NUT = 7
  const BASE = vertical ? 58 : 74
  const TAPER = vertical ? 0.985 : 0.965
  const LABEL = vertical ? 26 : 30 // espaço para nome das cordas / número das casas
  const fretLen = (f: number) => BASE * Math.pow(TAPER, f - 1)

  const fretEnd: number[] = []
  let a = showOpen ? OPEN + NUT : 8
  const boardStart = a
  for (let f = firstFret; f <= to; f++) {
    a += fretLen(f)
    fretEnd[f] = a
  }
  const alongLen = a + 8
  const acrossPad = vertical ? 34 : 22
  const acrossLen = acrossPad * 2 + STRING_GAP * (nStrings - 1)

  const cellStart = (f: number) => (f === 0 ? 4 : f === firstFret ? boardStart : fretEnd[f - 1])
  const cellEnd = (f: number) => (f === 0 ? OPEN : fretEnd[f])
  const cellMid = (f: number) => (cellStart(f) + cellEnd(f)) / 2
  // corda 0 (grave): embaixo no horizontal (como tablatura), à esquerda no vertical (como diagrama de acorde)
  const across = (s: number) => acrossPad + STRING_GAP * (vertical ? s : nStrings - 1 - s)

  const width = vertical ? acrossLen : alongLen
  const height = vertical ? alongLen + LABEL : acrossLen + LABEL
  const offA = vertical ? LABEL : 0 // no vertical, os nomes das cordas ficam no topo

  const P = (along: number, acr: number) => {
    let x = vertical ? acr : along
    const y = vertical ? along + offA : acr
    if (leftHanded) x = width - x
    return { x, y }
  }
  /** retângulo alinhado ao braço */
  const R = (a0: number, a1: number, c0: number, c1: number) => {
    const p0 = P(a0, c0)
    const p1 = P(a1, c1)
    return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), width: Math.abs(p1.x - p0.x), height: Math.abs(p1.y - p0.y) }
  }

  const frets = Array.from({ length: to - firstFret + 1 }, (_, i) => firstFret + i)
  const cells = showOpen ? [0, ...frets] : frets
  const dim = (s: number) => !!activeStrings && !activeStrings.includes(s)
  const boardC0 = acrossPad - 12
  const boardC1 = acrossLen - acrossPad + 12
  const midC = acrossLen / 2

  return (
    <div ref={wrap} className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={vertical ? { width: '100%', maxWidth: 380, margin: '0 auto', height: 'auto', display: 'block' } : { width: '100%', minWidth: 560, maxWidth: width * 1.6, margin: '0 auto', height: 'auto', display: 'block' }}
        role={onPick ? 'group' : 'img'}
        aria-label={ariaLabel ?? `Braço: casas ${from} a ${to}`}
      >
        <defs>
          <linearGradient id={`${gid}-wood`} x1="0" y1="0" x2={vertical ? 1 : 0} y2={vertical ? 0 : 1}>
            <stop offset="0" stopColor="#3a2219" />
            <stop offset="0.5" stopColor="#2c1912" />
            <stop offset="1" stopColor="#3a2219" />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* escala de jacarandá */}
        <rect {...R(boardStart, alongLen - 8, boardC0, boardC1)} fill={`url(#${gid}-wood)`} rx={3} />

        {/* inlays de madrepérola */}
        {frets.filter((f) => INLAY_FRETS.includes(f)).map((f) => {
          if (DOUBLE_INLAYS.includes(f)) {
            const d = STRING_GAP * Math.max(1, (nStrings - 1) / 3)
            return (
              <g key={`in${f}`} fill="var(--color-pearl)" opacity={0.85}>
                <circle {...cxy(P(cellMid(f), midC - d))} r={6} />
                <circle {...cxy(P(cellMid(f), midC + d))} r={6} />
              </g>
            )
          }
          return <circle key={`in${f}`} {...cxy(P(cellMid(f), midC))} r={6} fill="var(--color-pearl)" opacity={0.85} />
        })}

        {/* pestana */}
        {showOpen && <rect {...R(OPEN, OPEN + NUT, boardC0, boardC1)} fill="#e9dfcc" rx={1.5} />}

        {/* trastes de níquel */}
        {frets.map((f) => (
          <rect key={`f${f}`} {...R(fretEnd[f] - 1.5, fretEnd[f] + 1.5, boardC0, boardC1)} fill="var(--color-nickel)" opacity={0.9} rx={1} />
        ))}

        {/* cordas: graves mais grossas e cor de bronze */}
        {inst.openMidi.map((_, s) => {
          const thick = 1 + (nStrings - s) * (inst.kind === 'guitar6' ? 0.35 : 0.55)
          const wound = inst.kind !== 'guitar6' || s < 3
          const p0 = P(showOpen ? OPEN - 6 : boardStart, across(s))
          const p1 = P(alongLen - 8, across(s))
          return (
            <line key={`s${s}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}
              stroke={wound ? '#c8b48e' : 'var(--color-nickel)'} strokeWidth={thick} opacity={dim(s) ? 0.25 : 0.95} />
          )
        })}

        {/* nome das cordas */}
        {inst.openMidi.map((m, s) => {
          const p = vertical ? P(-LABEL / 2 - 4, across(s)) : P(showOpen ? 14 : 0, across(s))
          if (!vertical && !showOpen) return null
          return (
            <text key={`n${s}`} x={p.x} y={p.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={vertical ? 13 : 11}
              fill="var(--color-pearl-faint)" opacity={dim(s) ? 0.35 : 1}>
              {midiName(m).replace(/-?\d+$/, '')}
            </text>
          )
        })}

        {/* número das casas */}
        {cells.map((f) => {
          const p = vertical ? P(cellMid(f), 10) : P(cellMid(f), acrossLen + LABEL - 10)
          return (
            <text key={`fn${f}`} x={p.x} y={p.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={vertical ? 10 : 11}
              fill={INLAY_FRETS.includes(f) ? 'var(--color-pearl-dim)' : 'var(--color-pearl-faint)'}>
              {f}
            </text>
          )
        })}

        {/* área clicável: Tab entra no braço, setas andam pelas casas, Enter/Espaço responde */}
        {onPick &&
          inst.openMidi.map((_, s) =>
            cells.map((f) => {
              const disabled = dim(s)
              const pick = () => !disabled && onPick({ string: s, fret: f })
              const firstActive = inst.openMidi.findIndex((_, i) => !dim(i))
              const isCursor = cursor ? cursor.string === s && cursor.fret === f : s === firstActive && f === cells[0]
              const move = (svg: SVGSVGElement | null, ds: number, df: number) => {
                let ns = s
                let nf = f
                do {
                  ns += ds
                } while (ds !== 0 && ns >= 0 && ns < nStrings && dim(ns))
                nf = Math.min(to, Math.max(cells[0], f + df))
                if (ns < 0 || ns >= nStrings) return
                setCursor({ string: ns, fret: nf })
                requestAnimationFrame(() => svg?.querySelector<SVGElement>(`[data-cell="${ns}-${nf}"]`)?.focus())
              }
              // setas seguem o desenho na tela (vertical: ↓ avança casas; horizontal: → avança casas)
              const mirror = leftHanded ? -1 : 1
              const keys: Record<string, [number, number]> = vertical
                ? { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowRight: [mirror, 0], ArrowLeft: [-mirror, 0] }
                : { ArrowRight: [0, mirror], ArrowLeft: [0, -mirror], ArrowUp: [1, 0], ArrowDown: [-1, 0] }
              return (
                <rect
                  key={`hit${s}-${f}`}
                  data-cell={`${s}-${f}`}
                  {...R(cellStart(f), cellEnd(f), across(s) - STRING_GAP / 2, across(s) + STRING_GAP / 2)}
                  fill="transparent"
                  role="button"
                  tabIndex={isCursor && !disabled ? 0 : -1}
                  aria-label={`Corda ${stringNumber(inst, s)}, ${f === 0 ? 'solta' : `casa ${f}`}`}
                  aria-disabled={disabled || undefined}
                  style={{ cursor: disabled ? 'default' : 'pointer' }}
                  className="fret-hit"
                  onClick={pick}
                  onFocus={() => setCursor({ string: s, fret: f })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      pick()
                    } else if (keys[e.key]) {
                      e.preventDefault()
                      move(e.currentTarget.ownerSVGElement, ...keys[e.key])
                    }
                  }}
                />
              )
            }),
          )}

        {/* marcadores */}
        {markers
          .filter((m) => m.fret >= from && m.fret <= to)
          .map((m) => {
            const t = TONE[m.tone ?? 'neutral']
            const { x, y } = P(cellMid(m.fret), across(m.string))
            const r = vertical ? 15 : 13
            return (
              <g key={`m${m.string}-${m.fret}-${m.tone}`} pointerEvents="none" className="marker-pop">
                <circle cx={x} cy={y} r={r} fill={t.fill} stroke={t.ring} strokeWidth={t.ring ? 2 : 0}
                  strokeDasharray={m.tone === 'ghost' ? '3 3' : undefined} filter={t.glow ? `url(#${gid}-glow)` : undefined} />
                {m.label && (
                  <text x={x} y={y + 4.5} textAnchor="middle" fontSize={m.label.length > 2 ? 10 : 13} fontWeight={700} fontFamily="var(--font-sans)" fill={t.text}>
                    {m.label}
                  </text>
                )}
              </g>
            )
          })}
      </svg>
    </div>
  )
}

const cxy = (p: { x: number; y: number }) => ({ cx: p.x, cy: p.y })
