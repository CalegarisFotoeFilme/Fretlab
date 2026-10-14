import { describe, expect, it } from 'vitest'
import { levelFromXp, starsFor, streak, xpFor } from './scoring'

describe('pontuação', () => {
  it('dá estrelas por precisão', () => {
    expect(starsFor(0.5)).toBe(0)
    expect(starsFor(0.6)).toBe(1)
    expect(starsFor(0.9)).toBe(2)
    expect(starsFor(1)).toBe(3)
  })

  it('só dá bônus por estrela nova', () => {
    expect(xpFor(1, 0)).toBe(10 + 45)
    expect(xpFor(1, 3)).toBe(10)
  })

  it('calcula nível', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, span: 60 })
    expect(levelFromXp(60).level).toBe(2)
    expect(levelFromXp(159).level).toBe(2)
    expect(levelFromXp(160).level).toBe(3)
  })

  it('conta sequência de dias', () => {
    const today = new Date(2026, 9, 14)
    expect(streak(['2026-10-14', '2026-10-13', '2026-10-12'], today)).toBe(3)
    expect(streak(['2026-10-13', '2026-10-12'], today)).toBe(2) // hoje ainda não praticou
    expect(streak(['2026-10-11'], today)).toBe(0)
  })
})
