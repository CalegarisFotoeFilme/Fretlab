import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Dumbbell, Play, RotateCcw, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { playNote, startMetronome, uiSound, type MetronomeHandle } from '../audio/engine'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button, Meter, PageHeader, Segmented } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { findLesson } from '../curriculum'
import type { Lesson } from '../curriculum/types'
import { ExerciseView } from '../exercises/ExerciseView'
import { db } from '../progress/db'
import { recordAttempt, recordDrill, useProgress } from '../progress/progress'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, stringNumber, type FretPos, type Instrument } from '../theory/instrument'
import { prefersFlats } from '../theory/notes'
import { DRILLS, drillOfDay, drillSequence, dueReviews, keyOfDay } from '../training/drills'

/** Rodadas de cada lição na revisão mista (curta, como um "flashcard" da lição). */
const REVIEW_ROUNDS = 3
const MAX_REVIEW = 4
/** Minutos desde o início do aquecimento (3 se o metrônomo nem foi ligado). */
const minutesSince = (t: number) => (t ? (Date.now() - t) / 60000 : 3)

export function TrainingPage() {
  const progress = useProgress()
  const [session, setSession] = useState<Lesson[] | null>(null)

  const due = progress
    ? dueReviews([...progress.lessons.values()].map((l) => ({ lessonId: l.lessonId, stars: l.stars, lastPlayedAt: l.lastPlayedAt })))
        .map((d) => findLesson(d.lessonId)?.lesson)
        .filter((l): l is Lesson => !!l)
    : []

  if (session) return <ReviewSession lessons={session} onExit={() => setSession(null)} />

  return (
    <div className="mx-auto max-w-[1760px] min-[2200px]:max-w-[2360px] px-4 md:px-10 py-6 md:py-8">
      <PageHeader eyebrow={`Hoje: ${progress?.todayXp ?? 0} XP · ${progress?.streak ?? 0} dias seguidos`} title="Treino do dia">
        Um aquecimento técnico curto com metrônomo, à la <em>Guitar Aerobics</em>, e a revisão das lições que estão vencendo. Dez a quinze minutos por dia rendem mais que uma maratona no fim de semana.
      </PageHeader>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] items-start">
        <DrillPanel />
        <section className="panel p-5 self-start">
          <h2 className="eyebrow">Revisão espaçada</h2>
          <p className="mt-2 text-sm text-pearl-dim">
            Lições voltam em intervalos que crescem com as estrelas: reprovada volta no mesmo dia; 1 estrela, no dia seguinte; 2, em 3 dias; 3, em uma semana.
          </p>
          {due.length ? (
            <>
              <ul className="mt-4 grid gap-1.5">
                {due.slice(0, MAX_REVIEW).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-wood-700 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{l.title}</span>
                      <span className="block text-xs text-pearl-faint">{findLesson(l.id)?.world.title}</span>
                    </span>
                    <span className="font-mono text-xs text-pearl-faint">{'★'.repeat(progress?.lessons.get(l.id)?.stars ?? 0) || '—'}</span>
                  </li>
                ))}
              </ul>
              {due.length > MAX_REVIEW && <p className="mt-2 text-xs text-pearl-faint">+{due.length - MAX_REVIEW} na fila para os próximos dias.</p>}
              <Button size="lg" className="mt-4 w-full" onClick={() => setSession(due.slice(0, MAX_REVIEW))}>
                <RotateCcw className="size-4" aria-hidden /> Revisar agora ({Math.min(due.length, MAX_REVIEW) * REVIEW_ROUNDS} rodadas)
              </Button>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-wood-700/60 bg-wood-950/50 p-4 text-pearl-dim">
              Nada vencido hoje. Faça uma lição nova na <Link to="/" className="text-enclosure underline">Trilha</Link>: ela entra na fila de revisão.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

// ---------- Aquecimento técnico ----------

function DrillPanel() {
  const inst = useInstrument()
  const noteName = useNoteName()
  const leftHanded = useSettings((s) => s.leftHanded)
  // exercício e tom do dia: fixados ao abrir a página
  const [{ today, root }] = useState(() => ({ today: drillOfDay(), root: keyOfDay() }))
  const [drillId, setDrillId] = useState(today.id)
  const drill = DRILLS.find((d) => d.id === drillId)!
  const saved = useLiveQuery(() => db.drills.get(drillId), [drillId])
  const [bpm, setBpm] = useState<number | null>(null)
  const target = bpm ?? saved?.bpm ?? drill.startBpm
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const metro = useRef<MetronomeHandle | null>(null)
  const startedAt = useRef(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const seq = drillSequence(inst, drill, root)
  const stop = () => {
    metro.current?.stop()
    metro.current = null
    setRunning(false)
    setBeat(-1)
  }
  useEffect(() => stop, [])

  const toggle = () => {
    if (running) return stop()
    startedAt.current ||= Date.now()
    metro.current = startMetronome(target, 4, (b) => setBeat(b % 4))
    setRunning(true)
  }
  const changeBpm = (v: number) => {
    const next = Math.min(240, Math.max(30, v))
    setBpm(next)
    if (running) {
      metro.current?.stop()
      metro.current = startMetronome(next, 4, (b) => setBeat(b % 4))
    }
  }
  const pickDrill = (id: string) => {
    stop()
    setDrillId(id)
    setBpm(null)
    setFeedback(null)
  }
  const hear = () => {
    const gap = 60 / target / drill.perBeat
    seq.forEach((p, i) => setTimeout(() => playNote(midiAt(inst, p)), i * gap * 1000))
  }
  const done = async (clean: boolean) => {
    stop()
    const minutes = minutesSince(startedAt.current)
    startedAt.current = 0
    const r = await recordDrill(drill.id, target, clean, Math.min(20, minutes))
    setBpm(null)
    uiSound(clean ? 'star' : 'ok')
    setFeedback(clean ? `Boa! Próxima meta: ${r.bpm} BPM. +${r.xp} XP` : `Tudo bem: a meta continua em ${r.bpm} BPM. Precisão antes de velocidade. +${r.xp} XP`)
  }

  useHotkeys({ ' ': toggle, '-': () => changeBpm(target - 2), '=': () => changeBpm(target + 2), '+': () => changeBpm(target + 2) })

  // número de ordem de cada posição (a primeira vez em que ela aparece)
  const order = new Map<string, number>()
  seq.forEach((p, i) => {
    const k = `${p.string}:${p.fret}`
    if (!order.has(k)) order.set(k, i + 1)
  })
  const rootPc = root
  const markers: Marker[] = [...order.entries()].map(([k, i]) => {
    const [string, fret] = k.split(':').map(Number)
    const isRoot = (midiAt(inst, { string, fret }) - rootPc) % 12 === 0 && drill.id !== 'aranha'
    return { string, fret, tone: isRoot ? 'root' : 'neutral', label: String(i) }
  })
  const frets = seq.map((p) => p.fret)
  const flats = prefersFlats(root)
  const keyLabel = drill.id === 'aranha' ? 'casas 1 a 5' : `tom de ${noteName(root, flats)}`

  return (
    // ultrawide: controles à esquerda, braço e tablatura à direita, tudo sem rolar
    <section className="panel p-5 grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-8">
      <div className="flex flex-col gap-4 min-w-0">
        <div>
          <h2 className="eyebrow flex items-center gap-2">
            <Dumbbell className="size-4" aria-hidden /> Aquecimento {drill.id === today.id && <span className="text-enclosure">· exercício do dia</span>}
          </h2>
          <p className="mt-1 font-display text-4xl font-black uppercase leading-none">{drill.title}</p>
          <p className="mt-1 text-pearl-dim">
            {drill.focus} · {keyLabel}
          </p>
        </div>
        <Segmented<string> label="Exercício" value={drillId} onChange={pickDrill} options={DRILLS.map((d) => ({ value: d.id, label: d.title.split(' ')[0] }))} />
        <p className="text-pearl/90">{drill.how}</p>

        <div className="rounded-xl border border-wood-700/70 bg-wood-950/50 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => changeBpm(target - 2)} className="grid place-items-center size-10 rounded-lg border border-wood-700 hover:bg-wood-800" aria-label="Diminuir andamento">−</button>
            <span className="font-display text-5xl font-black w-24 text-center leading-none" aria-live="polite">{target}</span>
            <button onClick={() => changeBpm(target + 2)} className="grid place-items-center size-10 rounded-lg border border-wood-700 hover:bg-wood-800" aria-label="Aumentar andamento">+</button>
            <span className="text-sm text-pearl-dim leading-tight">
              BPM <Kbd>−</Kbd> <Kbd>+</Kbd>
              <br />
              {drill.perBeat === 4 ? '4 notas por clique' : '2 notas por clique'}
            </span>
          </div>
          {saved?.best ? <p className="text-xs text-pearl-faint">Recorde limpo: {saved.best} BPM</p> : null}
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={toggle} className="flex-1">
              {running ? <Square className="size-4" aria-hidden /> : <Play className="size-5" aria-hidden />} {running ? 'Parar' : 'Metrônomo'} <Kbd>espaço</Kbd>
            </Button>
            <div className="flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`rounded-full transition-colors ${i === 0 ? 'size-5' : 'size-4'} ${beat === i ? (i === 0 ? 'bg-enclosure' : 'bg-pearl') : 'bg-wood-700'}`} />
              ))}
            </div>
          </div>
          <Button variant="ghost" onClick={hear}>
            <Volume2 className="size-4" aria-hidden /> Ouvir no andamento
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" className="flex-1" onClick={() => void done(true)}>
            <Check className="size-5" aria-hidden /> Toquei limpo a {target}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => void done(false)}>
            Ainda não
          </Button>
        </div>
        {feedback && <p className="text-sm text-pearl-dim" role="status">{feedback}</p>}
        <p className="text-xs text-pearl-faint">
          Toque o exercício algumas vezes no andamento. Se saiu limpo (sem notas abafadas, sem correr), marque e a meta sobe 4 BPM. Cada exercício guarda o seu próprio andamento.
        </p>
      </div>

      <div className="min-w-0 flex flex-col justify-center gap-4">
        <div className="-mx-2 overflow-x-auto px-2">
          <Fretboard inst={inst} from={Math.max(0, Math.min(...frets) - 1)} to={Math.min(inst.frets, Math.max(...frets) + 1)} markers={markers} leftHanded={leftHanded} orientation="horizontal" onPick={(p) => playNote(midiAt(inst, p))} />
        </div>
        <p className="text-xs text-pearl-faint">Os números são a ordem de tocar (a primeira vez em que cada casa aparece); a tablatura abaixo mostra a sequência completa, subindo e descendo.</p>
        <TabStrip inst={inst} seq={seq} perBeat={drill.perBeat} />
      </div>
    </section>
  )
}

/** Tablatura simples da sequência, em linhas de 16 notas. */
function TabStrip({ inst, seq, perBeat }: { inst: Instrument; seq: FretPos[]; perBeat: number }) {
  const strings = [...inst.openMidi.keys()].reverse()
  const chunk = perBeat * 4
  const rows: FretPos[][] = []
  for (let i = 0; i < seq.length; i += chunk) rows.push(seq.slice(i, i + chunk))
  return (
    <div className="grid gap-x-8 gap-y-2 min-[2200px]:grid-cols-2">
      {rows.map((row, ri) => (
        <pre key={ri} className="min-w-0 overflow-x-auto font-mono text-sm leading-5 text-pearl-dim" aria-label={`Tablatura, linha ${ri + 1}`}>
          {strings
            .map((s) => {
              const cells = row.map((p, i) => {
                const cell = p.string === s ? String(p.fret) : '-'
                const sep = (i + 1) % perBeat === 0 ? ' |' : ''
                return cell.padStart(2, '-') + '-' + sep
              })
              return `${String(stringNumber(inst, s)).padStart(1)} |-${cells.join('')}`
            })
            .join('\n')}
        </pre>
      ))}
    </div>
  )
}

// ---------- Revisão mista ----------

function ReviewSession({ lessons, onExit }: { lessons: Lesson[]; onExit: () => void }) {
  const [i, setI] = useState(0)
  const [round, setRound] = useState(0)
  const [scores, setScores] = useState<number[][]>(() => lessons.map(() => []))
  const [finished, setFinished] = useState<{ title: string; acc: number; stars: number }[] | null>(null)
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])
  const total = lessons.length * REVIEW_ROUNDS
  const doneCount = i * REVIEW_ROUNDS + round
  const lesson = lessons[i]

  const onRoundDone = async (score: number) => {
    const next = scores.map((s, k) => (k === i ? [...s, score] : s))
    setScores(next)
    if (round + 1 < REVIEW_ROUNDS) return setRound(round + 1)
    if (i + 1 < lessons.length) {
      setI(i + 1)
      setRound(0)
      return
    }
    const seconds = (Date.now() - startedAt.current) / 1000 / lessons.length
    const results = []
    for (let k = 0; k < lessons.length; k++) {
      const acc = next[k].reduce((a, b) => a + b, 0) / next[k].length
      const r = await recordAttempt(lessons[k].id, acc, seconds)
      results.push({ title: lessons[k].title, acc, stars: r.stars })
    }
    uiSound('star')
    setFinished(results)
  }

  if (finished)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="eyebrow">Revisão concluída</p>
        <h1 className="mt-2 text-5xl font-black uppercase">Feito por hoje.</h1>
        <ul className="mt-6 grid gap-2 text-left">
          {finished.map((r) => (
            <li key={r.title} className="panel flex items-center justify-between px-4 py-3">
              <span className="font-semibold">{r.title}</span>
              <span className="font-mono text-sm">
                {Math.round(r.acc * 100)}% · {'★'.repeat(r.stars) || '—'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-pearl-dim">Cada lição volta para a fila no intervalo das estrelas desta revisão.</p>
        <Button size="lg" className="mt-6" onClick={onExit}>Voltar ao treino</Button>
      </div>
    )

  return (
    <div className="mx-auto max-w-[1760px] px-4 md:px-10 pb-10 pt-6 md:pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={onExit} aria-label="Sair da revisão">Sair</Button>
        <div className="flex-1">
          <Meter value={doneCount} max={total} label={`Rodada ${doneCount + 1} de ${total}`} />
        </div>
        <span className="font-mono text-xs text-pearl-faint">
          {lesson.title} · {round + 1}/{REVIEW_ROUNDS}
        </span>
      </div>
      <div key={lesson.id} className="xl:min-h-[calc(100dvh-8rem)] xl:flex xl:flex-col xl:justify-center">
        <ExerciseView spec={lesson.exercise} round={round} onRoundDone={(s) => void onRoundDone(s)} />
      </div>
    </div>
  )
}
