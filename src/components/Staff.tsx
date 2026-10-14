import { ledgerSteps, staffNote, type Clef } from '../theory/staff'

// Glifos SMuFL da Bravura: clave de sol/fá com o "8" embaixo, semibreve e acidentes.
const G = {
  treble: '', // gClef8vb
  bass: '', // fClef8vb
  whole: '',
  sharp: '',
  flat: '',
}

const SP = 14 // um espaço da pauta
const FS = SP * 4 // tamanho da fonte SMuFL: 1 em = 4 espaços
const TOP = 70 // y da linha de cima
const MID = TOP + SP * 2 // linha do meio
const NOTE_GAP = 74

export interface StaffItem {
  midi: number
  tone?: 'normal' | 'ok' | 'miss' | 'target'
  label?: string
}

const TONE = { normal: 'var(--color-pearl)', ok: 'var(--color-led-green)', miss: 'var(--color-led-red)', target: 'var(--color-enclosure)' }

/** Pauta de cinco linhas com uma ou mais notas (semibreves), na clave do instrumento. */
export function Staff({ items, clef, flats = false, ariaLabel }: { items: StaffItem[]; clef: Clef; flats?: boolean; ariaLabel?: string }) {
  const width = 110 + items.length * NOTE_GAP + 30
  const yOf = (step: number) => MID - (step * SP) / 2
  const notes = items.map((it) => ({ ...it, pos: staffNote(it.midi, clef, flats) }))
  const steps = notes.map((n) => n.pos.step)
  // altura dinâmica para caber linhas suplementares
  const minY = Math.min(TOP - SP, ...steps.map((s) => yOf(s) - SP * 2))
  const maxY = Math.max(TOP + SP * 5, ...steps.map((s) => yOf(s) + SP * 2), ...items.map(() => 0))
  return (
    <svg viewBox={`0 ${minY} ${width} ${maxY - minY + (items.some((i) => i.label) ? 22 : 0)}`} style={{ width: '100%', height: 'auto', maxHeight: 340, display: 'block' }} role="img" aria-label={ariaLabel ?? 'Pauta'}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={8} x2={width - 8} y1={TOP + i * SP} y2={TOP + i * SP} stroke="var(--color-pearl-dim)" strokeWidth={1.3} />
      ))}
      <line x1={width - 8} x2={width - 8} y1={TOP} y2={TOP + SP * 4} stroke="var(--color-pearl-dim)" strokeWidth={2} />
      {/* clave: a de sol "abraça" a 2ª linha (G), a de fá marca a 4ª linha (F) */}
      <text x={18} y={clef === 'treble' ? TOP + SP * 3 : TOP + SP} fontFamily="Bravura" fontSize={FS} fill="var(--color-pearl)">
        {G[clef]}
      </text>
      {notes.map((n, i) => {
        const x = 110 + i * NOTE_GAP
        const y = yOf(n.pos.step)
        const color = TONE[n.tone ?? 'normal']
        return (
          <g key={i}>
            {ledgerSteps(n.pos.step).map((s) => (
              <line key={s} x1={x - 8} x2={x + SP * 1.7 + 8} y1={yOf(s)} y2={yOf(s)} stroke="var(--color-pearl-dim)" strokeWidth={1.3} />
            ))}
            {n.pos.accidental && (
              <text x={x - SP * 1.3} y={y} fontFamily="Bravura" fontSize={FS} fill={color}>
                {G[n.pos.accidental]}
              </text>
            )}
            <text x={x} y={y} fontFamily="Bravura" fontSize={FS} fill={color}>
              {G.whole}
            </text>
            {n.label && (
              <text x={x + SP * 0.85} y={maxY + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={13} fill="var(--color-pearl-dim)">
                {n.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
