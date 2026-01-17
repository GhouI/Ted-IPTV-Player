import { create } from 'zustand'
import type { Category, Channel } from '../types/channel'

/**
 * Channel store state interface
 */
export interface ChannelState {
  /** All available categories */
  categories: Category[]
  /** All available channels */
  channels: Channel[]
  /** Currently selected category ID */
  selectedCategoryId: string | null
  /** Currently selected/playing channel */
  currentChannel: Channel | null
  /** Loading state for channels */
  isLoading: boolean
  /** Error message if channel loading fails */
  error: string | null
}

/**
 * Channel store actions interface
 */
export interface ChannelActions {
  /** Set all categories */
  setCategories: (categories: Category[]) => void
  /** Set all channels */
  setChannels: (channels: Channel[]) => void
  /** Set the selected category ID */
  selectCategory: (categoryId: string | null) => void
  /** Set the current channel */
  setCurrentChannel: (channel: Channel | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Get channels for the selected category */
  getChannelsByCategory: (categoryId: string) => Channel[]
  /** Get a channel by its ID */
  getChannelById: (channelId: string) => Channel | undefined
  /** Get channels filtered by selected category */
  getFilteredChannels: () => Channel[]
  /** Reset the store to initial state */
  reset: () => void
}

const initialState: ChannelState = {
  categories: [],
  channels: [],
  selectedCategoryId: null,
  currentChannel: null,
  isLoading: false,
  error: null,
}

/**
 * Zustand store for managing channel state
 */
export const useChannelStore = create<ChannelState & ChannelActions>()(
  (set, get) => ({
    ...initialState,

    setCategories: (categories) => set({ categories }),

    setChannels: (channels) => set({ channels }),

    selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

    setCurrentChannel: (channel) => set({ currentChannel: channel }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    getChannelsByCategory: (categoryId) => {
      const { channels } = get()
      return channels.filter((channel) => channel.categoryId === categoryId)
    },

    getChannelById: (channelId) => {
      const { channels } = get()
      return channels.find((channel) => channel.id === channelId)
    },

    getFilteredChannels: () => {
      const { channels, selectedCategoryId } = get()
      if (!selectedCategoryId) {
        return channels
      }
      return channels.filter(
        (channel) => channel.categoryId === selectedCategoryId
      )
    },

    reset: () => set(initialState),
  })
)
