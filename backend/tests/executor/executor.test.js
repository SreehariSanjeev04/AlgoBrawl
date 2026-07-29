import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMP_DIR = join(__dirname, '..', '..', 'src', 'executor', 'temp')

describe('executor service', () => {
  it('should export executorService with required methods', async () => {
    const { executorService } = await import('../../src/services/executor.service.js')
    expect(executorService).toBeDefined()
    expect(typeof executorService.runCode).toBe('function')
    expect(typeof executorService.submitCode).toBe('function')
    expect(typeof executorService.getConfig).toBe('function')
  })

  it('should return config for supported languages', async () => {
    const { executorService } = await import('../../src/services/executor.service.js')
    expect(executorService.getConfig('python')).not.toBeNull()
    expect(executorService.getConfig('cpp')).not.toBeNull()
    expect(executorService.getConfig('javascript')).toBeNull()
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
