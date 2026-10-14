import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LessonProgress } from './db'
import { dayKey, levelFromXp, starsFor, streak, xpFor } from './scoring'

export interface AttemptResult {
  stars: number
  previousStars: number
  xpGained: number
  levelBefore: number
  levelAfter: number
}

export async function recordAttempt(lessonId: string, accuracy: number, seconds: number): Promise<AttemptResult> {
  return db.transaction('rw', db.lessons, db.days, async () => {
    const prev = await db.lessons.get(lessonId)
    const previousStars = prev?.stars ?? 0
    const xpGained = xpFor(accuracy, previousStars)
    const totalBefore = (await db.days.toArray()).reduce((s, d) => s + d.xp, 0)
    const stars = starsFor(accuracy)
    await db.lessons.put({
      lessonId,
      stars: Math.max(stars, previousStars),
      bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
      attempts: (prev?.attempts ?? 0) + 1,
      lastPlayedAt: Date.now(),
    })
    const key = dayKey()
    const day = (await db.days.get(key)) ?? { day: key, xp: 0, minutes: 0 }
    await db.days.put({ ...day, xp: day.xp + xpGained, minutes: day.minutes + seconds / 60 })
    return {
      stars,
      previousStars,
      xpGained,
      levelBefore: levelFromXp(totalBefore).level,
      levelAfter: levelFromXp(totalBefore + xpGained).level,
    }
  })
}

export interface ProgressSummary {
  lessons: Map<string, LessonProgress>
  xp: number
  level: ReturnType<typeof levelFromXp>
  streak: number
  practicedToday: boolean
  todayXp: number
}

export function useProgress(): ProgressSummary | undefined {
  return useLiveQuery(async () => {
    const [lessons, days] = await Promise.all([db.lessons.toArray(), db.days.toArray()])
    const xp = days.reduce((s, d) => s + d.xp, 0)
    const today = days.find((d) => d.day === dayKey())
    return {
      lessons: new Map(lessons.map((l) => [l.lessonId, l])),
      xp,
      level: levelFromXp(xp),
      streak: streak(days.map((d) => d.day)),
      practicedToday: !!today,
      todayXp: today?.xp ?? 0,
    }
  })
}

export async function exportProgress() {
  const [lessons, days] = await Promise.all([db.lessons.toArray(), db.days.toArray()])
  return JSON.stringify({ app: 'fretlab', version: 1, exportedAt: new Date().toISOString(), lessons, days }, null, 2)
}

export async function importProgress(json: string) {
  const data = JSON.parse(json)
  if (data.app !== 'fretlab') throw new Error('Este arquivo não é um backup do FretLab.')
  await db.transaction('rw', db.lessons, db.days, async () => {
    await db.lessons.bulkPut(data.lessons)
    await db.days.bulkPut(data.days)
  })
}
