import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold select-none transition-[transform,background-color,box-shadow] duration-100 active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none min-h-11 px-4'
const variants: Record<Variant, string> = {
  // botão de pisar: gabinete laranja com borda inferior mais escura que "afunda"
  primary:
    'bg-enclosure text-wood-950 shadow-[0_3px_0_var(--color-enclosure-deep),0_8px_20px_-8px_rgb(242_118_46/0.6)] active:shadow-[0_1px_0_var(--color-enclosure-deep)] hover:brightness-105',
  secondary:
    'bg-wood-800 text-pearl border border-wood-600/60 shadow-[0_3px_0_var(--color-wood-950)] active:shadow-[0_1px_0_var(--color-wood-950)] hover:bg-wood-700',
  ghost: 'text-pearl-dim hover:text-pearl hover:bg-wood-800/60',
}

export function Button({
  variant = 'primary', size = 'md', className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg' }) {
  return <button className={`${base} ${variants[variant]} ${size === 'lg' ? 'min-h-14 text-lg px-6' : ''} ${className}`} {...rest} />
}

export function LinkButton({
  variant = 'primary', size = 'md', className = '', ...rest
}: LinkProps & { variant?: Variant; size?: 'md' | 'lg' }) {
  return <Link className={`${base} ${variants[variant]} ${size === 'lg' ? 'min-h-14 text-lg px-6' : ''} ${className}`} {...rest} />
}

/** Três LEDs âmbar, como os de status de uma pedaleira. */
export function Stars({ value, size = 'sm', label = true }: { value: number; size?: 'sm' | 'lg'; label?: boolean }) {
  const s = size === 'lg' ? 'size-5' : 'size-2.5'
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={label ? `${value} de 3 estrelas` : undefined} role={label ? 'img' : undefined}>
      {[0, 1, 2].map((i) =>
        i < value ? (
          <span key={i} className={`led ${s} text-led-amber`} />
        ) : (
          <span key={i} className={`led-off ${s}`} />
        ),
      )}
    </span>
  )
}

export function Meter({ value, max = 1, tone = 'enclosure', label }: { value: number; max?: number; tone?: 'enclosure' | 'green'; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-wood-950/80 overflow-hidden shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)]" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${tone === 'green' ? 'bg-led-green' : 'bg-enclosure'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="text-5xl font-extrabold uppercase">{title}</h1>
      {children && <div className="mt-3 text-pearl-dim max-w-prose">{children}</div>}
    </header>
  )
}

export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-wood-950/70 p-1 border border-wood-700/60">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors ${
            value === o.value ? 'bg-wood-700 text-pearl shadow-[0_1px_0_rgb(255_255_255/0.06)_inset]' : 'text-pearl-dim hover:text-pearl'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
