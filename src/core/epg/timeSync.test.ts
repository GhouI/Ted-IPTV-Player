/**
 * Tests for EPG Time Sync Utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  EPGTimeSync,
  getEPGTimeSync,
  resetEPGTimeSync,
  isProgramNowPlaying,
  getProgramProgress,
  getProgramTimeRemaining,
  findCurrentProgram,
  findNextProgram,
  type TimeSyncOptions,
} from './timeSync'

describe('EPGTimeSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-17T12:00:00.000Z'))
    resetEPGTimeSync()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor and initial state', () => {
    it('should initialize with default options', () => {
      const sync = new EPGTimeSync()
      expect(sync.getOffset()).toBe(0)
      expect(sync.isSynced()).toBe(false)
    })

    it('should accept custom options', () => {
      const options: TimeSyncOptions = {
        timeServerUrl: 'https://custom.time.server/api',
        resyncInterval: 30000,
        maxDriftWarning: 60000,
        timeout: 10000,
      }
      const sync = new EPGTimeSync(options)
      expect(sync.isSynced()).toBe(false)
    })
  })

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const sync = new EPGTimeSync()
      const state = sync.getState()
      expect(state.offset).toBe(0)
      expect(state.lastSync).toBe(0)
      expect(state.isSynced).toBe(false)
    })
  })

  describe('getCorrectedTime', () => {
    it('should return current time when offset is 0', () => {
      const sync = new EPGTimeSync()
      const corrected = sync.getCorrectedTime()
      expect(corrected.getTime()).toBe(Date.now())
    })

    it('should apply positive offset', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(5000) // Device is 5 seconds behind
      const corrected = sync.getCorrectedTime()
      expect(corrected.getTime()).toBe(Date.now() + 5000)
    })

    it('should apply negative offset', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(-3000) // Device is 3 seconds ahead
      const corrected = sync.getCorrectedTime()
      expect(corrected.getTime()).toBe(Date.now() - 3000)
    })
  })

  describe('getCorrectedTimestamp', () => {
    it('should return timestamp with offset applied', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(10000)
      expect(sync.getCorrectedTimestamp()).toBe(Date.now() + 10000)
    })
  })

  describe('localToServer and serverToLocal', () => {
    it('should convert local to server time', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(5000)
      const local = Date.now()
      expect(sync.localToServer(local)).toBe(local + 5000)
    })

    it('should convert server to local time', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(5000)
      const server = Date.now() + 5000
      expect(sync.serverToLocal(server)).toBe(server - 5000)
    })

    it('should be inverse operations', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(7500)
      const original = Date.now()
      const server = sync.localToServer(original)
      const backToLocal = sync.serverToLocal(server)
      expect(backToLocal).toBe(original)
    })
  })

  describe('needsResync', () => {
    it('should return true when never synced', () => {
      const sync = new EPGTimeSync()
      expect(sync.needsResync()).toBe(true)
    })

    it('should return false immediately after sync', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(0) // This marks as synced
      expect(sync.needsResync()).toBe(false)
    })

    it('should return true after resync interval', () => {
      const sync = new EPGTimeSync({ resyncInterval: 60000 })
      sync.setOffset(0)

      // Advance time past the interval
      vi.advanceTimersByTime(61000)

      expect(sync.needsResync()).toBe(true)
    })
  })

  describe('sync', () => {
    it('should handle successful sync with worldtimeapi format', async () => {
      const serverTime = Date.now() + 5000 // Server is 5 seconds ahead
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            unixtime: Math.floor(serverTime / 1000),
            datetime: new Date(serverTime).toISOString(),
          }),
      })

      const sync = new EPGTimeSync()
      const result = await sync.sync()

      expect(result.success).toBe(true)
      expect(sync.isSynced()).toBe(true)
      // Offset should be approximately 5000ms (allowing for some variance)
      expect(Math.abs(sync.getOffset() - 5000)).toBeLessThan(100)
    })

    it('should handle successful sync with datetime format', async () => {
      const serverTime = Date.now() - 3000 // Server is 3 seconds behind
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            datetime: new Date(serverTime).toISOString(),
          }),
      })

      const sync = new EPGTimeSync()
      const result = await sync.sync()

      expect(result.success).toBe(true)
      expect(sync.isSynced()).toBe(true)
    })

    it('should handle HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const sync = new EPGTimeSync()
      const result = await sync.sync()

      expect(result.success).toBe(false)
      expect(result.error).toContain('500')
      expect(sync.isSynced()).toBe(false)
    })

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const sync = new EPGTimeSync()
      const result = await sync.sync()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle invalid response format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      })

      const sync = new EPGTimeSync()
      const result = await sync.sync()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not parse')
    })

    it('should reuse promise for concurrent sync calls', async () => {
      let resolveCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        resolveCount++
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              unixtime: Math.floor(Date.now() / 1000),
            }),
        })
      })

      const sync = new EPGTimeSync()

      // Start multiple syncs concurrently
      const promises = [sync.sync(), sync.sync(), sync.sync()]

      await Promise.all(promises)

      // Should only have fetched once
      expect(resolveCount).toBe(1)
    })
  })

  describe('hasDriftWarning', () => {
    it('should return false when within threshold', () => {
      const sync = new EPGTimeSync({ maxDriftWarning: 300000 }) // 5 minutes
      sync.setOffset(60000) // 1 minute
      expect(sync.hasDriftWarning()).toBe(false)
    })

    it('should return true when exceeding threshold', () => {
      const sync = new EPGTimeSync({ maxDriftWarning: 300000 }) // 5 minutes
      sync.setOffset(600000) // 10 minutes
      expect(sync.hasDriftWarning()).toBe(true)
    })

    it('should handle negative offsets', () => {
      const sync = new EPGTimeSync({ maxDriftWarning: 300000 })
      sync.setOffset(-600000)
      expect(sync.hasDriftWarning()).toBe(true)
    })
  })

  describe('getDriftDescription', () => {
    it('should return synchronized message for small offset', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(500) // Half second
      expect(sync.getDriftDescription()).toBe('Time is synchronized')
    })

    it('should describe seconds behind', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(30000) // 30 seconds
      expect(sync.getDriftDescription()).toBe(
        'Device clock is 30 seconds behind'
      )
    })

    it('should describe seconds ahead', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(-15000) // 15 seconds
      expect(sync.getDriftDescription()).toBe(
        'Device clock is 15 seconds ahead'
      )
    })

    it('should describe minutes', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(180000) // 3 minutes
      expect(sync.getDriftDescription()).toBe(
        'Device clock is 3 minutes behind'
      )
    })

    it('should handle singular form', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(1500) // 1.5 seconds rounds to 2
      expect(sync.getDriftDescription()).toBe(
        'Device clock is 2 seconds behind'
      )

      sync.setOffset(60000) // 1 minute
      expect(sync.getDriftDescription()).toBe(
        'Device clock is 1 minute behind'
      )
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(5000)

      sync.reset()

      expect(sync.getOffset()).toBe(0)
      expect(sync.isSynced()).toBe(false)
      expect(sync.getState().lastSync).toBe(0)
    })
  })

  describe('setOffset', () => {
    it('should set offset and mark as synced', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(12345)

      expect(sync.getOffset()).toBe(12345)
      expect(sync.isSynced()).toBe(true)
      expect(sync.getState().lastError).toBeUndefined()
    })
  })
})

describe('Global EPGTimeSync', () => {
  beforeEach(() => {
    resetEPGTimeSync()
  })

  it('should return singleton instance', () => {
    const sync1 = getEPGTimeSync()
    const sync2 = getEPGTimeSync()
    expect(sync1).toBe(sync2)
  })

  it('should reset singleton', () => {
    const sync1 = getEPGTimeSync()
    resetEPGTimeSync()
    const sync2 = getEPGTimeSync()
    expect(sync1).not.toBe(sync2)
  })
})

describe('Helper functions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-17T12:00:00.000Z'))
    resetEPGTimeSync()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isProgramNowPlaying', () => {
    it('should return true for currently airing program', () => {
      const program = {
        startTime: '2026-01-17T11:30:00.000Z',
        endTime: '2026-01-17T12:30:00.000Z',
      }
      expect(isProgramNowPlaying(program)).toBe(true)
    })

    it('should return false for past program', () => {
      const program = {
        startTime: '2026-01-17T10:00:00.000Z',
        endTime: '2026-01-17T11:00:00.000Z',
      }
      expect(isProgramNowPlaying(program)).toBe(false)
    })

    it('should return false for future program', () => {
      const program = {
        startTime: '2026-01-17T13:00:00.000Z',
        endTime: '2026-01-17T14:00:00.000Z',
      }
      expect(isProgramNowPlaying(program)).toBe(false)
    })

    it('should handle numeric timestamps', () => {
      const now = Date.now()
      const program = {
        startTime: now - 30 * 60 * 1000,
        endTime: now + 30 * 60 * 1000,
      }
      expect(isProgramNowPlaying(program)).toBe(true)
    })

    it('should use time sync offset', () => {
      const sync = new EPGTimeSync()
      sync.setOffset(60 * 60 * 1000) // 1 hour ahead

      // Program starts at 12:30 and ends at 13:30
      const program = {
        startTime: '2026-01-17T12:30:00.000Z',
        endTime: '2026-01-17T13:30:00.000Z',
      }

      // Without sync, current time is 12:00, so program is not airing
      // With sync offset of +1 hour, corrected time is 13:00, so program IS airing
      expect(isProgramNowPlaying(program, sync)).toBe(true)
    })
  })

  describe('getProgramProgress', () => {
    it('should return 0 for program not yet started', () => {
      const program = {
        startTime: '2026-01-17T13:00:00.000Z',
        endTime: '2026-01-17T14:00:00.000Z',
      }
      expect(getProgramProgress(program)).toBe(0)
    })

    it('should return 100 for ended program', () => {
      const program = {
        startTime: '2026-01-17T10:00:00.000Z',
        endTime: '2026-01-17T11:00:00.000Z',
      }
      expect(getProgramProgress(program)).toBe(100)
    })

    it('should return correct progress for airing program', () => {
      // Current time is 12:00
      // Program runs from 11:00 to 13:00 (2 hours)
      // We are 1 hour in, so 50%
      const program = {
        startTime: '2026-01-17T11:00:00.000Z',
        endTime: '2026-01-17T13:00:00.000Z',
      }
      expect(getProgramProgress(program)).toBe(50)
    })

    it('should round progress to integer', () => {
      // Current time is 12:00
      // Program runs from 11:45 to 12:45 (1 hour)
      // We are 15 minutes in, so 25%
      const program = {
        startTime: '2026-01-17T11:45:00.000Z',
        endTime: '2026-01-17T12:45:00.000Z',
      }
      expect(getProgramProgress(program)).toBe(25)
    })
  })

  describe('getProgramTimeRemaining', () => {
    it('should return 0 for ended program', () => {
      const program = {
        startTime: '2026-01-17T10:00:00.000Z',
        endTime: '2026-01-17T11:00:00.000Z',
      }
      expect(getProgramTimeRemaining(program)).toBe(0)
    })

    it('should return correct remaining time', () => {
      // Current time is 12:00, program ends at 12:30
      const program = {
        startTime: '2026-01-17T11:30:00.000Z',
        endTime: '2026-01-17T12:30:00.000Z',
      }
      expect(getProgramTimeRemaining(program)).toBe(30 * 60 * 1000) // 30 minutes
    })
  })

  describe('findCurrentProgram', () => {
    const programs = [
      {
        id: '1',
        startTime: '2026-01-17T10:00:00.000Z',
        endTime: '2026-01-17T11:00:00.000Z',
      },
      {
        id: '2',
        startTime: '2026-01-17T11:00:00.000Z',
        endTime: '2026-01-17T12:30:00.000Z',
      },
      {
        id: '3',
        startTime: '2026-01-17T12:30:00.000Z',
        endTime: '2026-01-17T14:00:00.000Z',
      },
    ]

    it('should find the currently airing program', () => {
      const current = findCurrentProgram(programs)
      expect(current?.id).toBe('2')
    })

    it('should return undefined when no program is airing', () => {
      vi.setSystemTime(new Date('2026-01-17T15:00:00.000Z'))
      const current = findCurrentProgram(programs)
      expect(current).toBeUndefined()
    })
  })

  describe('findNextProgram', () => {
    const programs = [
      {
        id: '1',
        startTime: '2026-01-17T10:00:00.000Z',
        endTime: '2026-01-17T11:00:00.000Z',
      },
      {
        id: '2',
        startTime: '2026-01-17T11:00:00.000Z',
        endTime: '2026-01-17T12:30:00.000Z',
      },
      {
        id: '3',
        startTime: '2026-01-17T12:30:00.000Z',
        endTime: '2026-01-17T14:00:00.000Z',
      },
    ]

    it('should find the next program', () => {
      const next = findNextProgram(programs)
      expect(next?.id).toBe('3')
    })

    it('should return undefined when no future program exists', () => {
      vi.setSystemTime(new Date('2026-01-17T15:00:00.000Z'))
      const next = findNextProgram(programs)
      expect(next).toBeUndefined()
    })

    it('should handle unsorted array', () => {
      const unsorted = [programs[2], programs[0], programs[1]]
      const next = findNextProgram(unsorted)
      expect(next?.id).toBe('3')
    })
  })
})
