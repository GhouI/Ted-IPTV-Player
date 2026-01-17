import { describe, it, expect } from 'vitest'
import type {
  VODCategory,
  VODItem,
  Series,
  Season,
  Episode,
  SeriesInfo,
} from './vod'

describe('VOD Types', () => {
  describe('VODCategory', () => {
    it('should accept valid VODCategory with required fields', () => {
      const category: VODCategory = {
        id: 'cat-1',
        name: 'Movies',
      }

      expect(category.id).toBe('cat-1')
      expect(category.name).toBe('Movies')
    })

    it('should accept VODCategory with optional parentId', () => {
      const category: VODCategory = {
        id: 'cat-2',
        name: 'Action Movies',
        parentId: 'cat-1',
      }

      expect(category.parentId).toBe('cat-1')
    })
  })

  describe('VODItem', () => {
    it('should accept valid VODItem with required fields', () => {
      const movie: VODItem = {
        id: 'movie-1',
        title: 'Example Movie',
        categoryId: 'cat-1',
        streamUrl: 'http://example.com/movie.mp4',
      }

      expect(movie.id).toBe('movie-1')
      expect(movie.title).toBe('Example Movie')
      expect(movie.categoryId).toBe('cat-1')
      expect(movie.streamUrl).toBe('http://example.com/movie.mp4')
    })

    it('should accept VODItem with all optional fields', () => {
      const movie: VODItem = {
        id: 'movie-2',
        title: 'Full Movie',
        categoryId: 'cat-1',
        streamUrl: 'http://example.com/movie.m3u8',
        streamType: 'hls',
        description: 'A great movie about testing',
        poster: 'http://example.com/poster.jpg',
        backdrop: 'http://example.com/backdrop.jpg',
        year: 2024,
        duration: 7200,
        genres: ['Action', 'Comedy'],
        directors: ['John Director'],
        cast: ['Actor One', 'Actor Two'],
        rating: 'PG-13',
        score: 8.5,
        containerFormat: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        dateAdded: '2024-01-15T00:00:00Z',
      }

      expect(movie.streamType).toBe('hls')
      expect(movie.description).toBe('A great movie about testing')
      expect(movie.year).toBe(2024)
      expect(movie.duration).toBe(7200)
      expect(movie.genres).toContain('Action')
      expect(movie.directors).toContain('John Director')
      expect(movie.cast).toHaveLength(2)
      expect(movie.score).toBe(8.5)
    })

    it('should support different stream types', () => {
      const vodStream: VODItem = {
        id: '1',
        title: 'VOD',
        categoryId: 'c1',
        streamUrl: 'http://test.com/vod',
        streamType: 'vod',
      }

      const dashStream: VODItem = {
        id: '2',
        title: 'DASH',
        categoryId: 'c1',
        streamUrl: 'http://test.com/dash.mpd',
        streamType: 'dash',
      }

      const unknownStream: VODItem = {
        id: '3',
        title: 'Unknown',
        categoryId: 'c1',
        streamUrl: 'http://test.com/unknown',
        streamType: 'unknown',
      }

      expect(vodStream.streamType).toBe('vod')
      expect(dashStream.streamType).toBe('dash')
      expect(unknownStream.streamType).toBe('unknown')
    })
  })

  describe('Series', () => {
    it('should accept valid Series with required fields', () => {
      const series: Series = {
        id: 'series-1',
        title: 'Example Series',
        categoryId: 'cat-tv',
      }

      expect(series.id).toBe('series-1')
      expect(series.title).toBe('Example Series')
      expect(series.categoryId).toBe('cat-tv')
    })

    it('should accept Series with all optional fields', () => {
      const series: Series = {
        id: 'series-2',
        title: 'Full Series',
        categoryId: 'cat-drama',
        description: 'A compelling drama series',
        poster: 'http://example.com/series-poster.jpg',
        backdrop: 'http://example.com/series-backdrop.jpg',
        year: 2020,
        genres: ['Drama', 'Thriller'],
        cast: ['Star Actor', 'Supporting Actor'],
        rating: 'TV-MA',
        score: 9.1,
        seasonCount: 5,
        episodeCount: 50,
        lastUpdated: 1705276800000,
      }

      expect(series.description).toBe('A compelling drama series')
      expect(series.year).toBe(2020)
      expect(series.seasonCount).toBe(5)
      expect(series.episodeCount).toBe(50)
      expect(series.genres).toContain('Drama')
    })
  })

  describe('Season', () => {
    it('should accept valid Season with required fields', () => {
      const season: Season = {
        id: 'season-1',
        seriesId: 'series-1',
        seasonNumber: 1,
      }

      expect(season.id).toBe('season-1')
      expect(season.seriesId).toBe('series-1')
      expect(season.seasonNumber).toBe(1)
    })

    it('should accept Season with all optional fields', () => {
      const season: Season = {
        id: 'season-2',
        seriesId: 'series-1',
        seasonNumber: 2,
        name: 'Season Two: The Revenge',
        description: 'The story continues...',
        poster: 'http://example.com/season2-poster.jpg',
        airDate: '2021-06-15',
        episodeCount: 12,
      }

      expect(season.name).toBe('Season Two: The Revenge')
      expect(season.description).toBe('The story continues...')
      expect(season.episodeCount).toBe(12)
    })
  })

  describe('Episode', () => {
    it('should accept valid Episode with required fields', () => {
      const episode: Episode = {
        id: 'ep-1',
        seriesId: 'series-1',
        seasonId: 'season-1',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Pilot',
        streamUrl: 'http://example.com/episode.mp4',
      }

      expect(episode.id).toBe('ep-1')
      expect(episode.seriesId).toBe('series-1')
      expect(episode.seasonId).toBe('season-1')
      expect(episode.seasonNumber).toBe(1)
      expect(episode.episodeNumber).toBe(1)
      expect(episode.title).toBe('Pilot')
      expect(episode.streamUrl).toBe('http://example.com/episode.mp4')
    })

    it('should accept Episode with all optional fields', () => {
      const episode: Episode = {
        id: 'ep-5',
        seriesId: 'series-1',
        seasonId: 'season-1',
        seasonNumber: 1,
        episodeNumber: 5,
        title: 'The Big Reveal',
        streamUrl: 'http://example.com/s01e05.m3u8',
        streamType: 'hls',
        description: 'Everything changes in this pivotal episode',
        thumbnail: 'http://example.com/ep5-thumb.jpg',
        duration: 2700,
        airDate: '2020-02-15',
        rating: 'TV-14',
        containerFormat: 'mkv',
        videoCodec: 'hevc',
        audioCodec: 'ac3',
      }

      expect(episode.streamType).toBe('hls')
      expect(episode.description).toBe('Everything changes in this pivotal episode')
      expect(episode.duration).toBe(2700)
      expect(episode.videoCodec).toBe('hevc')
    })
  })

  describe('SeriesInfo', () => {
    it('should combine series, seasons, and episodes', () => {
      const seriesInfo: SeriesInfo = {
        series: {
          id: 'series-1',
          title: 'Test Series',
          categoryId: 'cat-1',
          seasonCount: 2,
        },
        seasons: [
          { id: 'season-1', seriesId: 'series-1', seasonNumber: 1, episodeCount: 2 },
          { id: 'season-2', seriesId: 'series-1', seasonNumber: 2, episodeCount: 1 },
        ],
        episodes: {
          'season-1': [
            {
              id: 'ep-1',
              seriesId: 'series-1',
              seasonId: 'season-1',
              seasonNumber: 1,
              episodeNumber: 1,
              title: 'Episode 1',
              streamUrl: 'http://example.com/s01e01.mp4',
            },
            {
              id: 'ep-2',
              seriesId: 'series-1',
              seasonId: 'season-1',
              seasonNumber: 1,
              episodeNumber: 2,
              title: 'Episode 2',
              streamUrl: 'http://example.com/s01e02.mp4',
            },
          ],
          'season-2': [
            {
              id: 'ep-3',
              seriesId: 'series-1',
              seasonId: 'season-2',
              seasonNumber: 2,
              episodeNumber: 1,
              title: 'Episode 1',
              streamUrl: 'http://example.com/s02e01.mp4',
            },
          ],
        },
      }

      expect(seriesInfo.series.title).toBe('Test Series')
      expect(seriesInfo.seasons).toHaveLength(2)
      expect(seriesInfo.episodes['season-1']).toHaveLength(2)
      expect(seriesInfo.episodes['season-2']).toHaveLength(1)
    })

    it('should allow empty seasons and episodes', () => {
      const emptySeriesInfo: SeriesInfo = {
        series: {
          id: 'series-empty',
          title: 'New Series',
          categoryId: 'cat-1',
        },
        seasons: [],
        episodes: {},
      }

      expect(emptySeriesInfo.seasons).toHaveLength(0)
      expect(Object.keys(emptySeriesInfo.episodes)).toHaveLength(0)
    })
  })
})
