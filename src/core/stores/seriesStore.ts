import { create } from 'zustand'
import type { Series, Season, Episode, VODCategory } from '../types/vod'

/**
 * Series store state interface
 */
export interface SeriesState {
  /** All available series categories */
  categories: VODCategory[]
  /** All available series */
  seriesList: Series[]
  /** Seasons for the currently selected series (keyed by series ID) */
  seasonsBySeriesId: Record<string, Season[]>
  /** Episodes for each season (keyed by season ID) */
  episodesBySeasonId: Record<string, Episode[]>
  /** Currently selected category ID */
  selectedCategoryId: string | null
  /** Currently selected series */
  currentSeries: Series | null
  /** Currently selected season */
  currentSeason: Season | null
  /** Currently playing episode */
  currentEpisode: Episode | null
  /** Loading state for series content */
  isLoading: boolean
  /** Error message if series loading fails */
  error: string | null
}

/**
 * Series store actions interface
 */
export interface SeriesActions {
  /** Set all series categories */
  setCategories: (categories: VODCategory[]) => void
  /** Set all series */
  setSeriesList: (series: Series[]) => void
  /** Set seasons for a specific series */
  setSeasons: (seriesId: string, seasons: Season[]) => void
  /** Set episodes for a specific season */
  setEpisodes: (seasonId: string, episodes: Episode[]) => void
  /** Set the selected category ID */
  selectCategory: (categoryId: string | null) => void
  /** Set the current series */
  setCurrentSeries: (series: Series | null) => void
  /** Set the current season */
  setCurrentSeason: (season: Season | null) => void
  /** Set the current episode */
  setCurrentEpisode: (episode: Episode | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Get series for a specific category */
  getSeriesByCategory: (categoryId: string) => Series[]
  /** Get a series by its ID */
  getSeriesById: (seriesId: string) => Series | undefined
  /** Get series filtered by selected category */
  getFilteredSeries: () => Series[]
  /** Get seasons for a specific series */
  getSeasonsBySeriesId: (seriesId: string) => Season[]
  /** Get episodes for a specific season */
  getEpisodesBySeasonId: (seasonId: string) => Episode[]
  /** Get an episode by its ID */
  getEpisodeById: (episodeId: string) => Episode | undefined
  /** Reset the store to initial state */
  reset: () => void
}

const initialState: SeriesState = {
  categories: [],
  seriesList: [],
  seasonsBySeriesId: {},
  episodesBySeasonId: {},
  selectedCategoryId: null,
  currentSeries: null,
  currentSeason: null,
  currentEpisode: null,
  isLoading: false,
  error: null,
}

/**
 * Zustand store for managing series state
 */
export const useSeriesStore = create<SeriesState & SeriesActions>()(
  (set, get) => ({
    ...initialState,

    setCategories: (categories) => set({ categories }),

    setSeriesList: (seriesList) => set({ seriesList }),

    setSeasons: (seriesId, seasons) =>
      set((state) => ({
        seasonsBySeriesId: {
          ...state.seasonsBySeriesId,
          [seriesId]: seasons,
        },
      })),

    setEpisodes: (seasonId, episodes) =>
      set((state) => ({
        episodesBySeasonId: {
          ...state.episodesBySeasonId,
          [seasonId]: episodes,
        },
      })),

    selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

    setCurrentSeries: (series) => set({ currentSeries: series }),

    setCurrentSeason: (season) => set({ currentSeason: season }),

    setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    getSeriesByCategory: (categoryId) => {
      const { seriesList } = get()
      return seriesList.filter((series) => series.categoryId === categoryId)
    },

    getSeriesById: (seriesId) => {
      const { seriesList } = get()
      return seriesList.find((series) => series.id === seriesId)
    },

    getFilteredSeries: () => {
      const { seriesList, selectedCategoryId } = get()
      if (!selectedCategoryId) {
        return seriesList
      }
      return seriesList.filter(
        (series) => series.categoryId === selectedCategoryId
      )
    },

    getSeasonsBySeriesId: (seriesId) => {
      const { seasonsBySeriesId } = get()
      return seasonsBySeriesId[seriesId] || []
    },

    getEpisodesBySeasonId: (seasonId) => {
      const { episodesBySeasonId } = get()
      return episodesBySeasonId[seasonId] || []
    },

    getEpisodeById: (episodeId) => {
      const { episodesBySeasonId } = get()
      for (const episodes of Object.values(episodesBySeasonId)) {
        const episode = episodes.find((ep) => ep.id === episodeId)
        if (episode) {
          return episode
        }
      }
      return undefined
    },

    reset: () => set(initialState),
  })
)
