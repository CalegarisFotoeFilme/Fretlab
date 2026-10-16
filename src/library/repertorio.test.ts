import { describe, expect, it } from 'vitest'
import { moveItem } from './Playlists'

describe('repertório', () => {
  it('arrastar muda a ordem sem perder nada', () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4])
    expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3])
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3])
  })
})
