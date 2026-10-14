import { Volume2 } from 'lucide-react'
import { useState } from 'react'
import { playNote, playSequence } from '../audio/engine'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button, PageHeader, Segmented } from '../components/ui'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findPositions, midiAt } from '../theory/instrument'
import {
  CHORDS, SCALES, chordName, chordNotes, harmonicField, intervalBetween, mod12, prefersFlats, scaleNotes,
  type ChordQuality, type ScaleId,
} from '../theory/notes'

type Mode = 'scale' | 'chord' | 'field'

export function ExplorerPage() {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()
  const [root, setRoot] = useState(9) // Lá
  const [mode, setMode] = useState<Mode>('scale')
  const [scale, setScale] = useState<ScaleId>('minorPentatonic')
  const [quality, setQuality] = useState<ChordQuality>('min')
  const [labels, setLabels] = useState<'notes' | 'degrees'>('notes')
  const flats = prefersFlats(root, scale === 'minor' || scale === 'minorPentatonic' ? 'minor' : 'major')

  const pcs = mode === 'chord' ? chordNotes(root, quality) : scaleNotes(root, mode === 'field' ? 'major' : scale)
  const markers: Marker[] = pcs.flatMap((pc) =>
    findPositions(inst, pc, 15).map((p) => ({
      ...p,
      tone: pc === root ? ('root' as const) : ('neutral' as const),
      label: labels === 'notes' ? noteName(pc, flats) : intervalBetween(root, pc).short,
    })),
  )
  const lowestRoot = inst.openMidi[0] + mod12(root - inst.openMidi[0])

  return (
    <div className="mx-auto max-w-[1700px] px-4 md:px-10 pt-8">
      <PageHeader eyebrow="Estudo livre" title="Braço">
        Escolha uma tônica e veja onde caem as notas de escalas, acordes e do campo harmônico. Toque no braço para ouvir.
      </PageHeader>

      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Tônica" className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }, (_, pc) => (
            <button
              key={pc}
              role="radio"
              aria-checked={root === pc}
              onClick={() => setRoot(pc)}
              className={`min-h-11 rounded-lg font-display text-xl font-black transition-colors ${
                root === pc ? 'bg-enclosure text-wood-950' : 'bg-wood-900 border border-wood-700/70 text-pearl-dim hover:text-pearl'
              }`}
            >
              {noteName(pc, flats)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Segmented label="O que mostrar" value={mode} onChange={setMode} options={[
            { value: 'scale', label: 'Escala' }, { value: 'chord', label: 'Acorde' }, { value: 'field', label: 'Campo harmônico' },
          ]} />
          <Segmented label="Rótulos" value={labels} onChange={setLabels} options={[
            { value: 'notes', label: 'Notas' }, { value: 'degrees', label: 'Graus' },
          ]} />
        </div>

        {mode === 'scale' && (
          <select value={scale} onChange={(e) => setScale(e.target.value as ScaleId)} className="min-h-11 rounded-xl bg-wood-900 border border-wood-700 px-3 max-w-xs" aria-label="Escala">
            {Object.entries(SCALES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        )}
        {mode === 'chord' && (
          <select value={quality} onChange={(e) => setQuality(e.target.value as ChordQuality)} className="min-h-11 rounded-xl bg-wood-900 border border-wood-700 px-3 max-w-xs" aria-label="Tipo de acorde">
            {Object.entries(CHORDS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        )}

        <section className="panel p-3">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <h2 className="font-display text-3xl font-black uppercase">
              {mode === 'chord' ? chordName(root, quality, flats) : `${noteName(root, flats)} ${mode === 'field' ? 'maior' : SCALES[scale].name.toLowerCase()}`}
            </h2>
            <Button variant="secondary" onClick={() => playSequence([...pcs.map((pc) => lowestRoot + mod12(pc - root)), lowestRoot + 12])}>
              <Volume2 className="size-4" aria-hidden /> Ouvir
            </Button>
          </div>
          <div className="-mx-3 overflow-x-auto px-3">
            <Fretboard inst={inst} to={15} markers={markers} leftHanded={leftHanded} onPick={(p) => playNote(midiAt(inst, p))} />
          </div>
          <p className="px-1 pt-2 text-sm text-pearl-dim">
            Fórmula: {pcs.map((pc) => intervalBetween(root, pc).short).join(' · ')}
          </p>
        </section>

        {mode === 'field' && (
          <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {harmonicField(root).map((d) => (
              <button
                key={d.degree}
                onClick={() => playSequence(chordNotes(d.root, d.quality).map((pc) => lowestRoot + 12 + mod12(pc - root)), 0.12)}
                className="panel p-3 text-left hover:border-enclosure/60"
              >
                <span className="font-mono text-xs text-pearl-faint">{d.roman}</span>
                <span className="block font-display text-2xl font-black">{chordName(d.root, d.quality, flats)}</span>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
