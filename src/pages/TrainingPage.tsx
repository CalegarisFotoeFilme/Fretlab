import { useLiveQuery } from 'dexie-react-hooks'
import { Hint } from '../exercises/Hint'
import { Check, ChevronDown, ChevronUp, Dumbbell, Play, RotateCcw, Shuffle, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { audioCtx, playNote, startMetronome, uiSound, type MetronomeHandle } from '../audio/engine'
import { Fretboard, type Marker } from '../components/Fretboard'
import { Button, Meter, PageHeader, Segmented } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { findLesson } from '../curriculum'
import type { Lesson } from '../curriculum/types'
import { ExerciseView } from '../exercises/ExerciseView'
import { dueFacts } from '../progress/facts'
import { makeChallenge, type Challenge } from '../training/challenges'
import { IntervalEar } from '../training/IntervalEar'
import { EchoTrainer } from '../training/EchoTrainer'
import { db } from '../progress/db'
import { recordAttempt, recordDrill, useProgress } from '../progress/progress'
import { useInstrument, useNoteName, useSettings } from '../progress/settings'
import { midiAt, type FretPos, type Instrument } from '../theory/instrument'
import { mod12, prefersFlats } from '../theory/notes'
import { DRILLS, drillOfDay, drillsFor, drillSequence, dueReviews, keyOfDay, positionOfDay } from '../training/drills'

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

  // pontos fracos: fatos errados vencidos e as lições que treinam cada um
  const facts = dueFacts(useLiveQuery(() => db.facts.toArray(), []) ?? [])
  const factLessons = [...new Set(facts.map((f) => f.lessonId))].map((id) => findLesson(id)?.lesson).filter((l): l is Lesson => !!l)

  if (session) return <ReviewSession lessons={session} onExit={() => setSession(null)} />

  return (
    <div className="mx-auto max-w-[1760px] min-[2200px]:max-w-[2360px] px-4 md:px-10 pt-6 md:pt-8 pb-40 md:pb-28">
      <PageHeader eyebrow={`Hoje: ${progress?.todayXp ?? 0} XP · ${progress?.streak ?? 0} dias seguidos`} title="Treino do dia">
        Um aquecimento técnico curto com metrônomo, à la <em>Guitar Aerobics</em>, e a revisão das lições que estão vencendo. Dez a quinze minutos por dia rendem mais que uma maratona no fim de semana.
      </PageHeader>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] items-start">
        <div className="grid gap-6">
          <DrillPanel />
          <IntervalEar />
          <EchoTrainer />
        </div>
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
          <h2 className="eyebrow mt-6">Pontos fracos</h2>
          <p className="mt-2 text-sm text-pearl-dim">O que você errou (ou acertou só com dica) volta hoje; depois em 1, 3 e 7 dias, até sair da lista.</p>
          {facts.length ? (
            <>
              <ul className="mt-3 grid gap-1.5">
                {facts.slice(0, 8).map((f) => (
                  <li key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-wood-700 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{f.label}</span>
                      <span className="block truncate text-xs text-pearl-faint">{findLesson(f.lessonId)?.lesson.title}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-led-red">{f.misses}× errado</span>
                  </li>
                ))}
              </ul>
              {facts.length > 8 && <p className="mt-2 text-xs text-pearl-faint">+{facts.length - 8} na lista.</p>}
              <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={() => setSession(factLessons.slice(0, MAX_REVIEW))}>
                <RotateCcw className="size-4" aria-hidden /> Treinar pontos fracos
              </Button>
            </>
          ) : (
            <p className="mt-3 rounded-xl border border-wood-700/60 bg-wood-950/50 p-4 text-pearl-dim">Nenhum ponto fraco vencido. Os erros das lições aparecem aqui.</p>
          )}
        </section>
      </div>
    </div>
  )
}

// ---------- Aquecimento técnico ----------

/** sorteio fora do componente (regras do React Compiler) */
const pickRandom = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

function DrillPanel() {
  const inst = useInstrument()
  const instKind = inst.kind
  const noteName = useNoteName()
  const leftHanded = useSettings((s) => s.leftHanded)
  // sugestão do dia (fixada ao abrir a página); tom e posição podem ser trocados
  const [{ today, keyToday }] = useState(() => ({ today: drillOfDay(new Date(), instKind), keyToday: keyOfDay() }))
  const [drillId, setDrillId] = useState(today.id)
  const drill = DRILLS.find((d) => d.id === drillId)!
  const [root, setRoot] = useState(keyToday)
  const [position, setPosition] = useState(() => positionOfDay(today))
  const saved = useLiveQuery(() => db.drills.get(drillId), [drillId])
  const [bpm, setBpm] = useState<number | null>(null)
  const target = bpm ?? saved?.bpm ?? drill.startBpm
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const metro = useRef<MetronomeHandle | null>(null)
  const startedAt = useRef(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  // barra flutuante: completa ou minimizada (só metrônomo e BPM), lembrado neste navegador
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem('fretlab.treino.compact') === '1'
    } catch {
      return false
    }
  })
  const toggleCompact = () => {
    const v = !compact
    setCompact(v)
    try {
      localStorage.setItem('fretlab.treino.compact', v ? '1' : '0')
    } catch {
      // sem armazenamento local: só não lembra
    }
  }
  // "ouvir no andamento": notas agendadas + metrônomo próprio, para poder parar no meio
  const [listening, setListening] = useState(false)
  const preview = useRef<{ timers: number[]; metro: MetronomeHandle | null }>({ timers: [], metro: null })

  // desafio sorteado sobre o tema (null = modo livre: tom e posição escolhidos à mão)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  /** trecho do desafio em foco (null = o desafio inteiro) */
  const [part, setPart] = useState<number | null>(null)
  // de onde vem o sorteio: só o tom (tema fixo), só o tema (tom fixo) ou tudo
  const [scope, setScope] = useState<'tema' | 'tom' | 'tudo'>('tema')
  const newChallenge = () => {
    stop()
    stopPreview()
    setFeedback(null)
    const pool = drillsFor(instKind)
    const keyed = pool.filter((d) => d.usesKey)
    const target = scope === 'tudo' ? pickRandom(pool) : scope === 'tom' ? pickRandom(keyed) : drill
    if (target.id !== drillId) {
      setDrillId(target.id)
      setBpm(null)
    }
    const c = makeChallenge(inst, target, (pc) => noteName(pc, prefersFlats(pc)), Math.random, target.id === drill.id ? challenge?.kind : undefined, scope === 'tom' ? root : undefined)
    setChallenge(c)
    // desafio em trechos (caixas): começa estudando o primeiro
    setPart(c.parts ? 0 : null)
  }
  const seq = challenge?.seq ?? drillSequence(inst, drill, root, position)
  const perBeat = challenge?.perBeat ?? drill.perBeat
  const keyPc = challenge?.root ?? root
  const focus = part !== null ? challenge?.parts?.[part] : undefined
  // o que "Ouvir" toca: o trecho em foco ou a sequência inteira
  const playSeq = focus ? seq.slice(focus.start, focus.end) : seq
  const stopPreview = () => {
    preview.current.timers.forEach((t) => clearTimeout(t))
    preview.current.metro?.stop()
    preview.current = { timers: [], metro: null }
    setListening(false)
  }
  const stop = () => {
    metro.current?.stop()
    metro.current = null
    setRunning(false)
    setBeat(-1)
  }
  useEffect(
    () => () => {
      metro.current?.stop()
      preview.current.timers.forEach((t) => clearTimeout(t))
      preview.current.metro?.stop()
    },
    [],
  )

  const toggle = () => {
    if (running) return stop()
    stopPreview()
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
    stopPreview()
    setDrillId(id)
    setPosition(positionOfDay(DRILLS.find((d) => d.id === id)!))
    setBpm(null)
    setFeedback(null)
    setChallenge(null)
  }
  const hear = () => {
    if (listening) return stopPreview()
    stop()
    const spb = 60 / target
    const gap = spb / perBeat
    const beats = Math.ceil(playSeq.length / perBeat)
    // um compasso de contagem e depois a sequência, com o clique junto
    const m = startMetronome(target, 4, (b) => setBeat(b % 4), { totalBeats: beats + 4 })
    const lead = (m.startTime - audioCtx().currentTime) * 1000 + 4 * spb * 1000
    const timers = playSeq.map((p, i) => window.setTimeout(() => playNote(midiAt(inst, p)), lead + i * gap * 1000))
    timers.push(window.setTimeout(() => stopPreview(), lead + beats * spb * 1000 + 200))
    preview.current = { timers, metro: m }
    setListening(true)
  }
  const done = async (clean: boolean) => {
    stop()
    stopPreview()
    const minutes = minutesSince(startedAt.current)
    startedAt.current = 0
    const r = await recordDrill(drill.id, target, clean, Math.min(20, minutes))
    setBpm(null)
    uiSound(clean ? 'star' : 'ok')
    setFeedback(clean ? `Boa! Próxima meta: ${r.bpm} BPM. +${r.xp} XP` : `Tudo bem: a meta continua em ${r.bpm} BPM. Precisão antes de velocidade. +${r.xp} XP`)
  }

  useHotkeys({ ' ': toggle, n: newChallenge, c: toggleCompact, '-': () => changeBpm(target - 2), '=': () => changeBpm(target + 2), '+': () => changeBpm(target + 2) })

  // número de ordem de cada posição (a primeira vez em que ela aparece); fundamentais em laranja
  // com um trecho em foco, só ele é numerado (1, 2, 3… na ordem) e o resto aparece apagado;
  // no desafio inteiro em caixas, cada nota mostra o número da caixa
  const order = new Map<string, string>()
  const shown = focus ? playSeq : seq
  shown.forEach((p, i) => {
    const k = `${p.string}:${p.fret}`
    if (order.has(k)) return
    const owner = !focus && challenge?.parts?.find((pt) => i >= pt.start && i < pt.end)
    order.set(k, owner ? owner.tag : String(i + 1))
  })
  const isRootAt = (string: number, fret: number) => drill.usesKey && mod12(midiAt(inst, { string, fret }) - keyPc) === 0
  const markers: Marker[] = [
    ...(focus
      ? seq.filter((p) => !order.has(`${p.string}:${p.fret}`)).map((p) => ({ string: p.string, fret: p.fret, tone: 'ghost' as const, label: '' }))
      : []),
    ...[...order.entries()].map(([k, label]) => {
      const [string, fret] = k.split(':').map(Number)
      return { string, fret, tone: isRootAt(string, fret) ? ('root' as const) : ('neutral' as const), label }
    }),
  ]
  const frets = seq.map((p) => p.fret)
  // braço sempre com 12 casas (mesmo tamanho em todo exercício); só desliza se a posição passar da casa 12
  // (desafios que atravessam o braço, como as 5 caixas, mostram o trecho inteiro)
  const span = Math.max(...frets) - Math.min(...frets)
  const neckFrom = span > 12 ? Math.max(0, Math.min(...frets) - 1) : Math.min(Math.max(0, Math.max(...frets) - 12), inst.frets - 12)
  const neckTo = span > 12 ? Math.min(inst.frets, Math.max(...frets) + 1) : neckFrom + 12
  const flats = prefersFlats(keyPc)
  const lesson = drill.lesson ? findLesson(drill.lesson) : null

  return (
    // ultrawide: controles à esquerda, braço e tablatura à direita, tudo sem rolar
    <section className="panel p-5 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-8">
      <div className="flex flex-col gap-4 min-w-0">
        <div>
          <h2 className="eyebrow flex items-center gap-2">
            <Dumbbell className="size-4" aria-hidden /> Aquecimento {drill.id === today.id && <span className="text-enclosure">· exercício do dia</span>}
          </h2>
          <p className="mt-1 font-display text-4xl font-black uppercase leading-none">{drill.title}</p>
          <p className="mt-1 text-pearl-dim">{drill.focus}</p>
        </div>
        <Segmented<string> label="Exercício" value={drillId} onChange={pickDrill} options={drillsFor(instKind).map((d) => ({ value: d.id, label: d.title.split(' ')[0] }))} />

        <Segmented<'tema' | 'tom' | 'tudo'>
          label="Sorteio do desafio"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'tema', label: 'Neste tema' },
            { value: 'tom', label: `No tom de ${noteName(root, prefersFlats(root))}` },
            { value: 'tudo', label: 'Tudo aleatório' },
          ]}
        />
        {challenge ? (
          <div className="rounded-xl border border-enclosure/50 bg-enclosure/10 p-4">
            <p className="eyebrow flex items-center gap-2"><Shuffle className="size-4" aria-hidden /> Desafio</p>
            <p className="mt-1 text-lg font-semibold leading-snug">{challenge.title}</p>
            <p className="mt-1.5 text-sm text-pearl-dim">{challenge.goal}</p>
            {challenge.parts && (
              <div className="mt-3 flex flex-col gap-1" role="radiogroup" aria-label="Trecho do desafio">
                {challenge.parts.map((pt, i) => (
                  <button key={i} role="radio" aria-checked={part === i} onClick={() => setPart(i)} className={`rounded-lg px-3 py-1.5 text-left text-sm ${part === i ? 'bg-wood-700 text-pearl font-semibold' : 'text-pearl-dim hover:bg-wood-800'}`}>
                    {pt.label}
                  </button>
                ))}
                <button role="radio" aria-checked={part === null} onClick={() => setPart(null)} className={`rounded-lg px-3 py-1.5 text-left text-sm ${part === null ? 'bg-wood-700 text-pearl font-semibold' : 'text-pearl-dim hover:bg-wood-800'}`}>
                  Tudo junto (o número em cada nota é a caixa)
                </button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={hear}><Volume2 className="size-4" aria-hidden /> {listening ? 'Parar' : focus ? 'Ouvir este trecho' : 'Ouvir o desafio'}</Button>
              <Button variant="secondary" onClick={newChallenge}><Shuffle className="size-4" aria-hidden /> Novo desafio <Kbd>N</Kbd></Button>
              <Button variant="ghost" onClick={() => setChallenge(null)}>Modo livre</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={newChallenge} className="self-start">
            <Shuffle className="size-4" aria-hidden /> Desafio aleatório <Kbd>N</Kbd>
          </Button>
        )}

        {(!challenge || scope === 'tom') && drill.usesKey && (
          <div>
            <p className="eyebrow mb-1.5">
              Tom {root === keyToday ? <span className="text-enclosure">· tom do dia</span> : <button className="underline normal-case tracking-normal" onClick={() => setRoot(keyToday)}>voltar ao tom do dia ({noteName(keyToday, prefersFlats(keyToday))})</button>}
            </p>
            <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label="Tom">
              {Array.from({ length: 12 }, (_, pc) => (
                <button
                  key={pc}
                  role="radio"
                  aria-checked={root === pc}
                  onClick={() => setRoot(pc)}
                  className={`min-h-9 rounded-lg text-sm font-semibold ${root === pc ? 'bg-enclosure text-wood-950' : pc === keyToday ? 'border border-enclosure/50 text-pearl' : 'text-pearl-dim hover:bg-wood-800'}`}
                >
                  {noteName(pc, prefersFlats(pc))}
                </button>
              ))}
            </div>
          </div>
        )}
        {!challenge && <div>
          <p className="eyebrow mb-1.5">Posição: <span className="normal-case tracking-normal text-pearl-dim">{drill.positionLabel(position)}</span></p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Posição">
            {Array.from({ length: drill.positions }, (_, i) => (
              <button key={i} role="radio" aria-checked={position === i} title={drill.positionLabel(i)} onClick={() => setPosition(i)} className={`min-h-9 min-w-9 px-2 rounded-lg text-sm font-semibold ${position === i ? 'bg-wood-700 text-pearl' : 'text-pearl-dim hover:bg-wood-800'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>}

        <Hint key={`${drill.id}-${position}-${root}`} lines={drill.tips} />
        {saved?.best ? <p className="text-sm text-pearl-dim">Recorde limpo neste exercício: <span className="font-semibold text-pearl">{saved.best} BPM</span></p> : null}
      </div>

      <div className="min-w-0 flex flex-col gap-4">
        <div className="grid gap-4 2xl:grid-cols-2">
          <div className="rounded-xl border border-wood-700/60 bg-wood-950/40 p-4">
            <p className="eyebrow">Por que este exercício</p>
            <p className="mt-1.5 text-sm text-pearl/90">{drill.why}</p>
            {lesson && (
              <Link to={`/licao/${lesson.lesson.id}`} className="mt-2 inline-block text-sm text-enclosure underline">
                Rever a lição: {lesson.lesson.title}
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-wood-700/60 bg-wood-950/40 p-4">
            <p className="eyebrow">Como tocar</p>
            <p className="mt-1.5 text-sm text-pearl/90">{drill.how}</p>
            <p className="mt-2 text-xs text-pearl-faint">Marque "Toquei limpo" quando sair sem notas abafadas e sem correr: a meta sobe 4 BPM. Cada exercício guarda o seu andamento.</p>
          </div>
        </div>
        <div className="-mx-2 overflow-x-auto px-2 w-full max-w-3xl mx-auto">
          <Fretboard inst={inst} from={neckFrom} to={neckTo} markers={markers} leftHanded={leftHanded} orientation="horizontal" onPick={(p) => playNote(midiAt(inst, p))} />
        </div>
        <p className="text-xs text-pearl-faint">
          Números = ordem de tocar (a primeira vez que cada casa aparece){drill.usesKey ? `; laranja = fundamental (${noteName(keyPc, flats)})` : ''}. A tablatura abaixo mostra a sequência inteira, um compasso por bloco.
        </p>
        <TabView inst={inst} seq={seq} perBeat={perBeat} />
      </div>

      {/* controles flutuantes, como no player de tabs: sempre à mão, sem ocupar a tela */}
      <div className="fixed inset-x-2 bottom-[4.75rem] z-20 md:inset-x-auto md:bottom-4 md:left-[calc(50%+7rem)] md:-translate-x-1/2">
        {feedback && !compact && (
          <p className="mb-2 rounded-xl border border-wood-700 bg-wood-900/95 px-4 py-2 text-sm text-pearl-dim shadow-2xl backdrop-blur" role="status">
            {feedback}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-wood-700 bg-wood-900/95 p-2 shadow-2xl backdrop-blur">
          <Button onClick={toggle} className="min-w-36">
            {running ? <Square className="size-4" aria-hidden /> : <Play className="size-5" aria-hidden />} {running ? 'Parar' : 'Metrônomo'} <Kbd>espaço</Kbd>
          </Button>
          <div className="flex items-center gap-1.5 px-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`rounded-full transition-colors ${i === 0 ? 'size-4' : 'size-3'} ${beat === i ? (i === 0 ? 'bg-enclosure' : 'bg-pearl') : 'bg-wood-700'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => changeBpm(target - 2)} className="grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Diminuir andamento">−</button>
            <span className="font-display text-3xl font-black w-16 text-center leading-none" aria-live="polite" title={`${target} BPM, ${perBeat} notas por clique`}>{target}</span>
            <button onClick={() => changeBpm(target + 2)} className="grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Aumentar andamento">+</button>
            <span className="hidden sm:inline text-[11px] text-pearl-faint leading-tight">BPM<br />{perBeat}/clique</span>
          </div>
          {!compact && (
            <>
              <Button variant={listening ? 'secondary' : 'ghost'} onClick={hear} aria-pressed={listening}>
                {listening ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />} {listening ? 'Parar exemplo' : 'Ouvir'}
              </Button>
              <Button onClick={() => void done(true)}>
                <Check className="size-4" aria-hidden /> Toquei limpo
              </Button>
              <Button variant="secondary" onClick={() => void done(false)}>
                Ainda não
              </Button>
            </>
          )}
          <button
            onClick={toggleCompact}
            className="flex items-center gap-1.5 min-h-10 rounded-xl px-2.5 text-sm font-semibold text-pearl-dim hover:text-pearl hover:bg-wood-800"
            aria-expanded={!compact}
            title={compact ? 'Mostrar todos os controles (C)' : 'Minimizar os controles (C)'}
          >
            {compact ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
            <Kbd>C</Kbd>
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * Tablatura desenhada (SVG) da sequência: um compasso de 4 tempos por bloco, as notas de cada tempo
 * agrupadas e as cordas com o nome, como numa tab de verdade.
 */
function TabView({ inst, seq, perBeat }: { inst: Instrument; seq: FretPos[]; perBeat: number }) {
  const noteName = useNoteName()
  const perBar = perBeat * 4
  const bars: FretPos[][] = []
  for (let i = 0; i < seq.length; i += perBar) bars.push(seq.slice(i, i + perBar))
  const n = inst.openMidi.length
  const GAP = 13 // distância entre cordas
  const CELL = 22
  const BEAT_GAP = 10
  const PAD = 30
  const height = GAP * (n - 1) + 24
  // largura fixa (a de um compasso de semicolcheias) para todo exercício ter o mesmo tamanho na tela;
  // as notas se espalham dentro de cada tempo conforme quantas cabem nele
  const beatW = 4 * CELL + BEAT_GAP
  const xOf = (i: number) => PAD + Math.floor(i / perBeat) * beatW + ((i % perBeat) + 0.5) * ((beatW - BEAT_GAP) / perBeat)
  const width = PAD + 4 * beatW - BEAT_GAP + 10
  const yOf = (string: number) => 12 + GAP * (n - 1 - string) // corda grave embaixo
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
      {bars.map((bar, bi) => (
        <figure key={bi} className="rounded-lg border border-wood-700/50 bg-wood-950/40 px-1 py-2">
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={`Tablatura, compasso ${bi + 1}`}>
            {inst.openMidi.map((open, s) => (
              <g key={s}>
                <text x={10} y={yOf(s) + 4} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-pearl-faint)">
                  {noteName(mod12(open))}
                </text>
                <line x1={20} x2={width - 4} y1={yOf(s)} y2={yOf(s)} stroke="var(--color-wood-600)" strokeWidth={1} />
              </g>
            ))}
            <line x1={20} x2={20} y1={yOf(n - 1)} y2={yOf(0)} stroke="var(--color-pearl-faint)" strokeWidth={1.5} />
            <line x1={width - 4} x2={width - 4} y1={yOf(n - 1)} y2={yOf(0)} stroke="var(--color-pearl-faint)" strokeWidth={1.5} />
            {bar.map((p, i) => (
              <g key={i}>
                <rect x={xOf(i) - 8} y={yOf(p.string) - 7} width={16} height={14} rx={3} fill="var(--color-wood-900)" />
                <text x={xOf(i)} y={yOf(p.string) + 4} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="var(--font-mono)" fill="var(--color-pearl)">
                  {p.fret}
                </text>
              </g>
            ))}
          </svg>
          <figcaption className="px-2 font-mono text-[10px] text-pearl-faint">compasso {bi + 1}</figcaption>
        </figure>
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
        <ExerciseView spec={lesson.exercise} round={round} onRoundDone={(s) => void onRoundDone(s)} lessonId={lesson.id} />
      </div>
    </div>
  )
}
