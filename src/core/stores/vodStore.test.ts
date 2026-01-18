import { describe, it, expect, beforeEach } from 'vitest'
import { useVODStore } from './vodStore'
import type { VODCategory, VODItem } from '../types/vod'

describe('vodStore', () => {
  const mockCategories: VODCategory[] = [
    { id: 'cat1', name: 'Action' },
    { id: 'cat2', name: 'Comedy' },
    { id: 'cat3', name: 'Drama', parentId: 'cat1' },
  ]

  const mockMovies: VODItem[] = [
    {
      id: 'mov1',
      title: 'Die Hard',
      categoryId: 'cat1',
      streamUrl: 'http://example.com/diehard',
      year: 1988,
      duration: 7920,
    },
    {
      id: 'mov2',
      title: 'The Hangover',
      categoryId: 'cat2',
      streamUrl: 'http://example.com/hangover',
      year: 2009,
      duration: 6000,
    },
    {
      id: 'mov3',
      title: 'Mad Max',
      categoryId: 'cat1',
      streamUrl: 'http://example.com/madmax',
      year: 2015,
      duration: 7200,
    },
    {
      id: 'mov4',
      title: 'The Shawshank Redemption',
      categoryId: 'cat3',
      streamUrl: 'http://example.com/shawshank',
      year: 1994,
      duration: 8520,
    },
  ]

  beforeEach(() => {
    useVODStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty categories array', () => {
      const { categories } = useVODStore.getState()
      expect(categories).toEqual([])
    })

    it('should have empty movies array', () => {
      const { movies } = useVODStore.getState()
      expect(movies).toEqual([])
    })

    it('should have null selectedCategoryId', () => {
      const { selectedCategoryId } = useVODStore.getState()
      expect(selectedCategoryId).toBeNull()
    })

    it('should have null currentMovie', () => {
      const { currentMovie } = useVODStore.getState()
      expect(currentMovie).toBeNull()
    })

    it('should have isLoading as false', () => {
      const { isLoading } = useVODStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have null error', () => {
      const { error } = useVODStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('setCategories', () => {
    it('should set categories', () => {
      useVODStore.getState().setCategories(mockCategories)
      const { categories } = useVODStore.getState()
      expect(categories).toEqual(mockCategories)
    })

    it('should replace existing categories', () => {
      useVODStore.getState().setCategories(mockCategories)
      const newCategories: VODCategory[] = [{ id: 'new1', name: 'New Category' }]
      useVODStore.getState().setCategories(newCategories)
      const { categories } = useVODStore.getState()
      expect(categories).toEqual(newCategories)
    })
  })

  describe('setMovies', () => {
    it('should set movies', () => {
      useVODStore.getState().setMovies(mockMovies)
      const { movies } = useVODStore.getState()
      expect(movies).toEqual(mockMovies)
    })

    it('should replace existing movies', () => {
      useVODStore.getState().setMovies(mockMovies)
      const newMovies: VODItem[] = [
        {
          id: 'new1',
          title: 'New Movie',
          categoryId: 'cat1',
          streamUrl: 'http://example.com/new',
        },
      ]
      useVODStore.getState().setMovies(newMovies)
      const { movies } = useVODStore.getState()
      expect(movies).toEqual(newMovies)
    })
  })

  describe('selectCategory', () => {
    it('should set selected category ID', () => {
      useVODStore.getState().selectCategory('cat1')
      const { selectedCategoryId } = useVODStore.getState()
      expect(selectedCategoryId).toBe('cat1')
    })

    it('should allow setting to null', () => {
      useVODStore.getState().selectCategory('cat1')
      useVODStore.getState().selectCategory(null)
      const { selectedCategoryId } = useVODStore.getState()
      expect(selectedCategoryId).toBeNull()
    })
  })

  describe('setCurrentMovie', () => {
    it('should set current movie', () => {
      useVODStore.getState().setCurrentMovie(mockMovies[0])
      const { currentMovie } = useVODStore.getState()
      expect(currentMovie).toEqual(mockMovies[0])
    })

    it('should allow setting to null', () => {
      useVODStore.getState().setCurrentMovie(mockMovies[0])
      useVODStore.getState().setCurrentMovie(null)
      const { currentMovie } = useVODStore.getState()
      expect(currentMovie).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading to true', () => {
      useVODStore.getState().setLoading(true)
      const { isLoading } = useVODStore.getState()
      expect(isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      useVODStore.getState().setLoading(true)
      useVODStore.getState().setLoading(false)
      const { isLoading } = useVODStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      useVODStore.getState().setError('Failed to load movies')
      const { error } = useVODStore.getState()
      expect(error).toBe('Failed to load movies')
    })

    it('should allow clearing error', () => {
      useVODStore.getState().setError('Some error')
      useVODStore.getState().setError(null)
      const { error } = useVODStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('getMoviesByCategory', () => {
    beforeEach(() => {
      useVODStore.getState().setMovies(mockMovies)
    })

    it('should return movies for a given category', () => {
      const actionMovies = useVODStore.getState().getMoviesByCategory('cat1')
      expect(actionMovies).toHaveLength(2)
      expect(actionMovies.map((m) => m.id)).toEqual(['mov1', 'mov3'])
    })

    it('should return empty array for category with no movies', () => {
      const movies = useVODStore.getState().getMoviesByCategory('nonexistent')
      expect(movies).toEqual([])
    })
  })

  describe('getMovieById', () => {
    beforeEach(() => {
      useVODStore.getState().setMovies(mockMovies)
    })

    it('should return movie by ID', () => {
      const movie = useVODStore.getState().getMovieById('mov2')
      expect(movie).toEqual(mockMovies[1])
    })

    it('should return undefined for nonexistent movie', () => {
      const movie = useVODStore.getState().getMovieById('nonexistent')
      expect(movie).toBeUndefined()
    })
  })

  describe('getFilteredMovies', () => {
    beforeEach(() => {
      useVODStore.getState().setMovies(mockMovies)
    })

    it('should return all movies when no category is selected', () => {
      const movies = useVODStore.getState().getFilteredMovies()
      expect(movies).toHaveLength(4)
    })

    it('should return filtered movies when category is selected', () => {
      useVODStore.getState().selectCategory('cat1')
      const movies = useVODStore.getState().getFilteredMovies()
      expect(movies).toHaveLength(2)
      expect(movies.map((m) => m.id)).toEqual(['mov1', 'mov3'])
    })

    it('should return empty array for category with no movies', () => {
      useVODStore.getState().selectCategory('nonexistent')
      const movies = useVODStore.getState().getFilteredMovies()
      expect(movies).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useVODStore.getState().setCategories(mockCategories)
      useVODStore.getState().setMovies(mockMovies)
      useVODStore.getState().selectCategory('cat1')
      useVODStore.getState().setCurrentMovie(mockMovies[0])
      useVODStore.getState().setLoading(true)
      useVODStore.getState().setError('Some error')

      useVODStore.getState().reset()

      const state = useVODStore.getState()
      expect(state.categories).toEqual([])
      expect(state.movies).toEqual([])
      expect(state.selectedCategoryId).toBeNull()
      expect(state.currentMovie).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
