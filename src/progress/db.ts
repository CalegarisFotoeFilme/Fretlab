import Dexie, { type EntityTable } from 'dexie'

export interface LessonProgress {
  lessonId: string
  stars: number // 0..3 (melhor resultado)
  bestAccuracy: number
  attempts: number
  lastPlayedAt: number
}

export interface PracticeDay {
  day: string // YYYY-MM-DD (horário local)
  xp: number
  minutes: number
}

export interface Song {
  id?: number
  title: string
  artist: string
  songsterrUrl?: string
  file?: Blob
  fileName?: string
  /** De onde veio a tab: Guitar Pro, MusicXML ou MIDI convertido pelo FretLab. */
  origin?: 'gp' | 'musicxml' | 'midi'
  skippedTracks?: string[]
  /** mixagem do player desta música: volume geral (0–1) e por faixa (multiplicador 0–2, índice da faixa) */
  mix?: { master: number; tracks: Record<number, number> }
  /** vídeos e sincronia do Songsterr, salvos na primeira vez (funciona sem buscar de novo) */
  sync?: import('../library/songsterrSync').SongsterrSync
  notes?: string
  addedAt: number
  lastOpenedAt?: number
}

/** Andamento de cada exercício técnico do Treino do Dia. */
export interface DrillProgress {
  id: string
  /** andamento alvo atual */
  bpm: number
  /** maior andamento tocado limpo */
  best: number
  /** dias em que o exercício foi feito */
  sessions: number
  lastDay: string
}

/** Arquivos grandes do usuário (ex.: o SoundFont do player). Fora do backup JSON. */
export interface Asset {
  id: 'soundfont'
  name: string
  data: Blob
  addedAt: number
}

export const db = new Dexie('fretlab') as Dexie & {
  lessons: EntityTable<LessonProgress, 'lessonId'>
  days: EntityTable<PracticeDay, 'day'>
  songs: EntityTable<Song, 'id'>
  drills: EntityTable<DrillProgress, 'id'>
  assets: EntityTable<Asset, 'id'>
  facts: EntityTable<import('./facts').FactProgress, 'key'>
}

db.version(1).stores({
  lessons: 'lessonId, lastPlayedAt',
  days: 'day',
  songs: '++id, title, addedAt, lastOpenedAt',
})
// v2: andamentos do Treino do Dia
db.version(2).stores({ drills: 'id' })
// v3: SoundFont do usuário
db.version(3).stores({ assets: 'id' })
// v4: revisão por fato errado (nota/casa, intervalo, grau)
db.version(4).stores({ facts: 'key, due' })
