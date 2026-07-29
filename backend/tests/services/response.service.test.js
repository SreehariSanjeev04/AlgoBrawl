import { describe, it, expect } from 'vitest'
import ApiResponse from '../../src/services/response.service.js'

describe('ApiResponse', () => {
  it('should create a success response with message and data', () => {
    const res = ApiResponse.success('Operation successful', { id: 1 })
    expect(res.success).toBe(true)
    expect(res.message).toBe('Operation successful')
    expect(res.data).toEqual({ id: 1 })
    expect(res.error).toBeNull()
    expect(res.meta).toBeNull()
  })

  it('should create a success response with meta', () => {
    const res = ApiResponse.success('Done', [1, 2], { count: 2 })
    expect(res.success).toBe(true)
    expect(res.data).toEqual([1, 2])
    expect(res.meta).toEqual({ count: 2 })
  })

  it('should create a success response without data', () => {
    const res = ApiResponse.success('No content')
    expect(res.success).toBe(true)
    expect(res.data).toBeNull()
  })

  it('should create an error response with message and error detail', () => {
    const res = ApiResponse.error('Something failed', 'Invalid input')
    expect(res.success).toBe(false)
    expect(res.message).toBe('Something failed')
    expect(res.error).toBe('Invalid input')
    expect(res.data).toBeNull()
    expect(res.meta).toBeNull()
  })

  it('should create an error response without error detail', () => {
    const res = ApiResponse.error('Failed')
    expect(res.success).toBe(false)
    expect(res.message).toBe('Failed')
    expect(res.error).toBeNull()
  })

  it('should create an error response with meta', () => {
    const res = ApiResponse.error('Rate limited', null, { retryAfter: 5 })
    expect(res.success).toBe(false)
    expect(res.meta).toEqual({ retryAfter: 5 })
  })

  it('should create instance via constructor', () => {
    const res = new ApiResponse({ success: true, message: 'hi', data: [1], error: null, meta: { k: 'v' } })
    expect(res.success).toBe(true)
    expect(res.message).toBe('hi')
    expect(res.data).toEqual([1])
    expect(res.meta).toEqual({ k: 'v' })
  })
})
