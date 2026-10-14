import { Mic, MicOff, Volume2 } from 'lucide-react'
import { Hint } from './Hint'
import { readNoteHints } from './hints'
import { useEffect, useRef, useState } from 'react'
import { playNote, uiSound } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Staff } from '../components/Staff'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { ReadNoteSpec } from '../curriculum/types'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { findMidiPositions, midiAt, pcAt, type FretPos } from '../theory/instrument'
import { mod12 } from '../theory/notes'
import { clefFor, staffNote } from '../theory/staff'
import { nameNoteRound, type NameNoteRound } from './generate'
import type { ExerciseProps } from './types'

/** Uma nota na pauta: dizer o nome, achar no braço (na mesma oitava) ou tocar no instrumento. */
export function ReadNote({ spec, onRoundDone, round }: ExerciseProps<ReadNoteSpec>) {
  const inst = useInstrument()
  const noteName = useNoteName()
  const leftHanded = useSettings((s) => s.leftHanded)
  const [q, setQ] = useState<NameNoteRound>(() => nameNoteRound(inst, spec.pool, spec.strings, spec.frets, 4))
  const [result, setResult] = useState<{ ok: boolean; marks: Marker[]; chosen?: number } | null>(null)
  const [forceTap, setForceTap] = useState(false)
  const prev = useRef(round)
  const midi = midiAt(inst, q.pos)
  const clef = clefFor(inst)
  const written = staffNote(midi, clef)
  const mode = spec.answer === 'play' && forceTap ? 'fretboard' : spec.answer

  useEffect(() => {
    if (prev.current === round) return
    prev.current = round
    setQ((p) => nameNoteRound(inst, spec.pool, spec.strings, spec.frets, 4, p))
    setResult(null)
  }, [round, inst, spec])

  const targets = findMidiPositions(inst, midi)
  const finish = (ok: boolean, marks: Marker[] = [], chosen?: number) => {
    if (result) return
    setResult({ ok, marks, chosen })
    uiSound(ok ? 'ok' : 'miss')
    playNote(midi)
    setTimeout(() => onRoundDone(ok ? 1 : 0), ok ? 900 : 2000)
  }
  const reveal = (tone: Marker['tone']) => targets.map((t) => ({ ...t, tone, label: noteName(mod12(midi)) }))

  const onPick = (pos: FretPos) => {
    playNote(midiAt(inst, pos))
    // na pauta, a altura é exata: a mesma nota em outra oitava não vale
    if (midiAt(inst, pos) === midi) finish(true, [{ ...pos, tone: 'ok', label: noteName(mod12(midi)) }])
    else finish(false, [...reveal('ghost'), { ...pos, tone: 'miss', label: noteName(pcAt(inst, pos)) }])
  }
  const { status, reading } = useAudioInput(mode === 'play' && !result, {
    onNote: (m) => {
      if (mod12(m) === mod12(midi)) finish(true, reveal('ok'))
    },
  })

  useHotkeys({
    ...(mode === 'name' ? Object.fromEntries(q.options.map((pc, i) => [String(i + 1), () => finish(pc === q.pc, [], pc)])) : {}),
    ' ': () => result && playNote(midi),
    Escape: () => finish(false, reveal('ghost')),
  })

  const tone = !result ? 'target' : result.ok ? 'ok' : 'miss'
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:items-center xl:gap-12">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-center xl:text-left">
          {mode === 'name' ? 'Que nota é essa?' : mode === 'fretboard' ? 'Clique essa nota no braço, na altura certa' : 'Toque essa nota no instrumento'}
        </p>
        <div className="panel px-4 py-2">
          <Staff items={[{ midi, tone, label: result ? noteName(mod12(midi)) : undefined }]} clef={clef} ariaLabel="Nota na pauta" />
        </div>
        {!result && <Hint key={round} lines={readNoteHints(written.step, clef, letterPath(written.step, clef))} />}
        <p className="text-xs text-pearl-faint text-center xl:text-left">
          {clef === 'treble' ? 'Clave de sol com 8 embaixo: a guitarra soa uma oitava abaixo do escrito.' : 'Clave de fá com 8 embaixo: o baixo soa uma oitava abaixo do escrito.'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {mode === 'name' && (
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((pc, i) => {
              const state = !result ? '' : pc === q.pc ? 'ring-2 ring-led-green' : pc === result.chosen ? 'ring-2 ring-led-red opacity-80' : 'opacity-50'
              return (
                <Button key={pc} variant="secondary" size="lg" className={`font-display text-3xl font-black ${state}`} onClick={() => finish(pc === q.pc, [], pc)}>
                  <Kbd>{i + 1}</Kbd> {noteName(pc)}
                </Button>
              )
            })}
          </div>
        )}
        {(mode === 'fretboard' || (mode === 'name' && result)) && (
          <div className="-mx-4 overflow-x-auto px-4">
            <Fretboard
              inst={inst}
              from={Math.max(0, spec.frets.from)}
              to={Math.min(inst.frets, Math.max(spec.frets.to, 5))}
              markers={result ? (result.marks.length ? result.marks : reveal(result.ok ? 'ok' : 'ghost')) : []}
              leftHanded={leftHanded}
              onPick={mode === 'fretboard' && !result ? onPick : undefined}
              ariaLabel="Braço: clique onde está a nota da pauta"
            />
          </div>
        )}
        {mode === 'play' && (
          <div className="panel flex items-center justify-between gap-3 p-4">
            {status === 'on' ? (
              <span className="flex items-center gap-3">
                <Mic className="size-5 text-led-green" aria-hidden />
                <span>
                  <span className="block text-sm text-pearl-dim">Ouvindo…</span>
                  <span className="font-display text-3xl font-black">{reading ? noteName(mod12(Math.round(reading.midi))) : '—'}</span>
                </span>
              </span>
            ) : status === 'starting' ? (
              <span className="text-pearl-dim">Ligando a entrada de áudio…</span>
            ) : (
              <>
                <span className="flex items-center gap-3 text-sm">
                  <MicOff className="size-5 text-led-red shrink-0" aria-hidden />
                  Não foi possível abrir a entrada de áudio. Confira a pedaleira em Ajustes.
                </span>
                <Button variant="secondary" onClick={() => setForceTap(true)}>Responder no braço</Button>
              </>
            )}
          </div>
        )}
        {result && (
          <Button variant="ghost" onClick={() => playNote(midi)}>
            <Volume2 className="size-4" aria-hidden /> Ouvir a nota <Kbd>espaço</Kbd>
          </Button>
        )}
      </div>
    </div>
  )
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
/** Letras da linha do meio até a nota (B na clave de sol, D na de fá), degrau a degrau. */
function letterPath(step: number, clef: 'treble' | 'bass') {
  const ref = clef === 'treble' ? 6 : 1
  const dir = Math.sign(step)
  return Array.from({ length: Math.abs(step) + 1 }, (_, i) => LETTERS[(((ref + dir * i) % 7) + 7) % 7])
}
