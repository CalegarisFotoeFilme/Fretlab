import { Lightbulb, Volume2 } from 'lucide-react'
import { playInterval, playNote } from '../audio/engine'
import type { TeachBlock } from '../curriculum/types'
import { HAND_SPAN, intervalTargets, parsePattern, resolvePool, resolveStrings } from '../exercises/generate'
import { previewPattern } from '../exercises/Rhythm'
import { FIGURE_BEATS, FIGURE_LABEL, type Figure } from '../exercises/rhythmScore'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findPositions, midiAt, stringNumber } from '../theory/instrument'
import { INTERVALS, mod12 } from '../theory/notes'
import { Fretboard } from './Fretboard'
import { RhythmStaff } from './RhythmStaff'
import { Button } from './ui'

const isVisual = (b: TeachBlock) => b.kind !== 'text' && b.kind !== 'tip'

/**
 * Em telas largas, texto à esquerda e visuais (braço, ritmo) à direita, para caber
 * numa tela baixa (ultrawide) sem rolar. Em telas estreitas, tudo em sequência.
 */
export function TeachBlocks({ blocks, footer }: { blocks: TeachBlock[]; footer?: React.ReactNode }) {
  const visuals = blocks.filter(isVisual)
  return (
    <>
      <div className="flex flex-col gap-5 xl:hidden">
        {blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
        {footer}
      </div>
      <div className={`hidden xl:grid gap-10 ${visuals.length ? 'grid-cols-[minmax(0,560px)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,720px)]'}`}>
        <div className="flex flex-col gap-5">
          {blocks.filter((b) => !isVisual(b)).map((b, i) => (
            <Block key={i} block={b} />
          ))}
          {footer}
        </div>
        {visuals.length > 0 && (
          <div className="flex flex-col gap-5 self-start sticky top-8">
            {visuals.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function Block({ block }: { block: TeachBlock }) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()

  switch (block.kind) {
    case 'text':
      return <p className="text-lg leading-relaxed text-pearl/90">{block.text}</p>
    case 'tip':
      return (
        <aside className="flex gap-3 rounded-xl border border-led-amber/30 bg-led-amber/5 p-4">
          <Lightbulb className="size-5 text-led-amber shrink-0 mt-0.5" aria-hidden />
          <p className="text-pearl/90">{block.text}</p>
        </aside>
      )
    case 'open-strings': {
      const strings = [...inst.openMidi.keys()].reverse() // como na tablatura: aguda em cima
      return (
        <div className="panel p-2">
          <ul>
            {strings.map((s) => (
              <li key={s} className="flex items-center gap-3 px-3 py-2 border-b border-wood-700/40 last:border-b-0">
                <span className="font-mono text-xs text-pearl-faint w-14">{stringNumber(inst, s)}ª corda</span>
                <span className="flex-1 h-px bg-[#c8b48e]/60" style={{ height: 1 + (inst.openMidi.length - s) * 0.6 }} aria-hidden />
                <span className="font-display text-3xl font-black w-12 text-center">{noteName(mod12(inst.openMidi[s]))}</span>
                <Button variant="ghost" className="min-w-11 px-2" onClick={() => playNote(inst.openMidi[s])} aria-label={`Ouvir a ${stringNumber(inst, s)}ª corda`}>
                  <Volume2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          {inst.kind === 'guitar6' && inst.tuning.id === 'std' && (
            <p className="px-3 pt-3 pb-1 text-sm text-pearl-dim">
              Da mais grave para a mais aguda: E A D G B E. Para decorar: <em>"Eu Adoro Doce de Goiaba Bem Escuro"</em>.
            </p>
          )}
          {inst.kind !== 'guitar6' && (
            <p className="px-3 pt-3 pb-1 text-sm text-pearl-dim">
              O baixo é afinado igual às 4 cordas mais graves da guitarra, uma oitava abaixo{inst.kind === 'bass5' ? ', com um Si extra embaixo' : ''}.
            </p>
          )}
        </div>
      )
    }
    case 'fretboard': {
      const strings = resolveStrings(inst, block.strings)
      const markers = resolvePool(block.pool).flatMap((pc) =>
        findPositions(inst, pc, block.frets.to, block.frets.from)
          .filter((p) => strings.includes(p.string))
          .map((p) => ({ ...p, label: noteName(pc), tone: block.octaves ? ('root' as const) : ('neutral' as const) })),
      )
      return (
        <figure className="panel p-3">
          <div className="-mx-3 overflow-x-auto px-3">
            <Fretboard
              inst={inst}
              from={block.frets.from}
              to={block.frets.to}
              markers={markers}
              activeStrings={block.strings === 'all' ? undefined : strings}
              leftHanded={leftHanded}
              onPick={(p) => playNote(midiAt(inst, p))}
            />
          </div>
          <figcaption className="mt-2 px-1 text-sm text-pearl-dim">{block.caption}</figcaption>
        </figure>
      )
    }
    case 'rhythm': {
      const events = parsePattern(block.pattern)
      return (
        <figure className="panel p-3">
          <RhythmStaff events={events} />
          <figcaption className="mt-2 flex items-center justify-between gap-3 px-1 text-sm text-pearl-dim">
            {block.caption}
            <Button variant="secondary" onClick={() => previewPattern(events, 70, inst.openMidi[0] + 12)}>
              <Volume2 className="size-4" aria-hidden /> Ouvir
            </Button>
          </figcaption>
        </figure>
      )
    }
    case 'interval': {
      // fundamental numa casa onde cabem todas as formas para os dois lados
      const root = { string: Math.min(block.string ?? 0, inst.openMidi.length - 1), fret: 3 }
      const rootMidi = midiAt(inst, root)
      const iv = INTERVALS[block.semitones]
      // forma principal: a mais perto da fundamental (corda solta e mesma corda contam como mais longe);
      // as outras posições aparecem tracejadas, como alternativas
      const dist = (t: { string: number; fret: number }) => Math.abs(t.fret - root.fret) + (t.string === root.string ? 0.5 : 0) + (t.fret === 0 ? 2 : 0)
      const targets = intervalTargets(inst, root, block.semitones, HAND_SPAN + 1).sort((a, b) => dist(a) - dist(b))
      return (
        <figure className="panel p-3">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="font-display text-2xl font-black uppercase">{iv.name}</p>
            <p className="font-mono text-sm text-pearl-dim">
              {iv.short} · {block.semitones} {block.semitones === 1 ? 'semitom' : 'semitons'}
            </p>
          </div>
          <div className="-mx-3 overflow-x-auto px-3">
            <Fretboard
              inst={inst}
              from={0}
              to={Math.min(inst.frets, 10)}
              markers={[{ ...root, tone: 'root', label: 'R' }, ...targets.map((t, i) => ({ ...t, tone: i === 0 ? ('neutral' as const) : ('ghost' as const), label: iv.short }))]}
              leftHanded={leftHanded}
              onPick={(p) => playNote(midiAt(inst, p))}
            />
          </div>
          <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-pearl-dim">
            <span className="flex-1 min-w-60">{block.caption}</span>
            <span className="flex gap-1.5">
              <Button variant="secondary" onClick={() => playInterval(rootMidi, block.semitones)}>
                <Volume2 className="size-4" aria-hidden /> Separadas
              </Button>
              <Button variant="secondary" onClick={() => playInterval(rootMidi, block.semitones, true)}>
                <Volume2 className="size-4" aria-hidden /> Juntas
              </Button>
            </span>
          </figcaption>
        </figure>
      )
    }
    case 'figures': {
      const figs: Figure[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth']
      return (
        <div className="panel divide-y divide-wood-700/50">
          {figs.map((f) => (
            <div key={f} className="flex items-center gap-4 px-4 py-2">
              <span className="font-[Bravura] text-4xl leading-none w-10 text-center pt-3" aria-hidden>
                {{ whole: '', half: '', quarter: '', eighth: '', sixteenth: '' }[f]}
              </span>
              <span className="flex-1 font-semibold">{FIGURE_LABEL[f]}</span>
              <span className="font-mono text-sm text-pearl-dim">
                {FIGURE_BEATS[f] >= 1 ? FIGURE_BEATS[f] : FIGURE_BEATS[f] === 0.5 ? '½' : '¼'} {FIGURE_BEATS[f] > 1 ? 'tempos' : 'tempo'}
              </span>
            </div>
          ))}
        </div>
      )
    }
  }
}
