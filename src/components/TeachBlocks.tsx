import { Lightbulb, Volume2 } from 'lucide-react'
import { playChord, playInterval, playNote, playSequence } from '../audio/engine'
import type { TeachBlock } from '../curriculum/types'
import { HAND_SPAN, chordMidis, intervalTargets, parsePattern, resolvePool, resolveStrings, setName, setPcs, setPositions } from '../exercises/generate'
import { previewPattern } from '../exercises/Rhythm'
import { FIGURE_BEATS, FIGURE_LABEL, type Figure } from '../exercises/rhythmScore'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findPositions, midiAt, stringNumber } from '../theory/instrument'
import { CHORDS, INTERVALS, SCALES, chordName, harmonicField, intervalBetween, mod12, prefersFlats } from '../theory/notes'
import { functionOf } from '../theory/analysis'
import { clefFor } from '../theory/staff'
import { Staff } from './Staff'
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
              O baixo é afinado igual às 4 cordas mais graves da guitarra, uma oitava abaixo{inst.kind === 'bass5' ? ', com um Si extra embaixo' : inst.kind === 'bass6' ? ', com um Si extra embaixo e um Dó extra em cima (a 4ª acima do Sol, como todas as outras)' : ''}.
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
          <RhythmStaff events={events} marks={block.marks} />
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
    case 'formula': {
      const flats = prefersFlats(block.root)
      const steps: readonly number[] = 'scale' in block.set ? SCALES[block.set.scale].steps : CHORDS[block.set.chord].formula
      const pcs = setPcs(block.root, block.set)
      const title = 'scale' in block.set ? `${noteName(block.root, flats)} ${setName(block.set).toLowerCase()}` : chordName(block.root, block.set.chord, flats)
      // passos entre notas vizinhas (escalas): T = tom, S = semitom, T½ = um tom e meio
      const gaps = 'scale' in block.set ? [...steps.slice(1), 12].map((s, i) => s - steps[i]) : []
      const base = 48 + block.root
      const midis = [...steps.map((s) => base + s), ...('scale' in block.set ? [base + 12] : [])]
      return (
        <figure className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-2xl font-black uppercase">{title}</p>
            <Button variant="secondary" onClick={() => ('scale' in block.set ? playSequence(midis, 0.3) : (playChord(midis), setTimeout(() => playChord(midis, true), 900)))}>
              <Volume2 className="size-4" aria-hidden /> Ouvir
            </Button>
          </div>
          <ol className="mt-3 flex flex-wrap items-center gap-1.5">
            {pcs.map((pc, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className={`grid min-w-14 rounded-lg border px-2 py-1 text-center ${i === 0 ? 'border-enclosure/70 bg-enclosure/10' : 'border-wood-700'}`}>
                  <span className="font-display text-2xl font-black">{noteName(pc, flats)}</span>
                  <span className="font-mono text-[11px] text-pearl-faint">{intervalBetween(block.root, pc).short}</span>
                </span>
                {gaps[i] !== undefined && <span className="font-mono text-xs text-pearl-dim">{gaps[i] === 1 ? 'S' : gaps[i] === 2 ? 'T' : gaps[i] === 3 ? 'T½' : `${gaps[i]}`}</span>}
              </li>
            ))}
          </ol>
          {block.caption && <figcaption className="mt-2 text-sm text-pearl-dim">{block.caption}</figcaption>}
        </figure>
      )
    }
    case 'map': {
      const pcs = setPcs(block.root, block.set)
      const from = block.from ?? 0
      const to = Math.min(inst.frets, block.to ?? 12)
      // com posição: só as notas dela cheias, o resto tracejado
      let win: [number, number] | null = null
      if (block.anchor && block.anchor.string < inst.openMidi.length) {
        const rf = findPositions(inst, block.root, to, from).find((p) => p.string === block.anchor!.string && p.fret + block.anchor!.offset >= 0)
        if (rf) win = [rf.fret + block.anchor.offset, rf.fret + block.anchor.offset + block.anchor.width]
      }
      const markers = setPositions(inst, pcs, from, to).map((p) => {
        const pc = mod12(midiAt(inst, p))
        const inWin = !win || (p.fret >= win[0] && p.fret <= win[1])
        return { ...p, label: intervalBetween(block.root, pc).short, tone: !inWin ? ('ghost' as const) : pc === block.root ? ('root' as const) : ('neutral' as const) }
      })
      return (
        <figure className="panel p-3">
          <div className="-mx-3 overflow-x-auto px-3">
            <Fretboard inst={inst} from={from} to={to} markers={markers} leftHanded={leftHanded} onPick={(p) => playNote(midiAt(inst, p))} />
          </div>
          <figcaption className="mt-2 px-1 text-sm text-pearl-dim">{block.caption}</figcaption>
        </figure>
      )
    }
    case 'field': {
      const flats = prefersFlats(block.root, block.mode)
      const field = harmonicField(block.root, block.mode, block.sevenths)
      const key = { root: block.root, mode: block.mode }
      return (
        <figure className="panel p-4">
          <p className="font-display text-2xl font-black uppercase">
            Campo de {noteName(block.root, flats)} {block.mode === 'major' ? 'maior' : 'menor'}
          </p>
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {field.map((d) => (
              <button
                key={d.degree}
                onClick={() => playChord(chordMidis(48 + d.root - (d.root > 7 ? 12 : 0), d.quality))}
                className="rounded-lg border border-wood-700 px-2 py-1.5 text-left hover:border-enclosure/60 hover:bg-wood-800"
                title="Ouvir"
              >
                <span className="flex justify-between font-mono text-[10px] text-pearl-faint">
                  {d.roman} <span>{{ tônica: 'T', subdominante: 'S', dominante: 'D' }[functionOf(d.root, key)!]}</span>
                </span>
                <span className="font-display text-xl font-black">{chordName(d.root, d.quality, flats)}</span>
              </button>
            ))}
          </div>
          {block.caption && <figcaption className="mt-2 text-sm text-pearl-dim">{block.caption}</figcaption>}
        </figure>
      )
    }
    case 'staff': {
      const clef = clefFor(inst)
      const items =
        block.notes === 'open-strings'
          ? inst.openMidi.map((m) => ({ midi: m, label: noteName(mod12(m)) }))
          : (() => {
              const { string, frets } = block.notes as { string: number; frets: number[] }
              const s = Math.min(string, inst.openMidi.length - 1)
              return frets.map((f) => ({ midi: inst.openMidi[s] + f, label: noteName(mod12(inst.openMidi[s] + f)) }))
            })()
      return (
        <figure className="panel p-3">
          <Staff items={items} clef={clef} />
          <figcaption className="mt-2 flex items-center justify-between gap-3 px-1 text-sm text-pearl-dim">
            {block.caption}
            <Button variant="secondary" onClick={() => playSequence(items.map((i) => i.midi), 0.45)}>
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
