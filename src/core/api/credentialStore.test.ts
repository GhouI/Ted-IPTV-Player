/**
 * Tests for CredentialStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  CredentialStore,
  CredentialStoreError,
  createCredentialStore,
  getCredentialStore,
  resetDefaultStore,
} from './credentialStore'
import type { XtreamSource, M3USource } from '../types/source'

// Mock secure-ls
vi.mock('secure-ls', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const store: Record<string, unknown> = {}
      return {
        set: vi.fn((key: string, value: unknown) => {
          store[key] = value
        }),
        get: vi.fn((key: string) => store[key]),
        remove: vi.fn((key: string) => {
          delete store[key]
        }),
        getAllKeys: vi.fn(() => Object.keys(store)),
        clear: vi.fn(() => {
          Object.keys(store).forEach(key => delete store[key])
        }),
      }
    }),
  }
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'TestBrowser/1.0',
    language: 'en-US',
    hardwareConcurrency: 4,
  },
  writable: true,
})

// Mock screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
  writable: true,
})

describe('CredentialStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    resetDefaultStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetDefaultStore()
  })

  const createXtreamSource = (id: string): XtreamSource => ({
    id,
    name: `Test Xtream ${id}`,
    type: 'xtream',
    serverUrl: 'http://example.com:8080',
    username: 'testuser',
    password: 'testpass',
    createdAt: Date.now(),
  })

  const createM3USource = (id: string): M3USource => ({
    id,
    name: `Test M3U ${id}`,
    type: 'm3u',
    playlistUrl: 'http://example.com/playlist.m3u',
    epgUrl: 'http://example.com/epg.xml',
    createdAt: Date.now(),
  })

  describe('constructor', () => {
    it('should create a CredentialStore instance', () => {
      const store = new CredentialStore()
      expect(store).toBeInstanceOf(CredentialStore)
    })

    it('should accept custom options', () => {
      const store = new CredentialStore({
        encryptionKey: 'custom_key',
        useCompression: false,
        namespace: 'test',
      })
      expect(store).toBeInstanceOf(CredentialStore)
    })

    it('should throw if localStorage is unavailable', () => {
      const originalLocalStorage = global.localStorage
      // Make localStorage throw an error when accessed
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => { throw new Error('localStorage unavailable') },
          getItem: () => { throw new Error('localStorage unavailable') },
          removeItem: () => { throw new Error('localStorage unavailable') },
        },
        writable: true,
        configurable: true,
      })

      expect(() => new CredentialStore()).toThrow(CredentialStoreError)

      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('addSource', () => {
    it('should add an Xtream source', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('xtream-1')

      store.addSource(source)

      const retrieved = store.getSource('xtream-1')
      expect(retrieved).toEqual(source)
    })

    it('should add an M3U source', () => {
      const store = new CredentialStore()
      const source = createM3USource('m3u-1')

      store.addSource(source)

      const retrieved = store.getSource('m3u-1')
      expect(retrieved).toEqual(source)
    })

    it('should throw when adding duplicate ID', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('dup-1')

      store.addSource(source)

      expect(() => store.addSource(source)).toThrow(CredentialStoreError)
      expect(() => store.addSource(source)).toThrow(/already exists/)
    })
  })

  describe('getAllSources', () => {
    it('should return empty array when no sources', () => {
      const store = new CredentialStore()
      expect(store.getAllSources()).toEqual([])
    })

    it('should return all stored sources', () => {
      const store = new CredentialStore()
      const source1 = createXtreamSource('source-1')
      const source2 = createM3USource('source-2')

      store.addSource(source1)
      store.addSource(source2)

      const sources = store.getAllSources()
      expect(sources).toHaveLength(2)
      expect(sources).toContainEqual(source1)
      expect(sources).toContainEqual(source2)
    })
  })

  describe('getSource', () => {
    it('should return null for non-existent source', () => {
      const store = new CredentialStore()
      expect(store.getSource('non-existent')).toBeNull()
    })

    it('should return the correct source by ID', () => {
      const store = new CredentialStore()
      const source1 = createXtreamSource('src-1')
      const source2 = createXtreamSource('src-2')

      store.addSource(source1)
      store.addSource(source2)

      expect(store.getSource('src-1')).toEqual(source1)
      expect(store.getSource('src-2')).toEqual(source2)
    })
  })

  describe('updateSource', () => {
    it('should update source properties', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('update-test')
      store.addSource(source)

      const updated = store.updateSource('update-test', {
        name: 'Updated Name',
      })

      expect(updated.name).toBe('Updated Name')
      expect(store.getSource('update-test')?.name).toBe('Updated Name')
    })

    it('should preserve unchanged properties', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('preserve-test')
      store.addSource(source)

      store.updateSource('preserve-test', { name: 'New Name' })

      const retrieved = store.getSource('preserve-test') as XtreamSource
      expect(retrieved.serverUrl).toBe(source.serverUrl)
      expect(retrieved.username).toBe(source.username)
    })

    it('should throw for non-existent source', () => {
      const store = new CredentialStore()

      expect(() => store.updateSource('non-existent', { name: 'Test' }))
        .toThrow(CredentialStoreError)
    })
  })

  describe('removeSource', () => {
    it('should remove an existing source', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('to-remove')
      store.addSource(source)

      const result = store.removeSource('to-remove')

      expect(result).toBe(true)
      expect(store.getSource('to-remove')).toBeNull()
    })

    it('should return false for non-existent source', () => {
      const store = new CredentialStore()
      expect(store.removeSource('non-existent')).toBe(false)
    })

    it('should clear active source when removed', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('active-remove')
      store.addSource(source)
      store.setActiveSource('active-remove')

      store.removeSource('active-remove')

      expect(store.getActiveSourceId()).toBeNull()
    })
  })

  describe('active source', () => {
    it('should set and get active source', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('active-test')
      store.addSource(source)

      store.setActiveSource('active-test')

      expect(store.getActiveSourceId()).toBe('active-test')
      const activeSource = store.getActiveSource()
      expect(activeSource?.id).toBe(source.id)
      expect(activeSource?.name).toBe(source.name)
      expect(activeSource?.type).toBe(source.type)
    })

    it('should return null when no active source', () => {
      const store = new CredentialStore()
      expect(store.getActiveSourceId()).toBeNull()
      expect(store.getActiveSource()).toBeNull()
    })

    it('should throw when setting non-existent source as active', () => {
      const store = new CredentialStore()

      expect(() => store.setActiveSource('non-existent'))
        .toThrow(CredentialStoreError)
    })

    it('should clear active source', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('clear-active')
      store.addSource(source)
      store.setActiveSource('clear-active')

      store.clearActiveSource()

      expect(store.getActiveSourceId()).toBeNull()
    })

    it('should update lastUsedAt when setting active', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('last-used')
      store.addSource(source)

      const beforeTime = Date.now()
      store.setActiveSource('last-used')
      const afterTime = Date.now()

      const retrieved = store.getSource('last-used')
      expect(retrieved?.lastUsedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(retrieved?.lastUsedAt).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('hasSource', () => {
    it('should return true for existing source', () => {
      const store = new CredentialStore()
      store.addSource(createXtreamSource('exists'))
      expect(store.hasSource('exists')).toBe(true)
    })

    it('should return false for non-existent source', () => {
      const store = new CredentialStore()
      expect(store.hasSource('not-exists')).toBe(false)
    })
  })

  describe('getSourceCount', () => {
    it('should return 0 for empty store', () => {
      const store = new CredentialStore()
      expect(store.getSourceCount()).toBe(0)
    })

    it('should return correct count', () => {
      const store = new CredentialStore()
      store.addSource(createXtreamSource('count-1'))
      store.addSource(createM3USource('count-2'))
      store.addSource(createXtreamSource('count-3'))
      expect(store.getSourceCount()).toBe(3)
    })
  })

  describe('getXtreamSources', () => {
    it('should return only Xtream sources', () => {
      const store = new CredentialStore()
      const xtream1 = createXtreamSource('xt-1')
      const xtream2 = createXtreamSource('xt-2')
      const m3u = createM3USource('m3u-1')

      store.addSource(xtream1)
      store.addSource(xtream2)
      store.addSource(m3u)

      const xtreamSources = store.getXtreamSources()
      expect(xtreamSources).toHaveLength(2)
      expect(xtreamSources.every(s => s.type === 'xtream')).toBe(true)
    })
  })

  describe('getM3USources', () => {
    it('should return only M3U sources', () => {
      const store = new CredentialStore()
      const xtream = createXtreamSource('xt-1')
      const m3u1 = createM3USource('m3u-1')
      const m3u2 = createM3USource('m3u-2')

      store.addSource(xtream)
      store.addSource(m3u1)
      store.addSource(m3u2)

      const m3uSources = store.getM3USources()
      expect(m3uSources).toHaveLength(2)
      expect(m3uSources.every(s => s.type === 'm3u')).toBe(true)
    })
  })

  describe('clearAll', () => {
    it('should remove all sources and active source', () => {
      const store = new CredentialStore()
      store.addSource(createXtreamSource('clear-1'))
      store.addSource(createM3USource('clear-2'))
      store.setActiveSource('clear-1')

      store.clearAll()

      expect(store.getAllSources()).toHaveLength(0)
      expect(store.getActiveSourceId()).toBeNull()
    })
  })

  describe('export/import', () => {
    it('should export sources as JSON', () => {
      const store = new CredentialStore()
      const source = createXtreamSource('export-1')
      store.addSource(source)

      const exported = store.exportSources()
      const parsed = JSON.parse(exported)

      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.sources).toHaveLength(1)
      expect(parsed.sources[0].id).toBe('export-1')
    })

    it('should import sources from JSON', () => {
      const store = new CredentialStore()
      const exportData = JSON.stringify({
        version: 1,
        sources: [createXtreamSource('import-1'), createM3USource('import-2')],
      })

      const count = store.importSources(exportData)

      expect(count).toBe(2)
      expect(store.getSourceCount()).toBe(2)
    })

    it('should skip existing sources during import', () => {
      const store = new CredentialStore()
      store.addSource(createXtreamSource('existing'))

      const exportData = JSON.stringify({
        version: 1,
        sources: [
          createXtreamSource('existing'),
          createM3USource('new-one'),
        ],
      })

      const count = store.importSources(exportData)

      expect(count).toBe(1)
      expect(store.getSourceCount()).toBe(2)
    })

    it('should overwrite when specified', () => {
      const store = new CredentialStore()
      store.addSource(createXtreamSource('old-1'))
      store.addSource(createM3USource('old-2'))

      const exportData = JSON.stringify({
        version: 1,
        sources: [createXtreamSource('new-1')],
      })

      store.importSources(exportData, true)

      expect(store.getSourceCount()).toBe(1)
      expect(store.hasSource('new-1')).toBe(true)
      expect(store.hasSource('old-1')).toBe(false)
    })

    it('should throw for invalid JSON', () => {
      const store = new CredentialStore()

      expect(() => store.importSources('invalid json'))
        .toThrow(CredentialStoreError)
    })

    it('should throw for invalid backup format', () => {
      const store = new CredentialStore()

      expect(() => store.importSources(JSON.stringify({ foo: 'bar' })))
        .toThrow(CredentialStoreError)
    })
  })

  describe('createCredentialStore', () => {
    it('should create a new store instance', () => {
      const store = createCredentialStore()
      expect(store).toBeInstanceOf(CredentialStore)
    })

    it('should accept options', () => {
      const store = createCredentialStore({ namespace: 'test' })
      expect(store).toBeInstanceOf(CredentialStore)
    })
  })

  describe('getCredentialStore', () => {
    it('should return singleton instance', () => {
      const store1 = getCredentialStore()
      const store2 = getCredentialStore()
      expect(store1).toBe(store2)
    })

    it('should return new instance after reset', () => {
      const store1 = getCredentialStore()
      resetDefaultStore()
      const store2 = getCredentialStore()
      expect(store1).not.toBe(store2)
    })
  })

  describe('CredentialStoreError', () => {
    it('should have correct properties', () => {
      const error = new CredentialStoreError('Test error', 'STORAGE_UNAVAILABLE')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('STORAGE_UNAVAILABLE')
      expect(error.name).toBe('CredentialStoreError')
    })
  })

  describe('namespace isolation', () => {
    it('should isolate data between namespaces', () => {
      const store1 = new CredentialStore({ namespace: 'ns1' })
      const store2 = new CredentialStore({ namespace: 'ns2' })

      store1.addSource(createXtreamSource('ns1-source'))
      store2.addSource(createM3USource('ns2-source'))

      expect(store1.getSourceCount()).toBe(1)
      expect(store2.getSourceCount()).toBe(1)
      expect(store1.hasSource('ns2-source')).toBe(false)
      expect(store2.hasSource('ns1-source')).toBe(false)
    })
  })
})
