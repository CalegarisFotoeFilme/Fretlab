import { Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '../components/AppShell'
import { LinkButton, Meter, Stars } from '../components/ui'
import { WORLDS, nextLesson } from '../curriculum'
import type { World } from '../curriculum/types'
import { useProgress, type ProgressSummary } from '../progress/progress'
import { DOUBLE_INLAYS, INLAY_FRETS, INSTRUMENT_LABEL } from '../theory/instrument'
import { useSettings } from '../progress/settings'

export function TrailPage() {
  const progress = useProgress()
  const instrument = useSettings((s) => s.instrument)
  if (!progress) return null
  const starsOf = (id: string) => progress.lessons.get(id)?.stars ?? 0
  const next = nextLesson(starsOf)

  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-[1640px] px-4 md:px-10 pt-6 md:pt-10">
      <div className="flex items-center justify-between md:hidden mb-6">
        <Logo />
        <span className="eyebrow">{INSTRUMENT_LABEL[instrument]}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <aside className="lg:order-2">
          <div className="lg:sticky lg:top-10 flex flex-col gap-4">
            <StatusBar progress={progress} />
            {next && (
              <section className="panel p-5 relative overflow-hidden" aria-labelledby="next-title">
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-enclosure/10 blur-2xl" aria-hidden />
                <p className="eyebrow">{progress.lessons.size ? 'Continuar de onde parou' : 'Primeira lição'}</p>
                <h2 id="next-title" className="mt-2 text-3xl font-extrabold uppercase">{next.title}</h2>
                <p className="mt-1 text-pearl-dim">{next.summary}</p>
                <LinkButton to={`/licao/${next.id}`} size="lg" className="mt-4 w-full">
                  Começar lição
                </LinkButton>
              </section>
            )}
            <div className="hidden lg:flex items-center justify-between text-sm text-pearl-faint px-1">
              <span>{INSTRUMENT_LABEL[instrument]}</span>
              <span className="font-mono">hoje: +{progress.todayXp} XP</span>
            </div>
          </div>
        </aside>

        <div className="lg:order-1 grid gap-12 2xl:grid-cols-2 2xl:gap-x-14 items-start pb-6">
          {WORLDS.map((w, i) => (
            <WorldNeck key={w.id} world={w} index={i} starsOf={starsOf} nextId={next?.id} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBar({ progress }: { progress: ProgressSummary }) {
  const { level, streak, practicedToday } = progress
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-display text-xl font-extrabold uppercase">Nível {level.level}</span>
          <span className="font-mono text-xs text-pearl-faint">
            {level.into}/{level.span} XP
          </span>
        </div>
        <Meter value={level.into} max={level.span} label="Progresso até o próximo nível" />
      </div>
      <div className="panel px-3 py-2 text-center min-w-20" title={practicedToday ? 'Você já praticou hoje' : 'Pratique hoje para manter a sequência'}>
        <div className="flex items-center justify-center gap-1.5">
          <span className={practicedToday ? 'led text-led-green' : 'led-off'} aria-hidden />
          <span className="font-display text-2xl font-black leading-none">{streak}</span>
        </div>
        <span className="text-[11px] text-pearl-faint">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
      </div>
    </div>
  )
}

function WorldNeck({ world, index, starsOf, nextId }: { world: World; index: number; starsOf: (id: string) => number; nextId?: string }) {
  if (world.comingSoon) {
    return (
      <section aria-label={world.title} className="flex items-center gap-4 opacity-60">
        <div className="w-14 shrink-0 flex justify-center">
          <Lock className="size-5 text-pearl-faint" aria-hidden />
        </div>
        <div>
          <p className="eyebrow">Mundo {index + 1} · em construção</p>
          <h2 className="text-2xl font-extrabold uppercase text-pearl-dim">{world.title}</h2>
          <p className="text-sm text-pearl-faint">{world.tagline}</p>
        </div>
      </section>
    )
  }
  const done = world.lessons.filter((l) => starsOf(l.id) > 0).length
  return (
    <section aria-labelledby={`w-${world.id}`}>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="eyebrow">Mundo {index + 1}</p>
          <h2 id={`w-${world.id}`} className="text-4xl font-black uppercase">{world.title}</h2>
          <p className="text-pearl-dim">{world.tagline}</p>
          {world.approach && <p className="mt-1 text-xs text-pearl-faint italic">{world.approach}</p>}
        </div>
        <span className="font-mono text-xs text-pearl-faint whitespace-nowrap">
          {done}/{world.lessons.length}
        </span>
      </div>

      {/* O braço na vertical: cada lição é uma casa. */}
      <ol className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-14 rounded-t-md bg-gradient-to-r from-[#3a2219] via-[#2c1912] to-[#3a2219] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.4)]" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-2 bg-[#e9dfcc] rounded-t-md" />
          {/* cordas */}
          <div className="absolute inset-y-0 left-[22%] w-[1.5px] bg-[#c8b48e]/70" />
          <div className="absolute inset-y-0 left-[41%] w-[1.5px] bg-[#c8b48e]/70" />
          <div className="absolute inset-y-0 left-[59%] w-px bg-[#c8b48e]/70" />
          <div className="absolute inset-y-0 left-[78%] w-px bg-[#c8b48e]/70" />
        </div>
        {world.lessons.map((l, i) => {
          const fret = i + 1
          const stars = starsOf(l.id)
          const current = l.id === nextId
          const content = (
            <>
              <div className="relative w-14 shrink-0 self-stretch flex items-center justify-center" aria-hidden>
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-nickel/80" />
                {INLAY_FRETS.includes(fret) && !current && stars === 0 && (
                  <div className="flex gap-3">
                    <span className="size-3 rounded-full bg-pearl/80" />
                    {DOUBLE_INLAYS.includes(fret) && <span className="size-3 rounded-full bg-pearl/80" />}
                  </div>
                )}
                {(current || stars > 0) && (
                  <span
                    className={`relative grid place-items-center size-8 rounded-full font-mono text-xs font-bold text-wood-950 ${
                      current ? 'bg-enclosure shadow-[0_0_18px_rgb(242_118_46/0.8)] animate-pulse' : 'bg-led-green shadow-[0_0_12px_rgb(79_209_139/0.6)]'
                    }`}
                  >
                    {fret}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 py-4 pl-4 pr-2 border-b border-wood-700/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-base font-bold leading-snug text-pearl">{l.title}</h3>
                  <Stars value={stars} />
                </div>
                <p className="text-sm mt-0.5 text-pearl-dim">{l.summary}</p>
              </div>
            </>
          )
          return (
            <li key={l.id} className="relative">
              <Link to={`/licao/${l.id}`} className="flex items-stretch rounded-r-xl hover:bg-wood-900/70 transition-colors" aria-current={current ? 'step' : undefined}>
                {content}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
