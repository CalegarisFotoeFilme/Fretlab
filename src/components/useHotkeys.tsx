import { useEffect, useRef } from 'react'

/** Atalhos de teclado simples (por `event.key`). Ignora quando o foco está num campo de texto. */
export function useHotkeys(map: Record<string, () => void>, enabled = true) {
  const ref = useRef(map)
  useEffect(() => {
    ref.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable]')) return
      const fn = ref.current[e.key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden md:inline-grid place-items-center min-w-6 h-6 px-1.5 rounded-md border border-wood-600 bg-wood-950/60 font-mono text-[11px] font-semibold text-pearl-faint">
      {children}
    </kbd>
  )
}
