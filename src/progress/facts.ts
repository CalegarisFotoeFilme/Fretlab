import { db } from './db'

/*
  Revisão por fato errado: além da lição inteira, o app guarda o que você errou (uma nota numa casa,
  um intervalo, um grau…). Errou → volta hoje; acertou depois → volta em 1, 3 e 7 dias; acertou
  na revisão de 7 dias → sai da lista (aprendido).
*/

export interface FactProgress {
  key: string
  /** texto curto para a lista, ex.: "F# · 2ª corda, casa 4" */
  label: string
  /** lição que treina esse fato */
  lessonId: string
  misses: number
  /** degrau da revisão (0 = acabou de errar) */
  box: number
  due: number
  lastAt: number
}

const DAY = 24 * 3600 * 1000
/** espera, em dias, depois de cada acerto (por degrau) */
export const FACT_STEPS = [1, 3, 7]

/** Estado novo do fato depois de uma resposta. `null` = não guardar (nunca errou ou já aprendeu). */
export function nextFact(prev: FactProgress | undefined, fact: Pick<FactProgress, 'key' | 'label' | 'lessonId'>, ok: boolean, now: number): FactProgress | null {
  if (!ok) return { ...fact, misses: (prev?.misses ?? 0) + 1, box: 0, due: now, lastAt: now }
  if (!prev) return null
  // só conta como avanço se a revisão estava vencida (acertar 5 vezes no mesmo dia não pula etapas)
  if (prev.due > now) return { ...prev, lastAt: now }
  if (prev.box >= FACT_STEPS.length) return null
  return { ...prev, ...fact, box: prev.box + 1, due: now + FACT_STEPS[prev.box] * DAY, lastAt: now }
}

export async function recordFact(fact: Pick<FactProgress, 'key' | 'label' | 'lessonId'>, ok: boolean, now = Date.now()) {
  const prev = await db.facts.get(fact.key)
  const next = nextFact(prev, fact, ok, now)
  if (next) await db.facts.put(next)
  else if (prev) await db.facts.delete(fact.key)
}

/** Fatos vencidos, os mais errados primeiro. */
export const dueFacts = (facts: FactProgress[], now = Date.now()) => facts.filter((f) => f.due <= now).sort((a, b) => b.misses - a.misses || a.due - b.due)
