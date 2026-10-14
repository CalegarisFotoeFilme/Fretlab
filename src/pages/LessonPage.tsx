import { ArrowLeft, RotateCcw, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { uiSound } from '../audio/engine'
import { TeachBlocks } from '../components/TeachBlocks'
import { Button, LinkButton, Meter, Stars } from '../components/ui'
import { Kbd, useHotkeys } from '../components/useHotkeys'
import { findLesson, nextLesson } from '../curriculum'
import type { Lesson } from '../curriculum/types'
import { ExerciseView } from '../exercises/ExerciseView'
import { recordAttempt, useProgress, type AttemptResult } from '../progress/progress'
import { useSettings } from '../progress/settings'

type Phase = 'teach' | 'play' | 'result'

export function LessonPage() {
  const { id = '' } = useParams()
  const found = findLesson(id)
  if (!found) {
    return (
      <div className="p-8 text-center">
        <p>Essa lição não existe.</p>
        <LinkButton to="/" className="mt-4">Voltar à trilha</LinkButton>
      </div>
    )
  }
  return <LessonRunner key={id} lesson={found.lesson} worldTitle={found.world.title} />
}

function LessonRunner({ lesson, worldTitle }: { lesson: Lesson; worldTitle: string }) {
  const [phase, setPhase] = useState<Phase>('teach')
  const [round, setRound] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<(AttemptResult & { accuracy: number }) | null>(null)
  const startedAt = useRef(0)
  const navigate = useNavigate()

  // chaves: no Chrome novo scrollTo devolve uma Promise, e o React a trataria como função de limpeza
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase])
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const onRoundDone = useCallback(
    (score: number) => {
      const all = [...scores, score]
      setScores(all)
      if (all.length >= lesson.rounds) {
        const accuracy = all.reduce((a, b) => a + b, 0) / all.length
        const seconds = (Date.now() - startedAt.current) / 1000
        void recordAttempt(lesson.id, accuracy, seconds).then((r) => {
          setResult({ ...r, accuracy })
          setPhase('result')
          if (r.stars > 0) uiSound('star')
        })
      } else setRound((r) => r + 1)
    },
    [scores, lesson],
  )

  const restart = () => {
    setScores([])
    setRound(0)
    setResult(null)
    setAttempt((a) => a + 1)
    startedAt.current = Date.now()
    setPhase('play')
  }

  useHotkeys({ Enter: () => setPhase('play') }, phase === 'teach')

  const ex = lesson.exercise
  const props = { round, onRoundDone }

  return (
    <div className="mx-auto max-w-[1760px] px-4 md:px-10 pb-10 pt-[max(1rem,env(safe-area-inset-top))] md:pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="grid place-items-center size-11 -ml-2 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Sair da lição">
          <X className="size-6" aria-hidden />
        </Link>
        {phase === 'play' ? (
          <div className="flex-1">
            <Meter value={scores.length} max={lesson.rounds} label={`Rodada ${scores.length + 1} de ${lesson.rounds}`} />
          </div>
        ) : (
          <p className="eyebrow flex-1 truncate">{worldTitle}</p>
        )}
        {phase === 'play' && (
          <span className="font-mono text-xs text-pearl-faint">
            {Math.min(scores.length + 1, lesson.rounds)}/{lesson.rounds}
          </span>
        )}
      </div>

      {phase === 'teach' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-black uppercase mb-6">{lesson.title}</h1>
          <TeachBlocks
            blocks={lesson.teach}
            footer={
              <Button size="lg" className="mt-3 w-full" onClick={() => setPhase('play')}>
                Praticar <Kbd>enter</Kbd>
              </Button>
            }
          />
        </motion.div>
      )}

      {phase === 'play' && (
        <div key={attempt} className="xl:min-h-[calc(100dvh-8rem)] xl:flex xl:flex-col xl:justify-center">
          <ExerciseView spec={ex} {...props} />
          <Button variant="ghost" className="mt-6 self-start" onClick={() => setPhase('teach')}>
            <ArrowLeft className="size-4" aria-hidden /> Rever explicação
          </Button>
        </div>
      )}

      {phase === 'result' && result && (
        <ResultView lesson={lesson} result={result} onRetry={restart} onNext={(nid) => navigate(`/licao/${nid}`)} />
      )}
    </div>
  )
}

function ResultView({
  lesson, result, onRetry, onNext,
}: { lesson: Lesson; result: AttemptResult & { accuracy: number }; onRetry: () => void; onNext: (id: string) => void }) {
  const progress = useProgress()
  const instrument = useSettings((s) => s.instrument)
  const next = progress ? nextLesson((l) => progress.lessons.get(l)?.stars ?? 0, instrument) : null
  const pct = Math.round(result.accuracy * 100)
  const headline =
    result.stars === 3 ? 'Perfeito.' : result.stars === 2 ? 'Mandou bem.' : result.stars === 1 ? 'Passou!' : 'Ainda não foi.'
  const detail =
    result.stars === 0
      ? 'Você precisa de 60% de acerto para ganhar a primeira estrela. Reveja a explicação e tente de novo, porque repetir é o que fixa.'
      : result.stars < 3
        ? 'Repita quando quiser para buscar as 3 estrelas: 95% ou mais.'
        : 'Lição dominada. Ela volta de vez em quando no treino para não esquecer.'

  return (
    <motion.div className="text-center pt-6" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <p className="eyebrow">{lesson.title}</p>
      <h1 className="mt-3 text-6xl font-black uppercase">{headline}</h1>
      <div className="mt-6 flex justify-center">
        <Stars value={result.stars} size="lg" />
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
        <div className="panel p-4">
          <dt className="eyebrow">Acerto</dt>
          <dd className="font-display text-4xl font-black mt-1">{pct}%</dd>
        </div>
        <div className="panel p-4">
          <dt className="eyebrow">XP</dt>
          <dd className="font-display text-4xl font-black mt-1 text-enclosure">+{result.xpGained}</dd>
        </div>
      </dl>
      {result.levelAfter > result.levelBefore && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-enclosure/15 px-4 py-2 font-semibold text-enclosure">
          <span className="led text-enclosure" aria-hidden /> Subiu para o nível {result.levelAfter}!
        </p>
      )}
      <p className="mt-6 text-pearl-dim max-w-md mx-auto">{detail}</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="secondary" size="lg" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden /> Repetir
        </Button>
        {next && next.id !== lesson.id ? (
          <Button size="lg" onClick={() => onNext(next.id)}>
            Próxima: {next.title}
          </Button>
        ) : (
          <LinkButton to="/" size="lg">
            Voltar à trilha
          </LinkButton>
        )}
      </div>
    </motion.div>
  )
}
