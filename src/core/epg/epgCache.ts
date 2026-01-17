/**
 * EPG Cache with time-based invalidation
 * Caches EPG data per source with configurable TTL
 */

import type { EPGData, Program } from '../types/channel'

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  data: EPGData
  fetchedAt: number
  expiresAt: number
}

/**
 * Cache configuration options
 */
export interface EPGCacheOptions {
  /** Time-to-live in milliseconds (default: 1 hour) */
  ttl?: number
  /** Maximum number of sources to cache (default: 10) */
  maxSources?: number
  /** Storage key prefix for persistence */
  storageKey?: string
}

const DEFAULT_TTL = 60 * 60 * 1000 // 1 hour
const DEFAULT_MAX_SOURCES = 10
const DEFAULT_STORAGE_KEY = 'ted_epg_cache'

/**
 * EPG Cache implementation with time-based invalidation
 */
export class EPGCache {
  private cache: Map<string, CacheEntry> = new Map()
  private ttl: number
  private maxSources: number
  private storageKey: string

  constructor(options: EPGCacheOptions = {}) {
    this.ttl = options.ttl ?? DEFAULT_TTL
    this.maxSources = options.maxSources ?? DEFAULT_MAX_SOURCES
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY

    // Load from persistent storage if available
    this.loadFromStorage()
  }

  /**
   * Get cached EPG data for a source
   * Returns null if not cached or expired
   */
  get(sourceId: string): EPGData | null {
    const entry = this.cache.get(sourceId)

    if (!entry) {
      return null
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(sourceId)
      this.saveToStorage()
      return null
    }

    return entry.data
  }

  /**
   * Set EPG data in cache for a source
   */
  set(sourceId: string, data: EPGData): void {
    const now = Date.now()

    // Enforce max sources limit (LRU eviction)
    if (this.cache.size >= this.maxSources && !this.cache.has(sourceId)) {
      this.evictOldest()
    }

    const entry: CacheEntry = {
      data,
      fetchedAt: now,
      expiresAt: now + this.ttl,
    }

    this.cache.set(sourceId, entry)
    this.saveToStorage()
  }

  /**
   * Check if cache has valid (non-expired) data for a source
   */
  has(sourceId: string): boolean {
    const entry = this.cache.get(sourceId)
    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.cache.delete(sourceId)
      this.saveToStorage()
      return false
    }

    return true
  }

  /**
   * Invalidate cache for a specific source
   */
  invalidate(sourceId: string): void {
    this.cache.delete(sourceId)
    this.saveToStorage()
  }

  /**
   * Invalidate all cached data
   */
  invalidateAll(): void {
    this.cache.clear()
    this.saveToStorage()
  }

  /**
   * Get programs for a specific channel from cache
   */
  getChannelPrograms(sourceId: string, channelId: string): Program[] | null {
    const data = this.get(sourceId)
    if (!data) {
      return null
    }

    return data.programs[channelId] ?? null
  }

  /**
   * Get current program for a channel
   */
  getCurrentProgram(sourceId: string, channelId: string): Program | null {
    const programs = this.getChannelPrograms(sourceId, channelId)
    if (!programs) {
      return null
    }

    const now = Date.now()
    return (
      programs.find((p) => {
        const start = this.toTimestamp(p.startTime)
        const end = this.toTimestamp(p.endTime)
        return start <= now && end > now
      }) ?? null
    )
  }

  /**
   * Get next program for a channel
   */
  getNextProgram(sourceId: string, channelId: string): Program | null {
    const programs = this.getChannelPrograms(sourceId, channelId)
    if (!programs) {
      return null
    }

    const now = Date.now()
    return (
      programs.find((p) => {
        const start = this.toTimestamp(p.startTime)
        return start > now
      }) ?? null
    )
  }

  /**
   * Get programs within a time range for a channel
   */
  getProgramsInRange(
    sourceId: string,
    channelId: string,
    startTime: number,
    endTime: number
  ): Program[] {
    const programs = this.getChannelPrograms(sourceId, channelId)
    if (!programs) {
      return []
    }

    return programs.filter((p) => {
      const pStart = this.toTimestamp(p.startTime)
      const pEnd = this.toTimestamp(p.endTime)
      // Program overlaps with the time range
      return pStart < endTime && pEnd > startTime
    })
  }

  /**
   * Get time until cache expires for a source
   * Returns 0 if not cached or already expired
   */
  getTimeToExpiry(sourceId: string): number {
    const entry = this.cache.get(sourceId)
    if (!entry) {
      return 0
    }

    const remaining = entry.expiresAt - Date.now()
    return remaining > 0 ? remaining : 0
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    sourceCount: number
    maxSources: number
    ttl: number
    sources: Array<{
      sourceId: string
      fetchedAt: number
      expiresAt: number
      channelCount: number
      programCount: number
    }>
  } {
    const sources = Array.from(this.cache.entries())
      .filter(([, entry]) => !this.isExpired(entry))
      .map(([sourceId, entry]) => {
        const channelIds = Object.keys(entry.data.programs)
        const programCount = channelIds.reduce(
          (sum, chId) => sum + (entry.data.programs[chId]?.length ?? 0),
          0
        )

        return {
          sourceId,
          fetchedAt: entry.fetchedAt,
          expiresAt: entry.expiresAt,
          channelCount: channelIds.length,
          programCount,
        }
      })

    return {
      sourceCount: sources.length,
      maxSources: this.maxSources,
      ttl: this.ttl,
      sources,
    }
  }

  /**
   * Update TTL setting (does not affect existing cache entries)
   */
  setTTL(ttl: number): void {
    this.ttl = ttl
  }

  /**
   * Get current TTL setting
   */
  getTTL(): number {
    return this.ttl
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() >= entry.expiresAt
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.fetchedAt < oldestTime) {
        oldestTime = entry.fetchedAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private toTimestamp(time: string | number): number {
    if (typeof time === 'number') {
      return time
    }
    return new Date(time).getTime()
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return
      }

      const data = JSON.parse(stored) as Record<string, CacheEntry>
      const now = Date.now()

      // Only load non-expired entries
      for (const [sourceId, entry] of Object.entries(data)) {
        if (entry.expiresAt > now) {
          this.cache.set(sourceId, entry)
        }
      }
    } catch {
      // Ignore storage errors, start with empty cache
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const data: Record<string, CacheEntry> = {}
      for (const [sourceId, entry] of this.cache.entries()) {
        // Only persist non-expired entries
        if (!this.isExpired(entry)) {
          data[sourceId] = entry
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }
}

/**
 * Default singleton cache instance
 */
let defaultCache: EPGCache | null = null

/**
 * Get the default EPG cache instance
 */
export function getEPGCache(options?: EPGCacheOptions): EPGCache {
  if (!defaultCache) {
    defaultCache = new EPGCache(options)
  }
  return defaultCache
}

/**
 * Reset the default cache instance (useful for testing)
 */
export function resetEPGCache(): void {
  defaultCache = null
}
