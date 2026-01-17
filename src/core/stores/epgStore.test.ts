import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useEPGStore } from './epgStore'
import type { Program } from '../types/channel'

describe('epgStore', () => {
  const now = new Date('2026-01-17T12:00:00Z').getTime()

  const mockPrograms: Program[] = [
    {
      id: 'prog1',
      channelId: 'ch1',
      title: 'Morning News',
      description: 'Latest news updates',
      startTime: new Date('2026-01-17T08:00:00Z').getTime(),
      endTime: new Date('2026-01-17T10:00:00Z').getTime(),
      category: 'News',
    },
    {
      id: 'prog2',
      channelId: 'ch1',
      title: 'Midday Show',
      description: 'Entertainment program',
      startTime: new Date('2026-01-17T10:00:00Z').getTime(),
      endTime: new Date('2026-01-17T13:00:00Z').getTime(),
      category: 'Entertainment',
    },
    {
      id: 'prog3',
      channelId: 'ch1',
      title: 'Afternoon Movie',
      description: 'Action movie',
      startTime: new Date('2026-01-17T13:00:00Z').getTime(),
      endTime: new Date('2026-01-17T15:00:00Z').getTime(),
      category: 'Movies',
    },
    {
      id: 'prog4',
      channelId: 'ch1',
      title: 'Evening News',
      description: 'Evening news bulletin',
      startTime: new Date('2026-01-17T18:00:00Z').getTime(),
      endTime: new Date('2026-01-17T19:00:00Z').getTime(),
      category: 'News',
    },
  ]

  const mockProgramsCh2: Program[] = [
    {
      id: 'prog5',
      channelId: 'ch2',
      title: 'Sports Center',
      description: 'Sports news',
      startTime: new Date('2026-01-17T11:00:00Z').getTime(),
      endTime: new Date('2026-01-17T13:00:00Z').getTime(),
      category: 'Sports',
    },
  ]

  beforeEach(() => {
    useEPGStore.getState().reset()
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have empty programsByChannel', () => {
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel).toEqual({})
    })

    it('should have null lastUpdated', () => {
      const { lastUpdated } = useEPGStore.getState()
      expect(lastUpdated).toBeNull()
    })

    it('should have null source', () => {
      const { source } = useEPGStore.getState()
      expect(source).toBeNull()
    })

    it('should have isLoading as false', () => {
      const { isLoading } = useEPGStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have null error', () => {
      const { error } = useEPGStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('setProgramsForChannel', () => {
    it('should set programs for a channel', () => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel['ch1']).toEqual(mockPrograms)
    })

    it('should replace existing programs for a channel', () => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      const newPrograms: Program[] = [
        {
          id: 'new1',
          channelId: 'ch1',
          title: 'New Program',
          startTime: now,
          endTime: now + 3600000,
        },
      ]
      useEPGStore.getState().setProgramsForChannel('ch1', newPrograms)
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel['ch1']).toEqual(newPrograms)
    })

    it('should not affect other channels', () => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      useEPGStore.getState().setProgramsForChannel('ch2', mockProgramsCh2)
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel['ch1']).toEqual(mockPrograms)
      expect(programsByChannel['ch2']).toEqual(mockProgramsCh2)
    })
  })

  describe('setAllPrograms', () => {
    it('should set all programs at once', () => {
      const allPrograms = {
        ch1: mockPrograms,
        ch2: mockProgramsCh2,
      }
      useEPGStore.getState().setAllPrograms(allPrograms)
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel).toEqual(allPrograms)
    })

    it('should replace all existing programs', () => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      const newPrograms = { ch3: mockProgramsCh2 }
      useEPGStore.getState().setAllPrograms(newPrograms)
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel).toEqual(newPrograms)
      expect(programsByChannel['ch1']).toBeUndefined()
    })
  })

  describe('getProgramsForChannel', () => {
    beforeEach(() => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
    })

    it('should return programs for a channel', () => {
      const programs = useEPGStore.getState().getProgramsForChannel('ch1')
      expect(programs).toEqual(mockPrograms)
    })

    it('should return empty array for channel with no programs', () => {
      const programs = useEPGStore.getState().getProgramsForChannel('ch99')
      expect(programs).toEqual([])
    })
  })

  describe('getCurrentProgram', () => {
    beforeEach(() => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
    })

    it('should return the currently airing program', () => {
      // At 12:00, Midday Show (10:00-13:00) should be current
      const program = useEPGStore.getState().getCurrentProgram('ch1')
      expect(program?.id).toBe('prog2')
      expect(program?.title).toBe('Midday Show')
    })

    it('should return undefined when no program is airing', () => {
      // Set time to 16:00 where there's no program
      vi.setSystemTime(new Date('2026-01-17T16:00:00Z').getTime())
      const program = useEPGStore.getState().getCurrentProgram('ch1')
      expect(program).toBeUndefined()
    })

    it('should return undefined for channel with no programs', () => {
      const program = useEPGStore.getState().getCurrentProgram('ch99')
      expect(program).toBeUndefined()
    })

    it('should work with ISO string timestamps', () => {
      const programsWithISOStrings: Program[] = [
        {
          id: 'iso1',
          channelId: 'ch3',
          title: 'ISO Program',
          startTime: '2026-01-17T11:00:00Z',
          endTime: '2026-01-17T13:00:00Z',
        },
      ]
      useEPGStore.getState().setProgramsForChannel('ch3', programsWithISOStrings)
      const program = useEPGStore.getState().getCurrentProgram('ch3')
      expect(program?.id).toBe('iso1')
    })
  })

  describe('getNextProgram', () => {
    beforeEach(() => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
    })

    it('should return the next upcoming program', () => {
      // At 12:00, Afternoon Movie (13:00-15:00) should be next
      const program = useEPGStore.getState().getNextProgram('ch1')
      expect(program?.id).toBe('prog3')
      expect(program?.title).toBe('Afternoon Movie')
    })

    it('should return undefined when no future programs exist', () => {
      vi.setSystemTime(new Date('2026-01-17T20:00:00Z').getTime())
      const program = useEPGStore.getState().getNextProgram('ch1')
      expect(program).toBeUndefined()
    })

    it('should return undefined for channel with no programs', () => {
      const program = useEPGStore.getState().getNextProgram('ch99')
      expect(program).toBeUndefined()
    })
  })

  describe('getProgramsInRange', () => {
    beforeEach(() => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
    })

    it('should return programs overlapping with the time range', () => {
      const startTime = new Date('2026-01-17T09:00:00Z').getTime()
      const endTime = new Date('2026-01-17T14:00:00Z').getTime()
      const programs = useEPGStore
        .getState()
        .getProgramsInRange('ch1', startTime, endTime)
      // Should include Morning News (ends at 10:00, after range start)
      // Midday Show (10:00-13:00), and Afternoon Movie (starts at 13:00, before range end)
      expect(programs).toHaveLength(3)
      expect(programs.map((p) => p.id)).toEqual(['prog1', 'prog2', 'prog3'])
    })

    it('should return empty array for range with no programs', () => {
      const startTime = new Date('2026-01-17T16:00:00Z').getTime()
      const endTime = new Date('2026-01-17T17:00:00Z').getTime()
      const programs = useEPGStore
        .getState()
        .getProgramsInRange('ch1', startTime, endTime)
      expect(programs).toEqual([])
    })

    it('should return empty array for channel with no programs', () => {
      const programs = useEPGStore
        .getState()
        .getProgramsInRange('ch99', now, now + 3600000)
      expect(programs).toEqual([])
    })
  })

  describe('setLastUpdated', () => {
    it('should set lastUpdated with timestamp', () => {
      useEPGStore.getState().setLastUpdated(now)
      const { lastUpdated } = useEPGStore.getState()
      expect(lastUpdated).toBe(now)
    })

    it('should set lastUpdated with ISO string', () => {
      const isoString = '2026-01-17T12:00:00Z'
      useEPGStore.getState().setLastUpdated(isoString)
      const { lastUpdated } = useEPGStore.getState()
      expect(lastUpdated).toBe(isoString)
    })

    it('should allow setting to null', () => {
      useEPGStore.getState().setLastUpdated(now)
      useEPGStore.getState().setLastUpdated(null)
      const { lastUpdated } = useEPGStore.getState()
      expect(lastUpdated).toBeNull()
    })
  })

  describe('setSource', () => {
    it('should set source', () => {
      useEPGStore.getState().setSource('http://example.com/epg.xml')
      const { source } = useEPGStore.getState()
      expect(source).toBe('http://example.com/epg.xml')
    })

    it('should allow setting to null', () => {
      useEPGStore.getState().setSource('http://example.com/epg.xml')
      useEPGStore.getState().setSource(null)
      const { source } = useEPGStore.getState()
      expect(source).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading to true', () => {
      useEPGStore.getState().setLoading(true)
      const { isLoading } = useEPGStore.getState()
      expect(isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      useEPGStore.getState().setLoading(true)
      useEPGStore.getState().setLoading(false)
      const { isLoading } = useEPGStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      useEPGStore.getState().setError('Failed to load EPG')
      const { error } = useEPGStore.getState()
      expect(error).toBe('Failed to load EPG')
    })

    it('should allow clearing error', () => {
      useEPGStore.getState().setError('Some error')
      useEPGStore.getState().setError(null)
      const { error } = useEPGStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('clearChannelPrograms', () => {
    beforeEach(() => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      useEPGStore.getState().setProgramsForChannel('ch2', mockProgramsCh2)
    })

    it('should clear programs for a specific channel', () => {
      useEPGStore.getState().clearChannelPrograms('ch1')
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel['ch1']).toBeUndefined()
      expect(programsByChannel['ch2']).toEqual(mockProgramsCh2)
    })

    it('should handle clearing nonexistent channel', () => {
      useEPGStore.getState().clearChannelPrograms('ch99')
      const { programsByChannel } = useEPGStore.getState()
      expect(programsByChannel['ch1']).toEqual(mockPrograms)
      expect(programsByChannel['ch2']).toEqual(mockProgramsCh2)
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useEPGStore.getState().setProgramsForChannel('ch1', mockPrograms)
      useEPGStore.getState().setLastUpdated(now)
      useEPGStore.getState().setSource('http://example.com/epg.xml')
      useEPGStore.getState().setLoading(true)
      useEPGStore.getState().setError('Some error')

      useEPGStore.getState().reset()

      const state = useEPGStore.getState()
      expect(state.programsByChannel).toEqual({})
      expect(state.lastUpdated).toBeNull()
      expect(state.source).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
