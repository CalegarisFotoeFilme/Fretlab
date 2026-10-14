// Regras de gamificação: puras, para serem testáveis.

export const STAR_THRESHOLDS = [0.6, 0.8, 0.95] as const

export function starsFor(accuracy: number) {
  return STAR_THRESHOLDS.filter((t) => accuracy >= t).length
}

/** XP de uma tentativa: base por concluir + bônus por estrela nova. */
export function xpFor(accuracy: number, previousStars: number) {
  const stars = starsFor(accuracy)
  const base = Math.round(10 * accuracy)
  const newStars = Math.max(0, stars - previousStars)
  return base + newStars * 15
}

/** Nível cresce cada vez mais devagar: 0, 60, 160, 300, 480… */
export function levelFromXp(xp: number) {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, into: xp - floor, span: next - floor }
}

export function xpForLevel(level: number) {
  const n = level - 1
  return 20 * n * n + 40 * n
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Dias seguidos com prática, terminando hoje (ou ontem, se hoje ainda não teve). */
export function streak(days: string[], today = new Date()) {
  const set = new Set(days)
  const cursor = new Date(today)
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let n = 0
  while (set.has(dayKey(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return n
}
