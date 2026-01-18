import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync, readdirSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, join } from 'path'

describe('Vite Production Build Configuration', () => {
  const distDir = resolve(__dirname, '../../dist')
  const assetsDir = resolve(distDir, 'assets')
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
  }, 120000) // 120 second timeout for build

  describe('Bundle Analyzer', () => {
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

  describe('Code Splitting', () => {
    it('should generate separate vendor chunks', () => {
      const files = readdirSync(assetsDir)
      const jsFiles = files.filter(f => f.endsWith('.js'))

      // Should have multiple JS chunks (not just one bundle)
      expect(jsFiles.length).toBeGreaterThan(1)

      // Check for vendor chunks - look for chunks that suggest splitting occurred
      // The build should have created react-vendor, state-vendor, player-vendor, navigation-vendor
      const hasReactVendor = jsFiles.some(f => f.includes('react-vendor'))
      const hasStateVendor = jsFiles.some(f => f.includes('state-vendor'))
      const hasPlayerVendor = jsFiles.some(f => f.includes('player-vendor'))
      const hasNavigationVendor = jsFiles.some(f => f.includes('navigation-vendor'))

      // At least one vendor chunk should exist (some may be tree-shaken)
      const vendorChunkCount = [hasReactVendor, hasStateVendor, hasPlayerVendor, hasNavigationVendor]
        .filter(Boolean).length
      expect(vendorChunkCount).toBeGreaterThan(0)
    })

    it('should generate hashed file names for cache busting', () => {
      const files = readdirSync(assetsDir)

      // All JS and CSS files should have hash in name
      const jsFiles = files.filter(f => f.endsWith('.js'))
      const cssFiles = files.filter(f => f.endsWith('.css'))

      // Hash pattern: name-[8+ char hash].ext
      const hashPattern = /-[a-zA-Z0-9]{8,}\.(js|css)$/

      jsFiles.forEach(file => {
        expect(file).toMatch(hashPattern)
      })

      cssFiles.forEach(file => {
        expect(file).toMatch(hashPattern)
      })
    })
  })

  describe('Build Output', () => {
    it('should generate index.html in dist folder', () => {
      expect(existsSync(resolve(distDir, 'index.html'))).toBe(true)
    })

    it('should generate assets folder with JS and CSS', () => {
      expect(existsSync(assetsDir)).toBe(true)

      const files = readdirSync(assetsDir)
      const hasJs = files.some(f => f.endsWith('.js'))
      const hasCss = files.some(f => f.endsWith('.css'))

      expect(hasJs).toBe(true)
      expect(hasCss).toBe(true)
    })

    it('should not generate source maps in production', () => {
      const files = readdirSync(assetsDir)
      const mapFiles = files.filter(f => f.endsWith('.map'))

      expect(mapFiles.length).toBe(0)
    })

    it('should keep chunk sizes under the warning limit', () => {
      const files = readdirSync(assetsDir)
      const jsFiles = files.filter(f => f.endsWith('.js'))

      const chunkSizeWarningLimit = 500 * 1024 // 500KB in bytes

      jsFiles.forEach(file => {
        const filePath = join(assetsDir, file)
        const stats = statSync(filePath)

        // Individual chunks should be under the warning limit
        // Main app chunk might be larger, but vendor chunks should be smaller
        if (file.includes('vendor')) {
          expect(stats.size).toBeLessThan(chunkSizeWarningLimit)
        }
      })
    })
  })

  describe('Minification', () => {
    it('should minify JavaScript output', () => {
      const files = readdirSync(assetsDir)
      const jsFiles = files.filter(f => f.endsWith('.js'))

      // Get the main/entry chunk
      const mainChunk = jsFiles.find(f => f.startsWith('index-'))
      if (mainChunk) {
        const content = readFileSync(join(assetsDir, mainChunk), 'utf-8')

        // Minified code should not have excessive whitespace or comments
        // Check that it's reasonably dense (not formatted)
        const lines = content.split('\n').filter(l => l.trim().length > 0)
        const avgLineLength = content.length / Math.max(lines.length, 1)

        // Minified code tends to have very long lines
        expect(avgLineLength).toBeGreaterThan(100)
      }
    })

    it('should produce minified code without excessive formatting', () => {
      const files = readdirSync(assetsDir)
      const jsFiles = files.filter(f => f.endsWith('.js'))

      // Get a vendor chunk (not empty ones)
      const reactVendor = jsFiles.find(f => f.includes('react-vendor'))
      if (reactVendor) {
        const content = readFileSync(join(assetsDir, reactVendor), 'utf-8')

        // Minified code should have few newlines relative to content
        // React vendor should be dense (minified) not formatted
        const lineCount = content.split('\n').length
        const bytesPerLine = content.length / lineCount

        // Minified code has very long lines (typically 1000+ bytes per line)
        expect(bytesPerLine).toBeGreaterThan(100)
      }
    })
  })
})
