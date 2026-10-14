import { Dumbbell, Gauge, Guitar, ListMusic, Route, SlidersHorizontal } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'

const NAV = [
  { to: '/', label: 'Trilha', icon: Route },
  { to: '/treino', label: 'Treino', icon: Dumbbell },
  { to: '/braco', label: 'Braço', icon: Guitar },
  { to: '/afinador', label: 'Afinador', icon: Gauge },
  { to: '/musicas', label: 'Músicas', icon: ListMusic },
  { to: '/ajustes', label: 'Ajustes', icon: SlidersHorizontal },
]

export function AppShell() {
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/licao/')
  return (
    <div className="min-h-dvh md:flex">
      {!immersive && (
        <nav
          aria-label="Principal"
          className="fixed bottom-0 inset-x-0 z-30 border-t border-wood-700/70 bg-wood-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:static md:w-56 md:shrink-0 md:border-t-0 md:border-r md:bg-transparent md:pb-0"
        >
          <div className="hidden md:block px-5 pt-7 pb-8">
            <Logo />
          </div>
          <ul className="flex justify-around md:flex-col md:gap-1 md:px-3">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-[11px] md:text-sm font-semibold min-w-14 transition-colors ${
                      isActive ? 'text-enclosure md:bg-wood-800/80' : 'text-pearl-faint hover:text-pearl'
                    }`
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main className={`flex-1 min-w-0 ${immersive ? '' : 'pb-24 md:pb-10'}`}>
        <Outlet />
      </main>
    </div>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-2xl font-black uppercase tracking-wide">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--color-wood-800)" />
        <path d="M8 4v16M15 4v16" stroke="var(--color-nickel)" strokeWidth="1.4" />
        <path d="M3 8h18M3 12h18M3 16h18" stroke="var(--color-pearl-faint)" strokeWidth="0.8" />
        <circle cx="11.5" cy="12" r="2.6" fill="var(--color-enclosure)" />
      </svg>
      Fret<span className="text-enclosure">Lab</span>
    </span>
  )
}
