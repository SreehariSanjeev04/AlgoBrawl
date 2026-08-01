import { describe, it, expect } from 'vitest'
import BucketQueue from '../../src/matchmaking/BucketQueue.js'

describe('BucketQueue', () => {
  it('matches two players within the 200-point window', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(800, 1, 's1')
    q.enqueue(950, 2, 's2')
    const pair = q.tryMatch()
    expect(pair).not.toBeNull()
    expect([pair.p1.id, pair.p2.id].sort()).toEqual([1, 2])
    expect(q.size()).toBe(0)
  })

  it('matches two players with identical ratings from the same bucket', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(800, 1, 's1')
    q.enqueue(800, 2, 's2')
    q.enqueue(800, 3, 's3')
    const pair = q.tryMatch()
    expect(pair).not.toBeNull()
    expect(q.size()).toBe(1)
  })

  it('does not match players outside the 200-point window', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(800, 1, 's1')
    q.enqueue(1001, 2, 's2')
    expect(q.tryMatch()).toBeNull()
    expect(q.size()).toBe(2)
  })

  it('clamps out-of-range ratings without crashing', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(100, 1, 's1')
    q.enqueue(700, 2, 's2')
    q.enqueue(9000, 3, 's3')
    const pair = q.tryMatch()
    expect(pair).not.toBeNull()
    expect([pair.p1.id, pair.p2.id].sort()).toEqual([1, 2])
    expect(q.size()).toBe(1)
  })

  it('removes a queued user by id', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(800, 1, 's1')
    q.enqueue(900, 2, 's2')
    expect(q.remove(1)).toBe(true)
    expect(q.size()).toBe(1)
    expect(q.tryMatch()).toBeNull()
    expect(q.remove(99)).toBe(false)
  })

  it('ignores duplicate enqueues for the same user', () => {
    const q = new BucketQueue(600, 2000)
    q.enqueue(800, 1, 's1')
    q.enqueue(850, 1, 's1b')
    expect(q.size()).toBe(1)
  })

  it('reports size and emptiness correctly', () => {
    const q = new BucketQueue(600, 2000)
    expect(q.size()).toBe(0)
    expect(q.hasAtLeastTwoPlayers()).toBe(false)
    q.enqueue(800, 1, 's1')
    q.enqueue(900, 2, 's2')
    expect(q.size()).toBe(2)
    expect(q.hasAtLeastTwoPlayers()).toBe(true)
  })
})
