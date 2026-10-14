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

export const db = new Dexie('fretlab') as Dexie & {
  lessons: EntityTable<LessonProgress, 'lessonId'>
  days: EntityTable<PracticeDay, 'day'>
  songs: EntityTable<Song, 'id'>
  drills: EntityTable<DrillProgress, 'id'>
}

db.version(1).stores({
  lessons: 'lessonId, lastPlayedAt',
  days: 'day',
  songs: '++id, title, addedAt, lastOpenedAt',
})
// v2: andamentos do Treino do Dia
db.version(2).stores({ drills: 'id' })
