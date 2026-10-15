import { Ear, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { audioCtx, playClick, playNote, uiSound } from '../audio/engine'
import { Button, Segmented } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { recordFact } from '../progress/facts'
import { ALL_EAR, EAR_BEATS, EAR_MODULES, nextEarQuestion, type EarPlayMode, type EarQuestion } from './earModules'

const MODULES = [...EAR_MODULES, ALL_EAR]
const LESSON = 'w3-ouvido-1'

/** Toca o intervalo dentro de um tempo: juntas, ou uma nota em cada metade do tempo. */
function playEar(q: EarQuestion, beatSec: number) {
  const t = audioCtx().currentTime + 0.02
  if (q.harmonic) {
    playNote(q.root, t, 0.45)
    playNote(q.root + q.semis, t, 0.45)
  } else {
    playNote(q.root, t, 0.55)
    playNote(q.root + q.semis, t + Math.min(0.6, beatSec / 2), 0.55)
  }
}

interface Score {
  ok: number
  miss: number
  streak: number
  best: number
}
const EMPTY: Score = { ok: 0, miss: 0, streak: 0, best: 0 }

/**
 * Intervalos de ouvido em fluxo contínuo de 4 tempos: 1 ouve, 2 pausa, 3 responde, 4 confere.
 * O jogo não para quando você erra; o andamento define a pressão.
 */
export function IntervalEar() {
  const [moduleId, setModuleId] = useState(EAR_MODULES[0].id)
  const mod = MODULES.find((m) => m.id === moduleId)!
  const [mode, setMode] = useState<EarPlayMode>('melodic')
  const [bpm, setBpm] = useState(60)
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const [question, setQuestion] = useState<EarQuestion | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState<Score>(EMPTY)
  const [replay, setReplay] = useState(true)
  // resposta da rodada, lida pelo relógio do ciclo no tempo 4
  const answer = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    const beatMs = 60000 / bpm
    const history: number[] = []
    let q: EarQuestion | null = null
    let b = -1
    const tick = () => {
      b = (b + 1) % 4
      setBeat(b)
      playClick(audioCtx().currentTime + 0.01, b === 0)
      if (b === 0) {
        q = nextEarQuestion(mod.intervals, mode, history)
        history.push(q.semis)
        answer.current = null
        setChosen(null)
        setQuestion(q)
        playEar(q, beatMs / 1000)
      }
      if (b === 3 && q) {
        const ok = answer.current === q.semis
        uiSound(ok ? 'ok' : 'miss')
        if (replay) setTimeout(() => q && playEar(q, beatMs / 1000), 150)
        setScore((s) => {
          const streak = ok ? s.streak + 1 : 0
          return { ok: s.ok + (ok ? 1 : 0), miss: s.miss + (ok ? 0 : 1), streak, best: Math.max(s.best, streak) }
        })
        const label = mod.labels[mod.intervals.indexOf(q.semis)]
        void recordFact({ key: `hear-interval:${q.semis}`, label: `Ouvir a ${label}`, lessonId: LESSON }, ok)
      }
    }
    tick()
    const id = window.setInterval(tick, beatMs)
    return () => {
      clearInterval(id)
      setBeat(-1)
    }
  }, [running, bpm, mod, mode, replay])

  const choose = (semis: number) => {
    // vale responder do tempo 1 ao 3; no 4 a resposta já foi conferida
    if (!running || beat === 3 || answer.current !== null) return
    answer.current = semis
    setChosen(semis)
  }
  const toggle = () => {
    setRunning((r) => !r)
    if (!running) setScore(EMPTY)
  }
  useHotkeys({
    ...Object.fromEntries(mod.intervals.map((s, i) => [String(i + 1), () => choose(s)])),
    Enter: toggle,
  })

  const total = score.ok + score.miss
  const reveal = beat === 3 && question

  return (
    <section className="panel p-5 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Ear className="size-4" aria-hidden /> Ouvido · intervalos
          </p>
          <h2 className="mt-1 font-display text-3xl font-black uppercase">{mod.title}</h2>
          <p className="mt-1 text-sm text-pearl-dim">{mod.tip}</p>
        </div>
        <Segmented<string> label="Módulo" value={moduleId} onChange={(v) => { setModuleId(v); setRunning(false) }} options={MODULES.map((m, i) => ({ value: m.id, label: m.id === 'todos' ? 'Todos' : `${i + 1}` }))} />
        <Segmented<EarPlayMode>
          label="Como tocar"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'melodic', label: 'Separadas' },
            { value: 'harmonic', label: 'Juntas' },
            { value: 'both', label: 'Alternar' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => setBpm((v) => Math.max(30, v - 5))} aria-label="Mais devagar">−</Button>
          <span className="font-mono text-2xl font-bold w-12 text-center">{bpm}</span>
          <Button variant="ghost" onClick={() => setBpm((v) => Math.min(140, v + 5))} aria-label="Mais rápido">+</Button>
          <span className="text-sm text-pearl-faint">BPM</span>
          <label className="ml-auto flex items-center gap-2 text-sm text-pearl-dim">
            <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} /> Repetir ao conferir
          </label>
        </div>
        <p className="text-sm text-pearl-faint">
          Ciclo de 4 tempos: <strong>1</strong> ouça, <strong>2</strong> pausa, <strong>3</strong> responda (teclas <Kbd>1</Kbd> <Kbd>2</Kbd>), <strong>4</strong> confira. Errou? O jogo segue. Comece devagar e suba o andamento quando acertar quase tudo.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex gap-3" aria-live="polite">
          {EAR_BEATS.map((name, i) => (
            <div key={i} className={`grid w-24 place-items-center rounded-xl border px-2 py-3 transition-colors ${beat === i ? 'border-enclosure bg-enclosure/20 text-pearl' : 'border-wood-700 text-pearl-faint'}`}>
              <span className="font-display text-3xl font-black">{i + 1}</span>
              <span className="text-xs">{name}</span>
            </div>
          ))}
        </div>

        <div className={`grid w-full max-w-2xl gap-3 ${mod.intervals.length > 2 ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-2'}`}>
          {mod.intervals.map((s, i) => {
            const right = reveal && s === question.semis
            const wrong = reveal && s === chosen && s !== question.semis
            const picked = !reveal && s === chosen
            return (
              <Button
                key={s}
                variant="secondary"
                size="lg"
                className={`justify-start ${right ? 'ring-2 ring-led-green' : wrong ? 'ring-2 ring-led-red' : picked ? 'ring-2 ring-enclosure' : ''}`}
                onClick={() => choose(s)}
              >
                {mod.intervals.length <= 9 && <Kbd>{i + 1}</Kbd>}
                <span className="font-display text-xl font-black">{mod.labels[i]}</span>
              </Button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={toggle}>
            {running ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />} {running ? 'Parar' : 'Começar'} <Kbd>enter</Kbd>
          </Button>
          <span className="font-mono text-sm text-pearl-dim">
            {score.ok}/{total} certos{total ? ` (${Math.round((score.ok / total) * 100)}%)` : ''} · sequência {score.streak} · melhor {score.best}
          </span>
        </div>
      </div>
    </section>
  )
}
