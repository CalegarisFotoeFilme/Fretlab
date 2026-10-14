import { Check, Mic, MicOff, SkipForward, Volume2 } from 'lucide-react'
import { Hint } from './Hint'
import { noteSetHints } from './hints'
import { useCallback, useEffect, useRef, useState } from 'react'
import { playNote, playSequence, uiSound } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import type { NoteSetSpec } from '../curriculum/types'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, pcAt, stringNumber, type FretPos } from '../theory/instrument'
import { CHORDS, SCALES, intervalBetween, mod12, prefersFlats } from '../theory/notes'
import { noteSetRound, setName, setPcs, type NoteSetRound } from './generate'
import type { ExerciseProps } from './types'

const same = (a: FretPos, b: FretPos) => a.string === b.string && a.fret === b.fret

/**
 * "Desenhe no braço": encontrar todas as notas de uma escala ou acorde dentro de uma posição.
 * No braço, clica-se nota por nota; no instrumento, toca-se a posição subindo, do grave ao agudo.
 */
export function NoteSet({ spec, onRoundDone, round }: ExerciseProps<NoteSetSpec>) {
  const inst = useInstrument()
  const leftHanded = useSettings((s) => s.leftHanded)
  const noteName = useNoteName()
  const [q, setQ] = useState<NoteSetRound>(() => noteSetRound(inst, spec))
  const [found, setFound] = useState<FretPos[]>([])
  const [misses, setMisses] = useState<Marker[]>([])
  const [done, setDone] = useState(false)
  const [forceTap, setForceTap] = useState(false)
  const playMode = spec.input === 'play' && !forceTap
  const prevRound = useRef(round)
  // passo da sequência no instrumento: ref para o callback do áudio, estado para a tela
  const step = useRef(0)
  const [stepView, setStepView] = useState(0)

  useEffect(() => {
    if (prevRound.current === round) return
    prevRound.current = round
    setQ((prev) => noteSetRound(inst, spec, prev))
    setFound([])
    setMisses([])
    setDone(false)
    step.current = 0
    setStepView(0)
  }, [round, inst, spec])

  const pcs = setPcs(q.root, q.set)
  const flats = prefersFlats(q.root)
  // a fundamental marcada já vale como encontrada
  const required = q.targets.filter((t) => !same(t, q.rootPos))
  const label = (pc: number) => intervalBetween(q.root, pc).short
  // no instrumento: a posição inteira subindo, sem repetir alturas (uníssonos em cordas diferentes contam uma vez)
  const ascending = [...new Map(q.targets.map((t) => [midiAt(inst, t), t])).entries()].sort((a, b) => a[0] - b[0])
  const title = 'scale' in q.set ? `${noteName(q.root, flats)} ${setName(q.set).toLowerCase()}` : `${noteName(q.root, flats)}${CHORDS[q.set.chord].symbol}`

  const finish = useCallback(
    (foundCount: number, missCount: number, gaveUp = false) => {
      setDone(true)
      const total = q.targets.length - 1
      const score = Math.max(0, Math.min(1, (foundCount - missCount * 0.5) / total))
      uiSound(!gaveUp && score >= 0.8 ? 'ok' : 'miss')
      setTimeout(() => onRoundDone(score), 1700)
    },
    [onRoundDone, q.targets.length],
  )

  const onPick = (pos: FretPos) => {
    if (done) return
    playNote(midiAt(inst, pos))
    if (same(pos, q.rootPos) || found.some((f) => same(f, pos))) return
    if (pcs.includes(pcAt(inst, pos)) && pos.fret >= q.from && pos.fret <= q.to) {
      const next = [...found, pos]
      setFound(next)
      if (next.length === required.length) finish(next.length, misses.length)
    } else {
      const m = [...misses, { ...pos, tone: 'miss' as const, label: noteName(pcAt(inst, pos), flats) }]
      setMisses(m)
      uiSound('miss')
      if (m.length >= 4) finish(found.length, m.length, true)
    }
  }

  // no instrumento: segue a sequência subindo; notas fora da escala contam como erro
  const { status, reading } = useAudioInput(playMode && !done, {
    onNote: (midi) => {
      if (done) return
      const expected = ascending[step.current]
      if (!expected) return
      if (mod12(midi) === mod12(expected[0])) {
        step.current++
        setStepView(step.current)
        setFound((f) => [...f, ...required.filter((t) => midiAt(inst, t) === expected[0])])
        if (step.current === ascending.length) finish(required.length, misses.length)
      } else if (!pcs.includes(mod12(midi))) {
        setMisses((m) => [...m, { ...q.rootPos, tone: 'ghost' as const, label: '' }].slice(-8))
      }
    },
  })

  const giveUp = () => !done && finish(found.length, misses.length, true)
  const hearSet = () => playSequence([...ascending.map(([m]) => m)], 0.22)
  useHotkeys({ Escape: giveUp, ' ': hearSet })

  const markers: Marker[] = [
    // a fundamental de partida sempre visível
    { ...q.rootPos, tone: 'root', label: '1' },
    ...(done
      ? q.targets.filter((t) => !same(t, q.rootPos)).map((t) => ({ ...t, tone: found.some((f) => same(f, t)) ? ('ok' as const) : ('ghost' as const), label: label(pcAt(inst, t)) }))
      : found.filter((f) => !same(f, q.rootPos)).map((f) => ({ ...f, tone: 'ok' as const, label: label(pcAt(inst, f)) }))),
    ...(playMode ? [] : misses),
  ]
  const progress = `${found.length} de ${required.length}`
  const heard = reading ? noteName(mod12(Math.round(reading.midi)), flats) : null
  const anchorLabel = q.anchor.name ? `${q.anchor.name} · ` : ''

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-center xl:gap-10">
      <div className="text-center xl:text-left flex flex-col gap-4">
        <p className="eyebrow">{playMode ? 'Toque a posição, subindo' : 'Clique em todas as notas da posição'}</p>
        <p className="font-display text-5xl xl:text-6xl font-black text-enclosure">{title}</p>
        <p className="text-pearl-dim">
          {anchorLabel}fundamental na {stringNumber(inst, q.anchor.string)}ª corda, casa {q.rootPos.fret}. Posição: casas {q.from} a {q.to}.
        </p>
        <p className="flex items-center gap-2 justify-center xl:justify-start text-lg font-semibold" aria-live="polite">
          <Check className="size-5 text-led-green" aria-hidden /> {progress}
          {misses.length > 0 && !playMode && <span className="text-sm text-led-red font-normal">· {misses.length} fora</span>}
        </p>
        <div className="flex flex-wrap gap-2 justify-center xl:justify-start">
          <Button variant="ghost" onClick={hearSet}>
            <Volume2 className="size-4" aria-hidden /> Ouvir <Kbd>espaço</Kbd>
          </Button>
          <Button variant="ghost" onClick={giveUp}>
            <SkipForward className="size-4" aria-hidden /> Mostrar tudo <Kbd>esc</Kbd>
          </Button>
        </div>
        {!done && (
          <Hint
            key={round}
            lines={noteSetHints(
              inst,
              ('scale' in q.set ? SCALES[q.set.scale].steps : CHORDS[q.set.chord].formula).map((s) => intervalBetween(0, s).short).join(' – '),
              required.find((t) => !found.some((f) => same(f, t))) ?? null,
              (() => {
                const m = required.find((t) => !found.some((f) => same(f, t)))
                return m ? label(pcAt(inst, m)) : ''
              })(),
            )}
          />
        )}
        {playMode && (
          <div className="panel flex items-center gap-3 p-4">
            {status === 'on' ? (
              <span className="flex items-center gap-3">
                <Mic className="size-5 text-led-green" aria-hidden />
                <span>
                  <span className="block text-sm text-pearl-dim">Ouvindo… próxima: {ascending[stepView] ? noteName(mod12(ascending[stepView][0]), flats) : '—'}</span>
                  <span className="font-display text-3xl font-black">{heard ?? '—'}</span>
                </span>
              </span>
            ) : status === 'starting' ? (
              <span className="text-pearl-dim">Ligando a entrada de áudio…</span>
            ) : (
              <>
                <span className="flex items-center gap-3 text-sm">
                  <MicOff className="size-5 text-led-red shrink-0" aria-hidden />
                  {status === 'denied' ? 'O navegador bloqueou o microfone.' : 'Não foi possível abrir a entrada de áudio. Confira a pedaleira em Ajustes.'}
                </span>
                <Button variant="secondary" onClick={() => setForceTap(true)}>Responder no braço</Button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <Fretboard
          inst={inst}
          from={Math.max(0, q.from - 1)}
          to={Math.min(inst.frets, q.to + 1)}
          markers={markers}
          leftHanded={leftHanded}
          onPick={playMode ? undefined : onPick}
          ariaLabel={`${title}: encontre as notas entre as casas ${q.from} e ${q.to}`}
        />
      </div>
    </div>
  )
}
