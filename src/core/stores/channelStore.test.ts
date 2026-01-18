import { describe, it, expect, beforeEach } from 'vitest'
import { useChannelStore } from './channelStore'
import type { Category, Channel } from '../types/channel'

describe('channelStore', () => {
  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Sports' },
    { id: 'cat2', name: 'Movies' },
    { id: 'cat3', name: 'News', parentId: 'cat1' },
  ]

  const mockChannels: Channel[] = [
    {
      id: 'ch1',
      name: 'ESPN',
      categoryId: 'cat1',
      streamUrl: 'http://example.com/espn',
      number: 1,
    },
    {
      id: 'ch2',
      name: 'HBO',
      categoryId: 'cat2',
      streamUrl: 'http://example.com/hbo',
      number: 2,
    },
    {
      id: 'ch3',
      name: 'Fox Sports',
      categoryId: 'cat1',
      streamUrl: 'http://example.com/fox',
      number: 3,
    },
    {
      id: 'ch4',
      name: 'CNN',
      categoryId: 'cat3',
      streamUrl: 'http://example.com/cnn',
      number: 4,
    },
  ]

  beforeEach(() => {
    useChannelStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty categories array', () => {
      const { categories } = useChannelStore.getState()
      expect(categories).toEqual([])
    })

    it('should have empty channels array', () => {
      const { channels } = useChannelStore.getState()
      expect(channels).toEqual([])
    })

    it('should have null selectedCategoryId', () => {
      const { selectedCategoryId } = useChannelStore.getState()
      expect(selectedCategoryId).toBeNull()
    })

    it('should have null currentChannel', () => {
      const { currentChannel } = useChannelStore.getState()
      expect(currentChannel).toBeNull()
    })

    it('should have isLoading as false', () => {
      const { isLoading } = useChannelStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have null error', () => {
      const { error } = useChannelStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('setCategories', () => {
    it('should set categories', () => {
      useChannelStore.getState().setCategories(mockCategories)
      const { categories } = useChannelStore.getState()
      expect(categories).toEqual(mockCategories)
    })

    it('should replace existing categories', () => {
      useChannelStore.getState().setCategories(mockCategories)
      const newCategories: Category[] = [{ id: 'new1', name: 'New Category' }]
      useChannelStore.getState().setCategories(newCategories)
      const { categories } = useChannelStore.getState()
      expect(categories).toEqual(newCategories)
    })
  })

  describe('setChannels', () => {
    it('should set channels', () => {
      useChannelStore.getState().setChannels(mockChannels)
      const { channels } = useChannelStore.getState()
      expect(channels).toEqual(mockChannels)
    })

    it('should replace existing channels', () => {
      useChannelStore.getState().setChannels(mockChannels)
      const newChannels: Channel[] = [
        {
          id: 'new1',
          name: 'New Channel',
          categoryId: 'cat1',
          streamUrl: 'http://example.com/new',
        },
      ]
      useChannelStore.getState().setChannels(newChannels)
      const { channels } = useChannelStore.getState()
      expect(channels).toEqual(newChannels)
    })
  })

  describe('selectCategory', () => {
    it('should set selected category ID', () => {
      useChannelStore.getState().selectCategory('cat1')
      const { selectedCategoryId } = useChannelStore.getState()
      expect(selectedCategoryId).toBe('cat1')
    })

    it('should allow setting to null', () => {
      useChannelStore.getState().selectCategory('cat1')
      useChannelStore.getState().selectCategory(null)
      const { selectedCategoryId } = useChannelStore.getState()
      expect(selectedCategoryId).toBeNull()
    })
  })

  describe('setCurrentChannel', () => {
    it('should set current channel', () => {
      useChannelStore.getState().setCurrentChannel(mockChannels[0])
      const { currentChannel } = useChannelStore.getState()
      expect(currentChannel).toEqual(mockChannels[0])
    })

    it('should allow setting to null', () => {
      useChannelStore.getState().setCurrentChannel(mockChannels[0])
      useChannelStore.getState().setCurrentChannel(null)
      const { currentChannel } = useChannelStore.getState()
      expect(currentChannel).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading to true', () => {
      useChannelStore.getState().setLoading(true)
      const { isLoading } = useChannelStore.getState()
      expect(isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      useChannelStore.getState().setLoading(true)
      useChannelStore.getState().setLoading(false)
      const { isLoading } = useChannelStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      useChannelStore.getState().setError('Failed to load channels')
      const { error } = useChannelStore.getState()
      expect(error).toBe('Failed to load channels')
    })

    it('should allow clearing error', () => {
      useChannelStore.getState().setError('Some error')
      useChannelStore.getState().setError(null)
      const { error } = useChannelStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('getChannelsByCategory', () => {
    beforeEach(() => {
      useChannelStore.getState().setChannels(mockChannels)
    })

    it('should return channels for a given category', () => {
      const sportsChannels = useChannelStore
        .getState()
        .getChannelsByCategory('cat1')
      expect(sportsChannels).toHaveLength(2)
      expect(sportsChannels.map((c) => c.id)).toEqual(['ch1', 'ch3'])
    })

    it('should return empty array for category with no channels', () => {
      const channels = useChannelStore
        .getState()
        .getChannelsByCategory('nonexistent')
      expect(channels).toEqual([])
    })
  })

  describe('getChannelById', () => {
    beforeEach(() => {
      useChannelStore.getState().setChannels(mockChannels)
    })

    it('should return channel by ID', () => {
      const channel = useChannelStore.getState().getChannelById('ch2')
      expect(channel).toEqual(mockChannels[1])
    })

    it('should return undefined for nonexistent channel', () => {
      const channel = useChannelStore.getState().getChannelById('nonexistent')
      expect(channel).toBeUndefined()
    })
  })

  describe('getFilteredChannels', () => {
    beforeEach(() => {
      useChannelStore.getState().setChannels(mockChannels)
    })

    it('should return all channels when no category is selected', () => {
      const channels = useChannelStore.getState().getFilteredChannels()
      expect(channels).toHaveLength(4)
    })

    it('should return filtered channels when category is selected', () => {
      useChannelStore.getState().selectCategory('cat1')
      const channels = useChannelStore.getState().getFilteredChannels()
      expect(channels).toHaveLength(2)
      expect(channels.map((c) => c.id)).toEqual(['ch1', 'ch3'])
    })

    it('should return empty array for category with no channels', () => {
      useChannelStore.getState().selectCategory('nonexistent')
      const channels = useChannelStore.getState().getFilteredChannels()
      expect(channels).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useChannelStore.getState().setCategories(mockCategories)
      useChannelStore.getState().setChannels(mockChannels)
      useChannelStore.getState().selectCategory('cat1')
      useChannelStore.getState().setCurrentChannel(mockChannels[0])
      useChannelStore.getState().setLoading(true)
      useChannelStore.getState().setError('Some error')

      useChannelStore.getState().reset()

      const state = useChannelStore.getState()
      expect(state.categories).toEqual([])
      expect(state.channels).toEqual([])
      expect(state.selectedCategoryId).toBeNull()
      expect(state.currentChannel).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
