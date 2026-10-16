import { describe, expect, it } from 'vitest'
import { trackFamily, tuningLabel } from './songMeta'

describe('afinação das músicas', () => {
  it('dá nome às afinações comuns', () => {
    expect(tuningLabel('bass', [28, 33, 38, 43])).toBe('E padrão')
    expect(tuningLabel('bass', [27, 32, 37, 42])).toBe('Eb padrão')
    expect(tuningLabel('bass', [26, 31, 36, 41])).toBe('D padrão')
    expect(tuningLabel('bass', [26, 33, 38, 43])).toBe('Drop D')
    expect(tuningLabel('bass', [23, 28, 33, 38, 43])).toBe('E padrão · 5 cordas')
    expect(tuningLabel('bass', [22, 27, 32, 37, 42, 47])).toBe('Eb padrão · 6 cordas')
    expect(tuningLabel('guitar', [40, 45, 50, 55, 59, 64])).toBe('E padrão')
    expect(tuningLabel('guitar', [39, 44, 49, 54, 58, 63])).toBe('Eb padrão')
    expect(tuningLabel('guitar', [38, 45, 50, 55, 59, 64])).toBe('Drop D')
    expect(tuningLabel('guitar', [36, 43, 48, 53, 57, 62])).toBe('Drop C')
    expect(tuningLabel('guitar', [38, 45, 50, 55, 57, 62])).toBe('D A D G A D')
  })
  it('reconhece baixo e guitarra', () => {
    expect(trackFamily('Bass', [28, 33, 38, 43])).toBe('bass')
    expect(trackFamily('Guitarra base', [40, 45, 50, 55, 59, 64])).toBe('guitar')
    expect(trackFamily('Vocals', [])).toBe('other')
  })
})
