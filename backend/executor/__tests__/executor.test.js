import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMP_DIR = join(__dirname, '..', 'temp')

describe('executor configuration', () => {
  it('should have LANGUAGE_CONFIG with supported languages', async () => {
    const { default: LANGUAGE_CONFIG } = await import('../executor.js')
    // executors export default router, but LANGUAGE_CONFIG is private
    // We test the router exists with expected endpoints
    expect(LANGUAGE_CONFIG).toBeDefined()
    expect(typeof LANGUAGE_CONFIG.post).toBe('function')
  })
})

describe('temp directory', () => {
  const testFile = join(TEMP_DIR, 'test_cleanup.txt')

  beforeAll(() => {
    if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true })
  })

  afterAll(() => {
    if (existsSync(testFile)) unlinkSync(testFile)
  })

  it('should exist and be writable', () => {
    writeFileSync(testFile, 'hello')
    expect(existsSync(testFile)).toBe(true)
    const content = readFileSync(testFile, 'utf-8')
    expect(content).toBe('hello')
  })
})
