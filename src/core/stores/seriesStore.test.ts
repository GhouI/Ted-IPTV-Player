import { describe, it, expect, beforeEach } from 'vitest'
import { useSeriesStore } from './seriesStore'
import type { Series, Season, Episode, VODCategory } from '../types/vod'

describe('seriesStore', () => {
  const mockCategories: VODCategory[] = [
    { id: 'cat1', name: 'Drama' },
    { id: 'cat2', name: 'Comedy' },
    { id: 'cat3', name: 'Action' },
  ]

  const mockSeriesList: Series[] = [
    {
      id: 'series1',
      title: 'Breaking Bad',
      categoryId: 'cat1',
      year: 2008,
      seasonCount: 5,
      episodeCount: 62,
    },
    {
      id: 'series2',
      title: 'The Office',
      categoryId: 'cat2',
      year: 2005,
      seasonCount: 9,
      episodeCount: 201,
    },
    {
      id: 'series3',
      title: 'Game of Thrones',
      categoryId: 'cat1',
      year: 2011,
      seasonCount: 8,
      episodeCount: 73,
    },
  ]

  const mockSeasons: Season[] = [
    {
      id: 'season1',
      seriesId: 'series1',
      seasonNumber: 1,
      name: 'Season 1',
      episodeCount: 7,
    },
    {
      id: 'season2',
      seriesId: 'series1',
      seasonNumber: 2,
      name: 'Season 2',
      episodeCount: 13,
    },
  ]

  const mockEpisodes: Episode[] = [
    {
      id: 'ep1',
      seriesId: 'series1',
      seasonId: 'season1',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pilot',
      streamUrl: 'http://example.com/s1e1',
      duration: 3540,
    },
    {
      id: 'ep2',
      seriesId: 'series1',
      seasonId: 'season1',
      seasonNumber: 1,
      episodeNumber: 2,
      title: "Cat's in the Bag...",
      streamUrl: 'http://example.com/s1e2',
      duration: 2820,
    },
    {
      id: 'ep3',
      seriesId: 'series1',
      seasonId: 'season2',
      seasonNumber: 2,
      episodeNumber: 1,
      title: 'Seven Thirty-Seven',
      streamUrl: 'http://example.com/s2e1',
      duration: 2880,
    },
  ]

  beforeEach(() => {
    useSeriesStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty categories array', () => {
      const { categories } = useSeriesStore.getState()
      expect(categories).toEqual([])
    })

    it('should have empty seriesList array', () => {
      const { seriesList } = useSeriesStore.getState()
      expect(seriesList).toEqual([])
    })

    it('should have empty seasonsBySeriesId', () => {
      const { seasonsBySeriesId } = useSeriesStore.getState()
      expect(seasonsBySeriesId).toEqual({})
    })

    it('should have empty episodesBySeasonId', () => {
      const { episodesBySeasonId } = useSeriesStore.getState()
      expect(episodesBySeasonId).toEqual({})
    })

    it('should have null selectedCategoryId', () => {
      const { selectedCategoryId } = useSeriesStore.getState()
      expect(selectedCategoryId).toBeNull()
    })

    it('should have null currentSeries', () => {
      const { currentSeries } = useSeriesStore.getState()
      expect(currentSeries).toBeNull()
    })

    it('should have null currentSeason', () => {
      const { currentSeason } = useSeriesStore.getState()
      expect(currentSeason).toBeNull()
    })

    it('should have null currentEpisode', () => {
      const { currentEpisode } = useSeriesStore.getState()
      expect(currentEpisode).toBeNull()
    })

    it('should have isLoading as false', () => {
      const { isLoading } = useSeriesStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have null error', () => {
      const { error } = useSeriesStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('setCategories', () => {
    it('should set categories', () => {
      useSeriesStore.getState().setCategories(mockCategories)
      const { categories } = useSeriesStore.getState()
      expect(categories).toEqual(mockCategories)
    })

    it('should replace existing categories', () => {
      useSeriesStore.getState().setCategories(mockCategories)
      const newCategories: VODCategory[] = [{ id: 'new1', name: 'New Category' }]
      useSeriesStore.getState().setCategories(newCategories)
      const { categories } = useSeriesStore.getState()
      expect(categories).toEqual(newCategories)
    })
  })

  describe('setSeriesList', () => {
    it('should set series list', () => {
      useSeriesStore.getState().setSeriesList(mockSeriesList)
      const { seriesList } = useSeriesStore.getState()
      expect(seriesList).toEqual(mockSeriesList)
    })

    it('should replace existing series list', () => {
      useSeriesStore.getState().setSeriesList(mockSeriesList)
      const newSeries: Series[] = [
        {
          id: 'new1',
          title: 'New Series',
          categoryId: 'cat1',
        },
      ]
      useSeriesStore.getState().setSeriesList(newSeries)
      const { seriesList } = useSeriesStore.getState()
      expect(seriesList).toEqual(newSeries)
    })
  })

  describe('setSeasons', () => {
    it('should set seasons for a series', () => {
      useSeriesStore.getState().setSeasons('series1', mockSeasons)
      const { seasonsBySeriesId } = useSeriesStore.getState()
      expect(seasonsBySeriesId['series1']).toEqual(mockSeasons)
    })

    it('should add seasons for multiple series', () => {
      const otherSeasons: Season[] = [
        { id: 's2-1', seriesId: 'series2', seasonNumber: 1 },
      ]
      useSeriesStore.getState().setSeasons('series1', mockSeasons)
      useSeriesStore.getState().setSeasons('series2', otherSeasons)
      const { seasonsBySeriesId } = useSeriesStore.getState()
      expect(seasonsBySeriesId['series1']).toEqual(mockSeasons)
      expect(seasonsBySeriesId['series2']).toEqual(otherSeasons)
    })

    it('should replace existing seasons for a series', () => {
      useSeriesStore.getState().setSeasons('series1', mockSeasons)
      const newSeasons: Season[] = [
        { id: 'new-season', seriesId: 'series1', seasonNumber: 1 },
      ]
      useSeriesStore.getState().setSeasons('series1', newSeasons)
      const { seasonsBySeriesId } = useSeriesStore.getState()
      expect(seasonsBySeriesId['series1']).toEqual(newSeasons)
    })
  })

  describe('setEpisodes', () => {
    it('should set episodes for a season', () => {
      const season1Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season1')
      useSeriesStore.getState().setEpisodes('season1', season1Episodes)
      const { episodesBySeasonId } = useSeriesStore.getState()
      expect(episodesBySeasonId['season1']).toEqual(season1Episodes)
    })

    it('should add episodes for multiple seasons', () => {
      const season1Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season1')
      const season2Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season2')
      useSeriesStore.getState().setEpisodes('season1', season1Episodes)
      useSeriesStore.getState().setEpisodes('season2', season2Episodes)
      const { episodesBySeasonId } = useSeriesStore.getState()
      expect(episodesBySeasonId['season1']).toEqual(season1Episodes)
      expect(episodesBySeasonId['season2']).toEqual(season2Episodes)
    })

    it('should replace existing episodes for a season', () => {
      const season1Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season1')
      useSeriesStore.getState().setEpisodes('season1', season1Episodes)
      const newEpisodes: Episode[] = [
        {
          id: 'new-ep',
          seriesId: 'series1',
          seasonId: 'season1',
          seasonNumber: 1,
          episodeNumber: 1,
          title: 'New Episode',
          streamUrl: 'http://example.com/new',
        },
      ]
      useSeriesStore.getState().setEpisodes('season1', newEpisodes)
      const { episodesBySeasonId } = useSeriesStore.getState()
      expect(episodesBySeasonId['season1']).toEqual(newEpisodes)
    })
  })

  describe('selectCategory', () => {
    it('should set selected category ID', () => {
      useSeriesStore.getState().selectCategory('cat1')
      const { selectedCategoryId } = useSeriesStore.getState()
      expect(selectedCategoryId).toBe('cat1')
    })

    it('should allow setting to null', () => {
      useSeriesStore.getState().selectCategory('cat1')
      useSeriesStore.getState().selectCategory(null)
      const { selectedCategoryId } = useSeriesStore.getState()
      expect(selectedCategoryId).toBeNull()
    })
  })

  describe('setCurrentSeries', () => {
    it('should set current series', () => {
      useSeriesStore.getState().setCurrentSeries(mockSeriesList[0])
      const { currentSeries } = useSeriesStore.getState()
      expect(currentSeries).toEqual(mockSeriesList[0])
    })

    it('should allow setting to null', () => {
      useSeriesStore.getState().setCurrentSeries(mockSeriesList[0])
      useSeriesStore.getState().setCurrentSeries(null)
      const { currentSeries } = useSeriesStore.getState()
      expect(currentSeries).toBeNull()
    })
  })

  describe('setCurrentSeason', () => {
    it('should set current season', () => {
      useSeriesStore.getState().setCurrentSeason(mockSeasons[0])
      const { currentSeason } = useSeriesStore.getState()
      expect(currentSeason).toEqual(mockSeasons[0])
    })

    it('should allow setting to null', () => {
      useSeriesStore.getState().setCurrentSeason(mockSeasons[0])
      useSeriesStore.getState().setCurrentSeason(null)
      const { currentSeason } = useSeriesStore.getState()
      expect(currentSeason).toBeNull()
    })
  })

  describe('setCurrentEpisode', () => {
    it('should set current episode', () => {
      useSeriesStore.getState().setCurrentEpisode(mockEpisodes[0])
      const { currentEpisode } = useSeriesStore.getState()
      expect(currentEpisode).toEqual(mockEpisodes[0])
    })

    it('should allow setting to null', () => {
      useSeriesStore.getState().setCurrentEpisode(mockEpisodes[0])
      useSeriesStore.getState().setCurrentEpisode(null)
      const { currentEpisode } = useSeriesStore.getState()
      expect(currentEpisode).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading to true', () => {
      useSeriesStore.getState().setLoading(true)
      const { isLoading } = useSeriesStore.getState()
      expect(isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      useSeriesStore.getState().setLoading(true)
      useSeriesStore.getState().setLoading(false)
      const { isLoading } = useSeriesStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      useSeriesStore.getState().setError('Failed to load series')
      const { error } = useSeriesStore.getState()
      expect(error).toBe('Failed to load series')
    })

    it('should allow clearing error', () => {
      useSeriesStore.getState().setError('Some error')
      useSeriesStore.getState().setError(null)
      const { error } = useSeriesStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('getSeriesByCategory', () => {
    beforeEach(() => {
      useSeriesStore.getState().setSeriesList(mockSeriesList)
    })

    it('should return series for a given category', () => {
      const dramaSeries = useSeriesStore.getState().getSeriesByCategory('cat1')
      expect(dramaSeries).toHaveLength(2)
      expect(dramaSeries.map((s) => s.id)).toEqual(['series1', 'series3'])
    })

    it('should return empty array for category with no series', () => {
      const series = useSeriesStore.getState().getSeriesByCategory('nonexistent')
      expect(series).toEqual([])
    })
  })

  describe('getSeriesById', () => {
    beforeEach(() => {
      useSeriesStore.getState().setSeriesList(mockSeriesList)
    })

    it('should return series by ID', () => {
      const series = useSeriesStore.getState().getSeriesById('series2')
      expect(series).toEqual(mockSeriesList[1])
    })

    it('should return undefined for nonexistent series', () => {
      const series = useSeriesStore.getState().getSeriesById('nonexistent')
      expect(series).toBeUndefined()
    })
  })

  describe('getFilteredSeries', () => {
    beforeEach(() => {
      useSeriesStore.getState().setSeriesList(mockSeriesList)
    })

    it('should return all series when no category is selected', () => {
      const series = useSeriesStore.getState().getFilteredSeries()
      expect(series).toHaveLength(3)
    })

    it('should return filtered series when category is selected', () => {
      useSeriesStore.getState().selectCategory('cat1')
      const series = useSeriesStore.getState().getFilteredSeries()
      expect(series).toHaveLength(2)
      expect(series.map((s) => s.id)).toEqual(['series1', 'series3'])
    })

    it('should return empty array for category with no series', () => {
      useSeriesStore.getState().selectCategory('nonexistent')
      const series = useSeriesStore.getState().getFilteredSeries()
      expect(series).toEqual([])
    })
  })

  describe('getSeasonsBySeriesId', () => {
    beforeEach(() => {
      useSeriesStore.getState().setSeasons('series1', mockSeasons)
    })

    it('should return seasons for a series', () => {
      const seasons = useSeriesStore.getState().getSeasonsBySeriesId('series1')
      expect(seasons).toEqual(mockSeasons)
    })

    it('should return empty array for series with no seasons loaded', () => {
      const seasons = useSeriesStore.getState().getSeasonsBySeriesId('series2')
      expect(seasons).toEqual([])
    })
  })

  describe('getEpisodesBySeasonId', () => {
    beforeEach(() => {
      const season1Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season1')
      useSeriesStore.getState().setEpisodes('season1', season1Episodes)
    })

    it('should return episodes for a season', () => {
      const episodes = useSeriesStore.getState().getEpisodesBySeasonId('season1')
      expect(episodes).toHaveLength(2)
    })

    it('should return empty array for season with no episodes loaded', () => {
      const episodes = useSeriesStore.getState().getEpisodesBySeasonId('season2')
      expect(episodes).toEqual([])
    })
  })

  describe('getEpisodeById', () => {
    beforeEach(() => {
      const season1Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season1')
      const season2Episodes = mockEpisodes.filter((ep) => ep.seasonId === 'season2')
      useSeriesStore.getState().setEpisodes('season1', season1Episodes)
      useSeriesStore.getState().setEpisodes('season2', season2Episodes)
    })

    it('should return episode by ID from any season', () => {
      const episode1 = useSeriesStore.getState().getEpisodeById('ep1')
      expect(episode1).toEqual(mockEpisodes[0])

      const episode3 = useSeriesStore.getState().getEpisodeById('ep3')
      expect(episode3).toEqual(mockEpisodes[2])
    })

    it('should return undefined for nonexistent episode', () => {
      const episode = useSeriesStore.getState().getEpisodeById('nonexistent')
      expect(episode).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useSeriesStore.getState().setCategories(mockCategories)
      useSeriesStore.getState().setSeriesList(mockSeriesList)
      useSeriesStore.getState().setSeasons('series1', mockSeasons)
      useSeriesStore.getState().setEpisodes('season1', mockEpisodes)
      useSeriesStore.getState().selectCategory('cat1')
      useSeriesStore.getState().setCurrentSeries(mockSeriesList[0])
      useSeriesStore.getState().setCurrentSeason(mockSeasons[0])
      useSeriesStore.getState().setCurrentEpisode(mockEpisodes[0])
      useSeriesStore.getState().setLoading(true)
      useSeriesStore.getState().setError('Some error')

      useSeriesStore.getState().reset()

      const state = useSeriesStore.getState()
      expect(state.categories).toEqual([])
      expect(state.seriesList).toEqual([])
      expect(state.seasonsBySeriesId).toEqual({})
      expect(state.episodesBySeasonId).toEqual({})
      expect(state.selectedCategoryId).toBeNull()
      expect(state.currentSeries).toBeNull()
      expect(state.currentSeason).toBeNull()
      expect(state.currentEpisode).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
