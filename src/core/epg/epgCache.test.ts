/**
 * Tests for EPG Cache with time-based invalidation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EPGCache, getEPGCache, resetEPGCache } from './epgCache'
import type { EPGData, Program } from '../types/channel'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('EPGCache', () => {
  const mockProgram = (
    id: string,
    channelId: string,
    startOffset: number,
    durationMinutes: number
  ): Program => {
    const now = Date.now()
    return {
      id,
      channelId,
      title: `Program ${id}`,
      startTime: new Date(now + startOffset).toISOString(),
      endTime: new Date(
        now + startOffset + durationMinutes * 60 * 1000
      ).toISOString(),
    }
  }

  const createMockEPGData = (
    channelId: string,
    programCount: number
  ): EPGData => {
    const programs: Program[] = []
    for (let i = 0; i < programCount; i++) {
      // Programs start at -30min, 30min apart each
      programs.push(
        mockProgram(`prog-${i}`, channelId, (i - 1) * 30 * 60 * 1000, 30)
      )
    }

    return {
      programs: { [channelId]: programs },
      lastUpdated: new Date().toISOString(),
      source: 'test-source',
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'))
    localStorageMock.clear()
    resetEPGCache()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic operations', () => {
    it('should store and retrieve EPG data', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      const retrieved = cache.get('source-1')

      expect(retrieved).toEqual(data)
    })

    it('should return null for non-existent source', () => {
      const cache = new EPGCache()
      expect(cache.get('non-existent')).toBeNull()
    })

    it('should check if cache has data with has()', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 3)

      expect(cache.has('source-1')).toBe(false)
      cache.set('source-1', data)
      expect(cache.has('source-1')).toBe(true)
    })

    it('should invalidate a specific source', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      expect(cache.has('source-1')).toBe(true)

      cache.invalidate('source-1')
      expect(cache.has('source-1')).toBe(false)
    })

    it('should invalidate all sources', () => {
      const cache = new EPGCache()
      cache.set('source-1', createMockEPGData('channel-1', 3))
      cache.set('source-2', createMockEPGData('channel-2', 3))

      expect(cache.has('source-1')).toBe(true)
      expect(cache.has('source-2')).toBe(true)

      cache.invalidateAll()

      expect(cache.has('source-1')).toBe(false)
      expect(cache.has('source-2')).toBe(false)
    })
  })

  describe('time-based invalidation', () => {
    it('should expire data after TTL', () => {
      const cache = new EPGCache({ ttl: 60 * 1000 }) // 1 minute TTL
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      expect(cache.get('source-1')).toEqual(data)

      // Advance time by 30 seconds - should still be valid
      vi.advanceTimersByTime(30 * 1000)
      expect(cache.get('source-1')).toEqual(data)

      // Advance time to just past TTL
      vi.advanceTimersByTime(31 * 1000)
      expect(cache.get('source-1')).toBeNull()
    })

    it('should return correct time to expiry', () => {
      const cache = new EPGCache({ ttl: 60 * 1000 })
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      expect(cache.getTimeToExpiry('source-1')).toBe(60 * 1000)

      vi.advanceTimersByTime(30 * 1000)
      expect(cache.getTimeToExpiry('source-1')).toBe(30 * 1000)

      vi.advanceTimersByTime(35 * 1000)
      expect(cache.getTimeToExpiry('source-1')).toBe(0)
    })

    it('should return 0 for non-existent source time to expiry', () => {
      const cache = new EPGCache()
      expect(cache.getTimeToExpiry('non-existent')).toBe(0)
    })

    it('should expire data when checking has()', () => {
      const cache = new EPGCache({ ttl: 60 * 1000 })
      cache.set('source-1', createMockEPGData('channel-1', 3))

      expect(cache.has('source-1')).toBe(true)

      vi.advanceTimersByTime(61 * 1000)
      expect(cache.has('source-1')).toBe(false)
    })
  })

  describe('LRU eviction', () => {
    it('should evict oldest entry when max sources exceeded', () => {
      const cache = new EPGCache({ maxSources: 2 })

      cache.set('source-1', createMockEPGData('channel-1', 3))
      vi.advanceTimersByTime(1000)
      cache.set('source-2', createMockEPGData('channel-2', 3))
      vi.advanceTimersByTime(1000)

      expect(cache.has('source-1')).toBe(true)
      expect(cache.has('source-2')).toBe(true)

      // Adding third source should evict oldest (source-1)
      cache.set('source-3', createMockEPGData('channel-3', 3))

      expect(cache.has('source-1')).toBe(false)
      expect(cache.has('source-2')).toBe(true)
      expect(cache.has('source-3')).toBe(true)
    })

    it('should not evict when updating existing source', () => {
      const cache = new EPGCache({ maxSources: 2 })

      cache.set('source-1', createMockEPGData('channel-1', 3))
      cache.set('source-2', createMockEPGData('channel-2', 3))

      // Update existing source should not trigger eviction
      cache.set('source-1', createMockEPGData('channel-1', 5))

      expect(cache.has('source-1')).toBe(true)
      expect(cache.has('source-2')).toBe(true)
    })
  })

  describe('program queries', () => {
    it('should get programs for a specific channel', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      const programs = cache.getChannelPrograms('source-1', 'channel-1')

      expect(programs).toHaveLength(3)
    })

    it('should return null for non-cached channel programs', () => {
      const cache = new EPGCache()
      expect(cache.getChannelPrograms('source-1', 'channel-1')).toBeNull()
    })

    it('should return null for non-existent channel', () => {
      const cache = new EPGCache()
      cache.set('source-1', createMockEPGData('channel-1', 3))
      expect(cache.getChannelPrograms('source-1', 'non-existent')).toBeNull()
    })

    it('should get current program', () => {
      const cache = new EPGCache()
      // Program 0: -30 to 0 (past)
      // Program 1: 0 to +30 (current)
      // Program 2: +30 to +60 (future)
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      const current = cache.getCurrentProgram('source-1', 'channel-1')

      expect(current).not.toBeNull()
      expect(current?.id).toBe('prog-1')
    })

    it('should return null when no current program', () => {
      const cache = new EPGCache()

      // Create data with programs starting in the future
      const futureProgram: Program = {
        id: 'future-prog',
        channelId: 'channel-1',
        title: 'Future Program',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }

      const data: EPGData = {
        programs: { 'channel-1': [futureProgram] },
        lastUpdated: new Date().toISOString(),
      }

      cache.set('source-1', data)
      expect(cache.getCurrentProgram('source-1', 'channel-1')).toBeNull()
    })

    it('should get next program', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 3)

      cache.set('source-1', data)
      const next = cache.getNextProgram('source-1', 'channel-1')

      expect(next).not.toBeNull()
      expect(next?.id).toBe('prog-2')
    })

    it('should get programs in time range', () => {
      const cache = new EPGCache()
      const data = createMockEPGData('channel-1', 5)

      cache.set('source-1', data)

      const now = Date.now()
      // Get programs for current hour
      const programs = cache.getProgramsInRange(
        'source-1',
        'channel-1',
        now - 30 * 60 * 1000,
        now + 30 * 60 * 1000
      )

      // Should include programs that overlap with the range
      expect(programs.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-cached source in range query', () => {
      const cache = new EPGCache()
      const now = Date.now()
      const programs = cache.getProgramsInRange(
        'source-1',
        'channel-1',
        now,
        now + 60 * 60 * 1000
      )

      expect(programs).toEqual([])
    })
  })

  describe('statistics', () => {
    it('should return cache statistics', () => {
      const cache = new EPGCache({ ttl: 60 * 1000, maxSources: 5 })

      cache.set('source-1', createMockEPGData('channel-1', 3))
      cache.set('source-2', createMockEPGData('channel-2', 5))

      const stats = cache.getStats()

      expect(stats.sourceCount).toBe(2)
      expect(stats.maxSources).toBe(5)
      expect(stats.ttl).toBe(60 * 1000)
      expect(stats.sources).toHaveLength(2)

      const source1Stats = stats.sources.find((s) => s.sourceId === 'source-1')
      expect(source1Stats).toBeDefined()
      expect(source1Stats?.channelCount).toBe(1)
      expect(source1Stats?.programCount).toBe(3)
    })

    it('should not include expired entries in stats', () => {
      const cache = new EPGCache({ ttl: 60 * 1000 })

      cache.set('source-1', createMockEPGData('channel-1', 3))
      vi.advanceTimersByTime(61 * 1000)

      const stats = cache.getStats()
      expect(stats.sourceCount).toBe(0)
    })
  })

  describe('TTL configuration', () => {
    it('should allow updating TTL', () => {
      const cache = new EPGCache({ ttl: 60 * 1000 })
      expect(cache.getTTL()).toBe(60 * 1000)

      cache.setTTL(120 * 1000)
      expect(cache.getTTL()).toBe(120 * 1000)
    })

    it('should use default TTL if not specified', () => {
      const cache = new EPGCache()
      expect(cache.getTTL()).toBe(60 * 60 * 1000) // 1 hour default
    })
  })

  describe('localStorage persistence', () => {
    it('should persist data to localStorage', () => {
      const cache = new EPGCache({ storageKey: 'test_cache' })
      cache.set('source-1', createMockEPGData('channel-1', 3))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test_cache',
        expect.any(String)
      )
    })

    it('should load data from localStorage on creation', () => {
      const data = createMockEPGData('channel-1', 3)
      const cacheEntry = {
        'source-1': {
          data,
          fetchedAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
      }

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheEntry))

      const cache = new EPGCache({ storageKey: 'test_cache' })
      expect(cache.has('source-1')).toBe(true)
    })

    it('should not load expired data from localStorage', () => {
      const data = createMockEPGData('channel-1', 3)
      const cacheEntry = {
        'source-1': {
          data,
          fetchedAt: Date.now() - 2 * 60 * 60 * 1000,
          expiresAt: Date.now() - 60 * 60 * 1000, // Already expired
        },
      }

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheEntry))

      const cache = new EPGCache({ storageKey: 'test_cache' })
      expect(cache.has('source-1')).toBe(false)
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      const cache = new EPGCache()
      expect(cache.has('source-1')).toBe(false)
    })
  })

  describe('singleton pattern', () => {
    it('should return same instance with getEPGCache()', () => {
      const cache1 = getEPGCache()
      const cache2 = getEPGCache()

      expect(cache1).toBe(cache2)
    })

    it('should reset singleton with resetEPGCache()', () => {
      const cache1 = getEPGCache({ storageKey: 'singleton_test' })
      cache1.set('source-1', createMockEPGData('channel-1', 3))

      resetEPGCache()
      localStorageMock.clear() // Clear storage to prevent reload

      const cache2 = getEPGCache({ storageKey: 'singleton_test_2' })

      expect(cache2).not.toBe(cache1)
      expect(cache2.has('source-1')).toBe(false)
    })
  })

  describe('timestamp handling', () => {
    it('should handle numeric timestamps', () => {
      const cache = new EPGCache()
      const now = Date.now()

      const program: Program = {
        id: 'prog-1',
        channelId: 'channel-1',
        title: 'Test Program',
        startTime: now - 30 * 60 * 1000,
        endTime: now + 30 * 60 * 1000,
      }

      const data: EPGData = {
        programs: { 'channel-1': [program] },
        lastUpdated: now,
      }

      cache.set('source-1', data)
      const current = cache.getCurrentProgram('source-1', 'channel-1')

      expect(current).not.toBeNull()
      expect(current?.id).toBe('prog-1')
    })
  })
})
