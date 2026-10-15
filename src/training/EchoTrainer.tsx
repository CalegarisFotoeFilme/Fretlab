import { Eye, Headphones, Mic, MicOff, RotateCcw, SkipForward } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { audioCtx, playClick, playNote, uiSound } from '../audio/engine'
import { useAudioInput } from '../audio/useInput'
import { RhythmStaff } from '../components/RhythmStaff'
import { Button, Segmented } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { parsePattern } from '../exercises/generate'
import { onsetBeats } from '../exercises/rhythmScore'
import { useInstrument, useNoteName } from '../progress/settings'
import { mod12 } from '../theory/notes'
import { GROOVES, checkEcho, expectedPcs, levelPhrase, phraseBeats, type Phrase } from './echo'

const LEVEL_KEY = 'fretlab.eco.level'
const readLevel = () => {
  try {
    return Math.max(1, Number(localStorage.getItem(LEVEL_KEY)) || 1)
  } catch {
    return 1
  }
}
const saveLevel = (n: number) => {
  try {
    localStorage.setItem(LEVEL_KEY, String(n))
  } catch {
    // sem armazenamento local: o nível só não é lembrado
  }
}

// relógio e sorteio fora do componente (regras do React Compiler)
const nowMs = () => performance.now()
const randomKey = () => Math.floor(Math.random() * 12)

type Phase = 'idle' | 'playing' | 'listening' | 'right' | 'wrong'

/**
 * Ouvir e repetir: o app toca uma frase (gerada por nível ou um groove pronto), você repete no
 * instrumento e ele confere nota a nota. Acertou, avança; errou, mostra onde e você tenta de novo.
 */
export function EchoTrainer() {
  const inst = useInstrument()
  const noteName = useNoteName()
  const family = inst.kind === 'guitar6' ? 'guitar' : 'bass'
  const [source, setSource] = useState<'nivel' | 'grooves'>('nivel')
  const [level, setLevel] = useState(readLevel)
  const [grooveIdx, setGrooveIdx] = useState(0)
  const [bpm, setBpm] = useState(80)
  // frase e tônica atuais (a tônica muda a cada frase nova)
  const [state, setState] = useState(() => ({ phrase: levelPhrase(readLevel()), root: 0 }))
  const [phase, setPhase] = useState<Phase>('idle')
  const [played, setPlayed] = useState<number[]>([])
  const [show, setShow] = useState(false)
  const timers = useRef<number[]>([])
  const lastAccept = useRef(0)
  const lastReading = useRef<number | null>(null)

  const low = family === 'bass' ? 33 : 40 // tônica entre Lá1 e Sol#2 (baixo) ou Mi2 e Ré#3 (guitarra)
  const rootMidi = low + state.root
  const { phrase } = state
  const expected = expectedPcs(phrase, state.root)
  const result = checkEcho(expected, played)

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  /** Toca a frase com um compasso de contagem e depois abre o microfone. */
  const play = (p: Phrase = phrase, root = rootMidi) => {
    clearTimers()
    setPlayed([])
    setShow(false)
    setPhase('playing')
    const spb = 60 / bpm
    const t0 = audioCtx().currentTime + 0.1
    for (let b = 0; b < 4; b++) playClick(t0 + b * spb, b === 0)
    const start = t0 + 4 * spb
    const onsets = onsetBeats(parsePattern(p.pattern))
    onsets.forEach((beat, i) => {
      const d = p.degrees[i]
      // como num instrumento: o próximo ataque corta a nota; a última decai sozinha
      const next = onsets[i + 1]
      if (d === null) playClick(start + beat * spb, false)
      else playNote(root + d, start + beat * spb, 0.6, false, next === undefined ? undefined : (next - beat) * spb)
    })
    const endMs = (start - audioCtx().currentTime + phraseBeats(p) * spb) * 1000
    timers.current.push(window.setTimeout(() => setPhase('listening'), endMs))
  }

  const fresh = (nextLevel = level, idx = grooveIdx, src = source) => {
    const p = src === 'nivel' ? levelPhrase(nextLevel) : GROOVES[family][idx % GROOVES[family].length]
    const root = randomKey()
    setState({ phrase: p, root })
    play(p, low + root)
  }

  const accept = (midi: number) => {
    if (phase !== 'listening') return
    const now = nowMs()
    if (now - lastAccept.current < 120) return
    lastAccept.current = now
    const next = [...played, midi]
    setPlayed(next)
    const r = checkEcho(expected, next)
    if (r.miss !== null) {
      uiSound('miss')
      setPhase('wrong')
      setShow(true)
    } else if (r.done) {
      uiSound('star')
      setPhase('right')
      setShow(true)
      if (source === 'nivel') {
        const n = level + 1
        setLevel(n)
        saveLevel(n)
        timers.current.push(window.setTimeout(() => fresh(n), 1600))
      }
    }
  }

  // notas repetidas não mudam a altura estável: cada ataque também conta, com a última leitura
  const { status } = useAudioInput(phase === 'listening', {
    onReading: (r) => {
      lastReading.current = r ? Math.round(r.midi) : null
    },
    onNote: (m) => accept(m),
    onOnset: () => {
      timers.current.push(
        window.setTimeout(() => {
          if (lastReading.current !== null && nowMs() - lastAccept.current > 120) accept(lastReading.current)
        }, 70),
      )
    },
  })

  useHotkeys({ o: () => play(), p: () => fresh(), v: () => setShow((s) => !s) })

  const pickSource = (s: 'nivel' | 'grooves') => {
    setSource(s)
    clearTimers()
    setPhase('idle')
    setPlayed([])
    setState({ phrase: s === 'nivel' ? levelPhrase(level) : GROOVES[family][grooveIdx % GROOVES[family].length], root: state.root })
  }
  const pickGroove = (i: number) => {
    setGrooveIdx(i)
    clearTimers()
    setPhase('idle')
    setPlayed([])
    setState({ phrase: GROOVES[family][i], root: state.root })
  }

  // caixas das notas: verde = acertou, vermelho = onde errou, "?" = falta (ou o nome, se revelado)
  let k = 0
  const boxes = phrase.degrees.map((d) => {
    if (d === null) return { label: 'x', tone: 'ghost' as const }
    const idx = k++
    const pc = mod12(state.root + d)
    const tone = idx < result.ok ? 'ok' : result.miss === idx ? 'miss' : 'todo'
    return { label: tone === 'ok' || show ? noteName(pc) : '?', tone, heard: result.miss === idx ? noteName(mod12(played[idx])) : null }
  })

  return (
    <section className="panel p-5 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Headphones className="size-4" aria-hidden /> Ouvir e repetir
          </p>
          <h2 className="mt-1 font-display text-3xl font-black uppercase">{source === 'nivel' ? `Nível ${level}` : phrase.title}</h2>
          <p className="mt-1 text-sm text-pearl-dim">
            {source === 'nivel'
              ? 'O app toca uma frase curta da pentatônica menor; você repete no instrumento. Acertou, sobe de nível (mais notas, ritmos novos, depois dois compassos).'
              : phrase.about}
          </p>
        </div>
        <Segmented<'nivel' | 'grooves'>
          label="Frases"
          value={source}
          onChange={pickSource}
          options={[
            { value: 'nivel', label: 'Por nível' },
            { value: 'grooves', label: 'Grooves aplicados' },
          ]}
        />
        {source === 'grooves' && (
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Groove">
            {GROOVES[family].map((g, i) => (
              <button key={g.title} role="radio" aria-checked={grooveIdx === i} onClick={() => pickGroove(i)} className={`min-h-9 px-3 rounded-lg text-sm font-semibold ${grooveIdx === i ? 'bg-wood-700 text-pearl' : 'text-pearl-dim hover:bg-wood-800'}`}>
                {g.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => setBpm((v) => Math.max(40, v - 5))} aria-label="Mais devagar">−</Button>
          <span className="font-mono text-2xl font-bold w-12 text-center">{bpm}</span>
          <Button variant="ghost" onClick={() => setBpm((v) => Math.min(160, v + 5))} aria-label="Mais rápido">+</Button>
          <span className="text-sm text-pearl-faint">BPM</span>
          {source === 'nivel' && level > 1 && (
            <button className="ml-auto text-sm text-pearl-faint underline" onClick={() => (setLevel(1), saveLevel(1))}>
              voltar ao nível 1
            </button>
          )}
        </div>
        <p className="text-sm text-pearl-faint">
          Um compasso de contagem, a frase, e o microfone abre para você repetir. Vale a nota certa em qualquer oitava; o ritmo é para imitar, a conferência é pela ordem das notas. Ghost notes (x) não contam.
        </p>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="rounded-xl border border-wood-700/60 bg-wood-950/40 p-3">
          <RhythmStaff events={parsePattern(phrase.pattern)} marks={phrase.marks} beats={phraseBeats(phrase)} showCounts />
        </div>
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {boxes.map((b, i) => (
            <div
              key={i}
              className={`grid min-w-14 place-items-center rounded-xl border px-2 py-2 ${b.tone === 'ok' ? 'border-led-green text-led-green' : b.tone === 'miss' ? 'border-led-red text-led-red' : b.tone === 'ghost' ? 'border-wood-700 text-pearl-faint' : 'border-wood-700 text-pearl'}`}
            >
              <span className="font-display text-2xl font-black">{b.label}</span>
              {'heard' in b && b.heard && <span className="text-[11px]">tocou {b.heard}</span>}
            </div>
          ))}
        </div>
        <p className="min-h-6 text-pearl-dim">
          {phase === 'idle' && <>Aperte <Kbd>O</Kbd> para ouvir. Tônica: <strong className="text-pearl">{noteName(state.root)}</strong>.</>}
          {phase === 'playing' && 'Ouça…'}
          {phase === 'listening' &&
            (status === 'on' ? (
              <span className="inline-flex items-center gap-2"><Mic className="size-4 text-led-green" aria-hidden /> Sua vez: toque a frase ({result.ok}/{expected.length}).</span>
            ) : status === 'starting' ? (
              'Ligando a entrada de áudio…'
            ) : (
              <span className="inline-flex items-center gap-2"><MicOff className="size-4 text-led-red" aria-hidden /> Sem entrada de áudio: confira a pedaleira em Ajustes.</span>
            ))}
          {phase === 'right' && (source === 'nivel' ? 'Isso! Próxima frase, um nível acima…' : 'Isso! Groove certinho. Suba o andamento ou escolha outro.')}
          {phase === 'wrong' && `Errou na nota ${(result.miss ?? 0) + 1}: era ${boxes.filter((b) => b.tone !== 'ghost')[result.miss ?? 0]?.label}. Ouça de novo e tente.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => play()}>
            <RotateCcw className="size-5" aria-hidden /> {phase === 'idle' ? 'Ouvir' : 'Ouvir de novo'} <Kbd>O</Kbd>
          </Button>
          <Button variant="secondary" size="lg" onClick={() => fresh()}>
            <SkipForward className="size-5" aria-hidden /> Outra frase <Kbd>P</Kbd>
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setShow((s) => !s)}>
            <Eye className="size-5" aria-hidden /> {show ? 'Esconder notas' : 'Mostrar notas'} <Kbd>V</Kbd>
          </Button>
        </div>
      </div>
    </section>
  )
}
