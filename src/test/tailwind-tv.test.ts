import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Tailwind TV Configuration', () => {
  const cssContent = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

  describe('Theme Variables', () => {
    it('defines TV color palette', () => {
      expect(cssContent).toContain('--color-tv-bg')
      expect(cssContent).toContain('--color-tv-surface')
      expect(cssContent).toContain('--color-tv-text')
      expect(cssContent).toContain('--color-tv-accent')
    })

    it('defines TV-optimized spacing variables', () => {
      expect(cssContent).toContain('--spacing-tv-xs')
      expect(cssContent).toContain('--spacing-tv-sm')
      expect(cssContent).toContain('--spacing-tv-md')
      expect(cssContent).toContain('--spacing-tv-lg')
      expect(cssContent).toContain('--spacing-tv-xl')
    })

    it('defines TV-optimized font sizes', () => {
      expect(cssContent).toContain('--font-size-tv-base')
      expect(cssContent).toContain('--font-size-tv-lg')
      expect(cssContent).toContain('--font-size-tv-xl')
      expect(cssContent).toContain('--font-size-tv-2xl')
    })

    it('defines TV focus ring configuration', () => {
      expect(cssContent).toContain('--ring-width-tv')
      expect(cssContent).toContain('--ring-offset-tv')
    })

    it('defines animation durations', () => {
      expect(cssContent).toContain('--duration-tv-fast')
      expect(cssContent).toContain('--duration-tv-normal')
      expect(cssContent).toContain('--duration-tv-slow')
    })
  })

  describe('TV Focus Utilities', () => {
    it('defines tv-focus-ring utility', () => {
      expect(cssContent).toContain('@utility tv-focus-ring')
      expect(cssContent).toContain('focus-visible')
    })

    it('defines tv-focus-scale utility', () => {
      expect(cssContent).toContain('@utility tv-focus-scale')
      expect(cssContent).toContain('transform')
      expect(cssContent).toContain('scale(1.05)')
    })

    it('defines tv-focus-glow utility', () => {
      expect(cssContent).toContain('@utility tv-focus-glow')
      expect(cssContent).toContain('box-shadow')
    })

    it('defines tv-focusable combined utility', () => {
      expect(cssContent).toContain('@utility tv-focusable')
    })

    it('defines tv-card-focus utility for grid items', () => {
      expect(cssContent).toContain('@utility tv-card-focus')
      expect(cssContent).toContain('scale(1.02)')
    })

    it('defines tv-button-focus utility', () => {
      expect(cssContent).toContain('@utility tv-button-focus')
    })

    it('defines tv-menu-focus utility for sidebar navigation', () => {
      expect(cssContent).toContain('@utility tv-menu-focus')
      expect(cssContent).toContain('border-left')
    })
  })

  describe('Base Styles', () => {
    it('sets body styles with TV background', () => {
      expect(cssContent).toContain('body')
      expect(cssContent).toContain('bg-tv-bg')
      expect(cssContent).toContain('text-tv-text')
    })

    it('removes default focus outlines', () => {
      expect(cssContent).toContain('*:focus')
      expect(cssContent).toContain('outline: none')
    })

    it('defines tv-selected class for active items', () => {
      expect(cssContent).toContain('.tv-selected')
    })

    it('defines tv-disabled class', () => {
      expect(cssContent).toContain('.tv-disabled')
      expect(cssContent).toContain('opacity: 0.5')
    })
  })
})
