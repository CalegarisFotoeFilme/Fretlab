import type { Lesson, World } from './types'
import { world1 } from './world1-fretboard'
import { world2 } from './world2-rhythm'
import { world3 } from './world3-intervals'
import { world4 } from './world4-scales'
import { world5 } from './world5-chords'
import { world6 } from './world6-caged'
import { world7 } from './world7-harmonic-field'

export const WORLDS: World[] = [
  world1,
  world2,
  world3,
  world4,
  world5,
  world6,
  world7,
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
 * Tudo fica aberto desde o início (escolha do usuário: a trilha é um roteiro, não uma corrente).
 * A próxima lição sugerida é a primeira, na ordem da trilha, ainda sem estrela.
 */
export function nextLesson(starsOf: (id: string) => number) {
  return ALL_LESSONS.find((l) => starsOf(l.id) === 0) ?? null
}
