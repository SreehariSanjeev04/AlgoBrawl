import { describe, it, expect } from 'vitest'
import { calculateNewRatings } from '../eloService.js'

describe('calculateNewRatings', () => {
  it('should return default ratings for equal-rated players with a draw', () => {
    const result = calculateNewRatings(800, 800, 'draw')
    expect(result.p1New).toBe(800)
    expect(result.p2New).toBe(800)
  })

  it('should award points on win and deduct on loss', () => {
    const result = calculateNewRatings(800, 800, 'p1')
    expect(result.p1New).toBeGreaterThan(800)
    expect(result.p2New).toBeLessThan(800)
  })

  it('should adjust ratings symmetrically', () => {
    const result = calculateNewRatings(800, 800, 'p1')
    const diff1 = result.p1New - 800
    const diff2 = 800 - result.p2New
    expect(diff1).toBe(diff2)
  })

  it('should handle p2 winning', () => {
    const result = calculateNewRatings(800, 800, 'p2')
    expect(result.p1New).toBeLessThan(800)
    expect(result.p2New).toBeGreaterThan(800)
  })

  it('should always produce integer ratings', () => {
    const result = calculateNewRatings(723, 891, 'p1')
    expect(Number.isInteger(result.p1New)).toBe(true)
    expect(Number.isInteger(result.p2New)).toBe(true)
  })

  it('should handle a draw between different ratings', () => {
    const result = calculateNewRatings(1000, 800, 'draw')
    expect(result.p1New).not.toBe(1000)
    expect(result.p2New).not.toBe(800)
  })

  it('should handle ratings far apart', () => {
    const result = calculateNewRatings(2000, 600, 'p1')
    expect(result.p1New).toBeGreaterThan(2000)
    expect(result.p2New).toBeLessThan(600)
  })
})
