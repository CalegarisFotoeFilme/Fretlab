import type { InstrumentKind } from '../theory/instrument'
import type { Lesson, World } from './types'
import { world1 } from './world1-fretboard'
import { world2 } from './world2-rhythm'
import { world3 } from './world3-intervals'
import { world4 } from './world4-scales'
import { world5 } from './world5-chords'
import { world6 } from './world6-caged'
import { world7 } from './world7-harmonic-field'
import { world8 } from './world8-rhythm2'
import { world9 } from './world9-reading'
import { world10 } from './world10-bass-technique'
import { world11 } from './world11-guitar-technique'
import { world12 } from './world12-modes'
import { world13 } from './world13-harmony'

export const WORLDS: World[] = [
  world1,
  world2,
  world3,
  world4,
  world5,
  world6,
  world7,
  world13,
  world8,
  world9,
  world12,
  world10,
  world11,
]

export const ALL_LESSONS: Lesson[] = WORLDS.flatMap((w) => w.lessons)

/** Mundos da trilha para o instrumento configurado (os de técnica são de um instrumento só). */
export function worldsFor(kind: InstrumentKind) {
  const family = kind === 'guitar6' ? 'guitar' : 'bass'
  return WORLDS.filter((w) => !w.instrument || w.instrument === family)
}

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
export function nextLesson(starsOf: (id: string) => number, kind?: InstrumentKind) {
  const lessons = kind ? worldsFor(kind).flatMap((w) => w.lessons) : ALL_LESSONS
  return lessons.find((l) => starsOf(l.id) === 0) ?? null
}
