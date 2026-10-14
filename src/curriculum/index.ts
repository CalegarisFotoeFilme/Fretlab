import type { Lesson, World } from './types'
import { world1 } from './world1-fretboard'
import { world2 } from './world2-rhythm'

const soon = (id: string, title: string, tagline: string): World => ({ id, title, tagline, lessons: [], comingSoon: true })

export const WORLDS: World[] = [
  world1,
  world2,
  soon('intervalos', 'Intervalos', 'A distância entre duas notas'),
  soon('escalas', 'Escalas', 'Maior, menor e pentatônicas'),
  soon('acordes', 'Acordes e arpejos', 'Tríades e tétrades, nota por nota'),
  soon('caged', 'CAGED e mapas', 'Desenhos que cobrem o braço inteiro'),
  soon('campo', 'Campo harmônico', 'Por que certos acordes andam juntos'),
]

export const ALL_LESSONS: Lesson[] = WORLDS.flatMap((w) => w.lessons)

export function findLesson(id: string) {
  for (const w of WORLDS) {
    const i = w.lessons.findIndex((l) => l.id === id)
    if (i >= 0) return { world: w, lesson: w.lessons[i], index: i }
  }
  return null
}

/**
 * Regras de desbloqueio: dentro do mundo, a lição anterior precisa de 1 estrela.
 * Cada mundo abre quando o mundo anterior tem pelo menos 3 lições com estrela,
 * para dar para alternar braço e ritmo cedo.
 */
export function isUnlocked(lessonId: string, starsOf: (id: string) => number) {
  const found = findLesson(lessonId)
  if (!found) return false
  const { world, index } = found
  const wi = WORLDS.indexOf(world)
  if (wi > 0) {
    const prev = WORLDS[wi - 1]
    const done = prev.lessons.filter((l) => starsOf(l.id) > 0).length
    if (done < Math.min(3, prev.lessons.length)) return false
  }
  return index === 0 || starsOf(world.lessons[index - 1].id) > 0
}

/** Próxima lição a fazer: a primeira desbloqueada e ainda sem estrela. */
export function nextLesson(starsOf: (id: string) => number) {
  return ALL_LESSONS.find((l) => isUnlocked(l.id, starsOf) && starsOf(l.id) === 0) ?? null
}
