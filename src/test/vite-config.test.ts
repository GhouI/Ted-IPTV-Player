import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'

describe('Vite Bundle Analyzer Configuration', () => {
  const distDir = resolve(__dirname, '../../dist')
  const statsFile = resolve(distDir, 'stats.html')

  beforeAll(() => {
    // Clean dist directory before test
    if (existsSync(distDir)) {
      rmSync(distDir, { recursive: true, force: true })
    }
    // Run the build once for all tests
    execSync('npm run build', {
      cwd: resolve(__dirname, '../..'),
      stdio: 'pipe',
    })
  }, 60000) // 60 second timeout for build

  it('should generate stats.html bundle analysis report on build', () => {
    // Verify stats.html was generated
    expect(existsSync(statsFile)).toBe(true)
  })

  it('stats.html should contain bundle size information', () => {
    // Read the generated stats file
    const statsContent = readFileSync(statsFile, 'utf-8')

    // Verify it contains expected content from visualizer
    expect(statsContent).toContain('<!DOCTYPE html>')
    expect(statsContent).toContain('treemap') // template type
  })
})
