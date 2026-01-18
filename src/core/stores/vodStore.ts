import { create } from 'zustand'
import type { VODCategory, VODItem } from '../types/vod'

/**
 * VOD store state interface
 */
export interface VODState {
  /** All available VOD categories */
  categories: VODCategory[]
  /** All available VOD movies */
  movies: VODItem[]
  /** Currently selected category ID */
  selectedCategoryId: string | null
  /** Currently selected/playing VOD item */
  currentMovie: VODItem | null
  /** Loading state for VOD content */
  isLoading: boolean
  /** Error message if VOD loading fails */
  error: string | null
}

/**
 * VOD store actions interface
 */
export interface VODActions {
  /** Set all VOD categories */
  setCategories: (categories: VODCategory[]) => void
  /** Set all VOD movies */
  setMovies: (movies: VODItem[]) => void
  /** Set the selected category ID */
  selectCategory: (categoryId: string | null) => void
  /** Set the current movie */
  setCurrentMovie: (movie: VODItem | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Get movies for the selected category */
  getMoviesByCategory: (categoryId: string) => VODItem[]
  /** Get a movie by its ID */
  getMovieById: (movieId: string) => VODItem | undefined
  /** Get movies filtered by selected category */
  getFilteredMovies: () => VODItem[]
  /** Reset the store to initial state */
  reset: () => void
}

const initialState: VODState = {
  categories: [],
  movies: [],
  selectedCategoryId: null,
  currentMovie: null,
  isLoading: false,
  error: null,
}

/**
 * Zustand store for managing VOD state
 */
export const useVODStore = create<VODState & VODActions>()((set, get) => ({
  ...initialState,

  setCategories: (categories) => set({ categories }),

  setMovies: (movies) => set({ movies }),

  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  setCurrentMovie: (movie) => set({ currentMovie: movie }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getMoviesByCategory: (categoryId) => {
    const { movies } = get()
    return movies.filter((movie) => movie.categoryId === categoryId)
  },

  getMovieById: (movieId) => {
    const { movies } = get()
    return movies.find((movie) => movie.id === movieId)
  },

  getFilteredMovies: () => {
    const { movies, selectedCategoryId } = get()
    if (!selectedCategoryId) {
      return movies
    }
    return movies.filter((movie) => movie.categoryId === selectedCategoryId)
  },

  reset: () => set(initialState),
}))
