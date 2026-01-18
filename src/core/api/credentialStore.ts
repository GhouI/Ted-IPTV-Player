/**
 * CredentialStore - Encrypted localStorage for IPTV source credentials
 * Uses secure-ls for AES encryption with device-specific keys
 */

import SecureLS from 'secure-ls'
import type { Source, XtreamSource, M3USource } from '../types/source'

/**
 * Storage keys used by CredentialStore
 */
const STORAGE_KEYS = {
  SOURCES: 'ted_iptv_sources',
  ACTIVE_SOURCE: 'ted_active_source',
  ENCRYPTION_TEST: 'ted_encryption_test',
} as const

/**
 * Error thrown by CredentialStore operations
 */
export class CredentialStoreError extends Error {
  constructor(
    message: string,
    public readonly code: CredentialStoreErrorCode
  ) {
    super(message)
    this.name = 'CredentialStoreError'
  }
}

/**
 * Error codes for CredentialStore operations
 */
export type CredentialStoreErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'SOURCE_NOT_FOUND'
  | 'INVALID_DATA'
  | 'STORAGE_FULL'

/**
 * Options for creating a CredentialStore instance
 */
export interface CredentialStoreOptions {
  /** Custom encryption key (defaults to device fingerprint) */
  encryptionKey?: string
  /** Whether to use compression (default: true) */
  useCompression?: boolean
  /** Storage namespace prefix */
  namespace?: string
}

/**
 * Stored data structure for sources
 */
interface StoredSourceData {
  sources: Source[]
  version: number
}

/**
 * Current storage schema version
 */
const STORAGE_VERSION = 1

/**
 * Generate a device-specific fingerprint for encryption key
 * Uses available browser/environment properties
 */
function generateDeviceFingerprint(): string {
  const components: string[] = []

  // Use navigator properties if available
  if (typeof navigator !== 'undefined') {
    components.push(navigator.userAgent || '')
    components.push(navigator.language || '')
    components.push(String(navigator.hardwareConcurrency || ''))
  }

  // Use screen properties if available
  if (typeof screen !== 'undefined') {
    components.push(String(screen.width || ''))
    components.push(String(screen.height || ''))
    components.push(String(screen.colorDepth || ''))
  }

  // Add a static app identifier
  components.push('ted-iptv-player-v1')

  // Create a hash-like string from components
  const fingerprint = components.join('|')

  // Simple hash function for fingerprint
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `ted_${Math.abs(hash).toString(36)}_key`
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * CredentialStore - Secure storage for IPTV credentials
 *
 * Provides encrypted storage for Xtream Codes and M3U source configurations.
 * Uses AES encryption via secure-ls with device-specific keys.
 */
export class CredentialStore {
  private secureStorage: SecureLS
  private namespace: string

  constructor(options: CredentialStoreOptions = {}) {
    if (!isStorageAvailable()) {
      throw new CredentialStoreError(
        'localStorage is not available',
        'STORAGE_UNAVAILABLE'
      )
    }

    this.namespace = options.namespace || ''

    const encryptionKey = options.encryptionKey || generateDeviceFingerprint()

    this.secureStorage = new SecureLS({
      encodingType: 'aes',
      encryptionSecret: encryptionKey,
      isCompression: options.useCompression !== false,
    })

    // Test encryption/decryption on init
    this.verifyEncryption()
  }

  /**
   * Get the namespaced key
   */
  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}_${key}` : key
  }

  /**
   * Verify that encryption/decryption works correctly
   */
  private verifyEncryption(): void {
    try {
      const testKey = this.getKey(STORAGE_KEYS.ENCRYPTION_TEST)
      const testValue = { test: 'encryption_verification', timestamp: Date.now() }

      this.secureStorage.set(testKey, testValue)
      const retrieved = this.secureStorage.get(testKey)

      if (!retrieved || retrieved.test !== testValue.test) {
        throw new Error('Verification mismatch')
      }

      this.secureStorage.remove(testKey)
    } catch {
      throw new CredentialStoreError(
        'Encryption verification failed',
        'ENCRYPTION_FAILED'
      )
    }
  }

  /**
   * Get stored source data, initializing if needed
   */
  private getStoredData(): StoredSourceData {
    try {
      const key = this.getKey(STORAGE_KEYS.SOURCES)
      const data = this.secureStorage.get(key)

      if (!data) {
        return { sources: [], version: STORAGE_VERSION }
      }

      // Validate data structure
      if (!Array.isArray(data.sources)) {
        return { sources: [], version: STORAGE_VERSION }
      }

      return data as StoredSourceData
    } catch {
      // If decryption fails, return empty data
      // This can happen if encryption key changed
      console.warn('Failed to decrypt stored sources, returning empty data')
      return { sources: [], version: STORAGE_VERSION }
    }
  }

  /**
   * Save source data to storage
   */
  private saveStoredData(data: StoredSourceData): void {
    try {
      const key = this.getKey(STORAGE_KEYS.SOURCES)
      this.secureStorage.set(key, data)
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        throw new CredentialStoreError(
          'Storage quota exceeded',
          'STORAGE_FULL'
        )
      }
      throw new CredentialStoreError(
        'Failed to save data',
        'ENCRYPTION_FAILED'
      )
    }
  }

  /**
   * Get all stored sources
   */
  getAllSources(): Source[] {
    const data = this.getStoredData()
    return data.sources
  }

  /**
   * Get a source by ID
   */
  getSource(id: string): Source | null {
    const sources = this.getAllSources()
    return sources.find(s => s.id === id) || null
  }

  /**
   * Add a new source
   */
  addSource(source: Source): void {
    const data = this.getStoredData()

    // Check for duplicate ID
    if (data.sources.some(s => s.id === source.id)) {
      throw new CredentialStoreError(
        `Source with ID ${source.id} already exists`,
        'INVALID_DATA'
      )
    }

    data.sources.push(source)
    this.saveStoredData(data)
  }

  /**
   * Update an existing source
   */
  updateSource(id: string, updates: Partial<Omit<Source, 'id' | 'type'>>): Source {
    const data = this.getStoredData()
    const index = data.sources.findIndex(s => s.id === id)

    if (index === -1) {
      throw new CredentialStoreError(
        `Source with ID ${id} not found`,
        'SOURCE_NOT_FOUND'
      )
    }

    const existingSource = data.sources[index]
    const updatedSource = { ...existingSource, ...updates } as Source
    data.sources[index] = updatedSource

    this.saveStoredData(data)
    return updatedSource
  }

  /**
   * Remove a source by ID
   */
  removeSource(id: string): boolean {
    const data = this.getStoredData()
    const initialLength = data.sources.length
    data.sources = data.sources.filter(s => s.id !== id)

    if (data.sources.length === initialLength) {
      return false
    }

    this.saveStoredData(data)

    // Clear active source if it was removed
    const activeId = this.getActiveSourceId()
    if (activeId === id) {
      this.clearActiveSource()
    }

    return true
  }

  /**
   * Get the currently active source ID
   */
  getActiveSourceId(): string | null {
    try {
      const key = this.getKey(STORAGE_KEYS.ACTIVE_SOURCE)
      return this.secureStorage.get(key) || null
    } catch {
      return null
    }
  }

  /**
   * Get the currently active source
   */
  getActiveSource(): Source | null {
    const activeId = this.getActiveSourceId()
    if (!activeId) {
      return null
    }
    return this.getSource(activeId)
  }

  /**
   * Set the active source by ID
   */
  setActiveSource(id: string): void {
    const source = this.getSource(id)
    if (!source) {
      throw new CredentialStoreError(
        `Source with ID ${id} not found`,
        'SOURCE_NOT_FOUND'
      )
    }

    const key = this.getKey(STORAGE_KEYS.ACTIVE_SOURCE)
    this.secureStorage.set(key, id)

    // Update lastUsedAt
    this.updateSource(id, { lastUsedAt: Date.now() })
  }

  /**
   * Clear the active source
   */
  clearActiveSource(): void {
    const key = this.getKey(STORAGE_KEYS.ACTIVE_SOURCE)
    this.secureStorage.remove(key)
  }

  /**
   * Check if a source exists
   */
  hasSource(id: string): boolean {
    return this.getSource(id) !== null
  }

  /**
   * Get the count of stored sources
   */
  getSourceCount(): number {
    return this.getAllSources().length
  }

  /**
   * Get all Xtream sources
   */
  getXtreamSources(): XtreamSource[] {
    return this.getAllSources().filter(
      (s): s is XtreamSource => s.type === 'xtream'
    )
  }

  /**
   * Get all M3U sources
   */
  getM3USources(): M3USource[] {
    return this.getAllSources().filter(
      (s): s is M3USource => s.type === 'm3u'
    )
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    const sourcesKey = this.getKey(STORAGE_KEYS.SOURCES)
    const activeKey = this.getKey(STORAGE_KEYS.ACTIVE_SOURCE)

    this.secureStorage.remove(sourcesKey)
    this.secureStorage.remove(activeKey)
  }

  /**
   * Export all sources as unencrypted JSON (for backup)
   */
  exportSources(): string {
    const sources = this.getAllSources()
    return JSON.stringify({
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      sources,
    }, null, 2)
  }

  /**
   * Import sources from JSON backup
   */
  importSources(json: string, overwrite = false): number {
    let imported: { version?: number; sources?: Source[] }

    try {
      imported = JSON.parse(json)
    } catch {
      throw new CredentialStoreError(
        'Invalid JSON format',
        'INVALID_DATA'
      )
    }

    if (!imported.sources || !Array.isArray(imported.sources)) {
      throw new CredentialStoreError(
        'Invalid backup format: missing sources array',
        'INVALID_DATA'
      )
    }

    // Validate each source
    for (const source of imported.sources) {
      if (!source.id || !source.type || !source.name) {
        throw new CredentialStoreError(
          'Invalid source data in backup',
          'INVALID_DATA'
        )
      }
    }

    if (overwrite) {
      this.clearAll()
    }

    let addedCount = 0
    for (const source of imported.sources) {
      if (!this.hasSource(source.id)) {
        this.addSource(source)
        addedCount++
      }
    }

    return addedCount
  }
}

/**
 * Create a CredentialStore instance with default options
 */
export function createCredentialStore(options?: CredentialStoreOptions): CredentialStore {
  return new CredentialStore(options)
}

/**
 * Singleton instance for app-wide usage
 */
let defaultStore: CredentialStore | null = null

/**
 * Get the default CredentialStore instance
 * Creates one if it doesn't exist
 */
export function getCredentialStore(): CredentialStore {
  if (!defaultStore) {
    defaultStore = createCredentialStore()
  }
  return defaultStore
}

/**
 * Reset the default store (mainly for testing)
 */
export function resetDefaultStore(): void {
  defaultStore = null
}
