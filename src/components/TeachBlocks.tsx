import { Lightbulb, Volume2 } from 'lucide-react'
import { playNote } from '../audio/engine'
import type { TeachBlock } from '../curriculum/types'
import { parsePattern, resolvePool, resolveStrings } from '../exercises/generate'
import { previewPattern } from '../exercises/Rhythm'
import { FIGURE_BEATS, FIGURE_LABEL, type Figure } from '../exercises/rhythm'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findPositions, midiAt, stringNumber } from '../theory/instrument'
import { mod12 } from '../theory/notes'
import { Fretboard } from './Fretboard'
import { RhythmStaff } from './RhythmStaff'
import { Button } from './ui'

export function TeachBlocks({ blocks }: { blocks: TeachBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
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
