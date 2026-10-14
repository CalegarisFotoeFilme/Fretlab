import type { Lesson, World } from './types'
import { world1 } from './world1-fretboard'
import { world2 } from './world2-rhythm'
import { world3 } from './world3-intervals'

const soon = (id: string, title: string, tagline: string, approach: string): World => ({ id, title, tagline, approach, lessons: [], comingSoon: true })

export const WORLDS: World[] = [
  world1,
  world2,
  world3,
  soon('escalas', 'Escalas', 'Maior, menor e pentatônicas', 'Padrões de Serna + estudo por posições de Leavitt.'),
  soon('acordes', 'Acordes e arpejos', 'Tríades e tétrades, nota por nota', 'Construção pela fórmula, como em The Guitar Handbook (Ralph Denyer).'),
  soon('caged', 'CAGED e mapas', 'Desenhos que cobrem o braço inteiro', 'Sistema CAGED como apresentado por Desi Serna.'),
  soon('campo', 'Campo harmônico', 'Por que certos acordes andam juntos', 'Campo harmônico aplicado às suas músicas, à la Serna.'),
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
