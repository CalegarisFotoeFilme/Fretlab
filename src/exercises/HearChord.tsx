import { Ear } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { playChord, uiSound } from '../audio/engine'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { HearChordSpec, HearDegreeSpec } from '../curriculum/types'
import { useInstrument } from '../progress/settings'
import { CHORDS, harmonicField } from '../theory/notes'
import { chordMidis, degreeChordMidis, hearChordRound, hearDegreeRound, type HearChordRound, type HearDegreeRound } from './generate'
import type { ExerciseProps } from './types'

/** Base dos exercícios de ouvido com opções: tocar, escolher, mostrar a certa e ouvir de novo. */
function EarQuestion<T extends string | number>({
  prompt, hint, options, answer, label, sub, onPlay, onDone, round,
}: {
  prompt: string
  hint: string
  options: T[]
  answer: T
  label: (o: T) => string
  sub?: (o: T) => string
  onPlay: () => void
  onDone: (score: number) => void
  round: number
}) {
  const [chosen, setChosen] = useState<{ round: number; v: T } | null>(null)
  const picked = chosen?.round === round ? chosen.v : null

  // cada rodada começa tocando
  useEffect(() => {
    const t = setTimeout(onPlay, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const choose = (v: T) => {
    if (picked !== null) return
    setChosen({ round, v })
    const ok = v === answer
    uiSound(ok ? 'ok' : 'miss')
    setTimeout(onPlay, 350)
    setTimeout(() => onDone(ok ? 1 : 0), ok ? 1600 : 2600)
  }
  useHotkeys({ ...Object.fromEntries(options.map((o, i) => [String(i + 1), () => choose(o)])), ' ': onPlay })

  return (
    <div className="mx-auto max-w-3xl flex flex-col items-center gap-6 text-center">
      <p className="eyebrow">{prompt}</p>
      <button onClick={onPlay} className="grid place-items-center size-40 rounded-full border-2 border-enclosure/60 bg-enclosure/10 text-enclosure hover:bg-enclosure/20 transition-colors" aria-label="Ouvir de novo">
        <Ear className="size-16" aria-hidden />
      </button>
      <p className="text-pearl-dim">
        {hint} Clique ou aperte <Kbd>espaço</Kbd> para ouvir de novo.
      </p>
      <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-2.5">
        {options.map((o, i) => {
          const state = picked === null ? '' : o === answer ? 'ring-2 ring-led-green' : o === picked ? 'ring-2 ring-led-red opacity-80' : 'opacity-50'
          return (
            <Button key={String(o)} variant="secondary" size="lg" className={`justify-start text-left ${state}`} onClick={() => choose(o)}>
              <Kbd>{i + 1}</Kbd>
              <span className="font-display text-xl font-black">{label(o)}</span>
              {sub && <span className="text-xs text-pearl-dim">{sub(o)}</span>}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

/** Ouvir um acorde e dizer o tipo. */
export function HearChord({ spec, onRoundDone, round }: ExerciseProps<HearChordSpec>) {
  const inst = useInstrument()
  const [q, setQ] = useState<HearChordRound>(() => hearChordRound(inst, spec.qualities))
  const prev = useRef(round)
  useEffect(() => {
    if (prev.current === round) return
    prev.current = round
    setQ((p) => hearChordRound(inst, spec.qualities, p))
  }, [round, inst, spec])
  return (
    <EarQuestion
      prompt="Que tipo de acorde é esse?"
      hint={spec.arpeggio ? 'As notas do acorde, uma de cada vez.' : 'As notas do acorde juntas.'}
      options={q.options}
      answer={q.quality}
      label={(o) => CHORDS[o].name}
      sub={(o) => CHORDS[o].formula.length === 2 ? '1-5' : `${CHORDS[o].symbol || 'maior'}`}
      onPlay={() => playChord(chordMidis(q.root, q.quality), spec.arpeggio)}
      onDone={onRoundDone}
      round={round}
    />
  )
}

/** Ouvir a tônica e depois outro acorde do campo: qual é o grau? */
export function HearDegree({ spec, onRoundDone, round }: ExerciseProps<HearDegreeSpec>) {
  const [q, setQ] = useState<HearDegreeRound>(() => hearDegreeRound(spec.degrees))
  const prev = useRef(round)
  useEffect(() => {
    if (prev.current === round) return
    prev.current = round
    setQ((p) => hearDegreeRound(spec.degrees, p))
  }, [round, spec])
  const field = harmonicField(q.key, spec.mode)
  const play = () => {
    playChord(degreeChordMidis(q.key, spec.mode, 1))
    setTimeout(() => playChord(degreeChordMidis(q.key, spec.mode, q.degree)), 1100)
  }
  return (
    <EarQuestion
      prompt="Primeiro a tônica, depois outro acorde do tom. Qual é o grau do segundo?"
      hint={`Tom ${spec.mode === 'major' ? 'maior' : 'menor'}: o primeiro acorde é sempre o ${spec.mode === 'major' ? 'I' : 'i'}.`}
      options={q.options}
      answer={q.degree}
      label={(d) => field[d - 1].roman}
      sub={(d) => (['tônica', 'subdominante', 'tônica', 'subdominante', 'dominante', 'tônica', 'dominante'] as const)[d - 1]}
      onPlay={play}
      onDone={onRoundDone}
      round={round}
    />
  )
}
