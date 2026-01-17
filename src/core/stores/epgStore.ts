import { create } from 'zustand'
import type { Program } from '../types/channel'

/**
 * EPG store state interface
 */
export interface EPGState {
  /** Programs organized by channel ID */
  programsByChannel: Record<string, Program[]>
  /** When EPG data was last updated (ISO string or timestamp) */
  lastUpdated: string | number | null
  /** Source identifier for the EPG data */
  source: string | null
  /** Loading state for EPG data */
  isLoading: boolean
  /** Error message if EPG loading fails */
  error: string | null
}

/**
 * EPG store actions interface
 */
export interface EPGActions {
  /** Set programs for a specific channel */
  setProgramsForChannel: (channelId: string, programs: Program[]) => void
  /** Set programs for multiple channels at once */
  setAllPrograms: (programsByChannel: Record<string, Program[]>) => void
  /** Get programs for a specific channel */
  getProgramsForChannel: (channelId: string) => Program[]
  /** Get the current program for a channel */
  getCurrentProgram: (channelId: string) => Program | undefined
  /** Get the next program for a channel */
  getNextProgram: (channelId: string) => Program | undefined
  /** Get programs in a time range for a channel */
  getProgramsInRange: (
    channelId: string,
    startTime: number,
    endTime: number
  ) => Program[]
  /** Set the last updated timestamp */
  setLastUpdated: (timestamp: string | number | null) => void
  /** Set the EPG source identifier */
  setSource: (source: string | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Clear programs for a specific channel */
  clearChannelPrograms: (channelId: string) => void
  /** Reset the store to initial state */
  reset: () => void
}

const initialState: EPGState = {
  programsByChannel: {},
  lastUpdated: null,
  source: null,
  isLoading: false,
  error: null,
}

/**
 * Helper to convert time to timestamp for comparison
 */
const toTimestamp = (time: string | number): number => {
  if (typeof time === 'number') {
    return time
  }
  return new Date(time).getTime()
}

/**
 * Zustand store for managing EPG (Electronic Program Guide) state
 */
export const useEPGStore = create<EPGState & EPGActions>()((set, get) => ({
  ...initialState,

  setProgramsForChannel: (channelId, programs) =>
    set((state) => ({
      programsByChannel: {
        ...state.programsByChannel,
        [channelId]: programs,
      },
    })),

  setAllPrograms: (programsByChannel) => set({ programsByChannel }),

  getProgramsForChannel: (channelId) => {
    const { programsByChannel } = get()
    return programsByChannel[channelId] || []
  },

  getCurrentProgram: (channelId) => {
    const programs = get().getProgramsForChannel(channelId)
    const now = Date.now()

    return programs.find((program) => {
      const start = toTimestamp(program.startTime)
      const end = toTimestamp(program.endTime)
      return now >= start && now < end
    })
  },

  getNextProgram: (channelId) => {
    const programs = get().getProgramsForChannel(channelId)
    const now = Date.now()

    // Sort programs by start time and find the first one that starts after now
    const sortedPrograms = [...programs].sort(
      (a, b) => toTimestamp(a.startTime) - toTimestamp(b.startTime)
    )

    return sortedPrograms.find((program) => {
      const start = toTimestamp(program.startTime)
      return start > now
    })
  },

  getProgramsInRange: (channelId, startTime, endTime) => {
    const programs = get().getProgramsForChannel(channelId)

    return programs.filter((program) => {
      const programStart = toTimestamp(program.startTime)
      const programEnd = toTimestamp(program.endTime)
      // Program overlaps with the range if it starts before range ends
      // and ends after range starts
      return programStart < endTime && programEnd > startTime
    })
  },

  setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),

  setSource: (source) => set({ source }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearChannelPrograms: (channelId) =>
    set((state) => {
      const newProgramsByChannel = { ...state.programsByChannel }
      delete newProgramsByChannel[channelId]
      return { programsByChannel: newProgramsByChannel }
    }),

  reset: () => set(initialState),
}))
