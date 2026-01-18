/**
 * EPG Time Sync Utility
 * Provides accurate time synchronization for EPG program times
 *
 * This utility handles:
 * - Detecting clock drift between device time and server time
 * - Adjusting program times for accurate "now playing" detection
 * - Caching time offset for performance
 */

/**
 * Time sync configuration options
 */
export interface TimeSyncOptions {
  /** URL to fetch server time from (defaults to worldtimeapi.org) */
  timeServerUrl?: string
  /** How often to resync time in milliseconds (default: 1 hour) */
  resyncInterval?: number
  /** Maximum acceptable clock drift in milliseconds before warning (default: 5 minutes) */
  maxDriftWarning?: number
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number
}

/**
 * Time sync state
 */
export interface TimeSyncState {
  /** Offset in milliseconds between local time and server time (server - local) */
  offset: number
  /** When the offset was last calculated */
  lastSync: number
  /** Whether sync has been performed at least once */
  isSynced: boolean
  /** Last error message if sync failed */
  lastError?: string
}

/**
 * Result of a time sync operation
 */
export interface TimeSyncResult {
  success: boolean
  offset?: number
  error?: string
  serverTime?: number
  localTime?: number
}

const DEFAULT_OPTIONS: Required<TimeSyncOptions> = {
  timeServerUrl: 'https://worldtimeapi.org/api/ip',
  resyncInterval: 60 * 60 * 1000, // 1 hour
  maxDriftWarning: 5 * 60 * 1000, // 5 minutes
  timeout: 5000,
}

/**
 * EPG Time Sync class
 * Manages time synchronization between client and server
 */
export class EPGTimeSync {
  private state: TimeSyncState = {
    offset: 0,
    lastSync: 0,
    isSynced: false,
  }

  private options: Required<TimeSyncOptions>
  private syncPromise: Promise<TimeSyncResult> | null = null

  constructor(options: TimeSyncOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Get the current time offset in milliseconds
   */
  getOffset(): number {
    return this.state.offset
  }

  /**
   * Check if time has been synced at least once
   */
  isSynced(): boolean {
    return this.state.isSynced
  }

  /**
   * Get the current sync state
   */
  getState(): Readonly<TimeSyncState> {
    return { ...this.state }
  }

  /**
   * Get the corrected current time accounting for clock drift
   */
  getCorrectedTime(): Date {
    return new Date(Date.now() + this.state.offset)
  }

  /**
   * Get the corrected timestamp in milliseconds
   */
  getCorrectedTimestamp(): number {
    return Date.now() + this.state.offset
  }

  /**
   * Convert a local timestamp to server-corrected timestamp
   */
  localToServer(localTimestamp: number): number {
    return localTimestamp + this.state.offset
  }

  /**
   * Convert a server timestamp to local timestamp
   */
  serverToLocal(serverTimestamp: number): number {
    return serverTimestamp - this.state.offset
  }

  /**
   * Check if a resync is needed based on the interval
   */
  needsResync(): boolean {
    if (!this.state.isSynced) return true
    const elapsed = Date.now() - this.state.lastSync
    return elapsed >= this.options.resyncInterval
  }

  /**
   * Perform time synchronization with the server
   * Returns a cached promise if sync is already in progress
   */
  async sync(): Promise<TimeSyncResult> {
    // Return existing promise if sync is in progress
    if (this.syncPromise) {
      return this.syncPromise
    }

    this.syncPromise = this.performSync()

    try {
      return await this.syncPromise
    } finally {
      this.syncPromise = null
    }
  }

  /**
   * Internal sync implementation
   */
  private async performSync(): Promise<TimeSyncResult> {
    const localTimeBeforeRequest = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.options.timeout
      )

      const response = await fetch(this.options.timeServerUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const localTimeAfterRequest = Date.now()

      // Calculate server time from response
      const serverTime = this.parseServerTime(data)
      if (serverTime === null) {
        throw new Error('Could not parse server time from response')
      }

      // Estimate network latency and calculate offset
      // Assume request took half the round-trip time
      const roundTripTime = localTimeAfterRequest - localTimeBeforeRequest
      const estimatedLocalTimeAtServer =
        localTimeBeforeRequest + roundTripTime / 2

      const offset = serverTime - estimatedLocalTimeAtServer

      this.state = {
        offset,
        lastSync: Date.now(),
        isSynced: true,
        lastError: undefined,
      }

      return {
        success: true,
        offset,
        serverTime,
        localTime: estimatedLocalTimeAtServer,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      this.state = {
        ...this.state,
        lastError: errorMessage,
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Parse server time from various API response formats
   */
  private parseServerTime(data: unknown): number | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    const record = data as Record<string, unknown>

    // worldtimeapi.org format
    if ('unixtime' in record && typeof record.unixtime === 'number') {
      return record.unixtime * 1000
    }

    // ISO 8601 datetime string
    if ('datetime' in record && typeof record.datetime === 'string') {
      const parsed = Date.parse(record.datetime)
      if (!isNaN(parsed)) {
        return parsed
      }
    }

    // UTC datetime string
    if ('utc_datetime' in record && typeof record.utc_datetime === 'string') {
      const parsed = Date.parse(record.utc_datetime)
      if (!isNaN(parsed)) {
        return parsed
      }
    }

    // Generic time field
    if ('time' in record) {
      if (typeof record.time === 'number') {
        // Assume Unix timestamp in seconds if small enough
        return record.time > 1e12 ? record.time : record.time * 1000
      }
      if (typeof record.time === 'string') {
        const parsed = Date.parse(record.time)
        if (!isNaN(parsed)) {
          return parsed
        }
      }
    }

    // timestamp field
    if ('timestamp' in record) {
      if (typeof record.timestamp === 'number') {
        return record.timestamp > 1e12
          ? record.timestamp
          : record.timestamp * 1000
      }
    }

    return null
  }

  /**
   * Check if the current clock drift exceeds the warning threshold
   */
  hasDriftWarning(): boolean {
    return Math.abs(this.state.offset) > this.options.maxDriftWarning
  }

  /**
   * Get a human-readable description of the clock drift
   */
  getDriftDescription(): string {
    const offset = this.state.offset
    if (Math.abs(offset) < 1000) {
      return 'Time is synchronized'
    }

    const absOffset = Math.abs(offset)
    const direction = offset > 0 ? 'behind' : 'ahead'

    if (absOffset < 60000) {
      const seconds = Math.round(absOffset / 1000)
      return `Device clock is ${seconds} second${seconds !== 1 ? 's' : ''} ${direction}`
    }

    const minutes = Math.round(absOffset / 60000)
    return `Device clock is ${minutes} minute${minutes !== 1 ? 's' : ''} ${direction}`
  }

  /**
   * Reset the sync state
   */
  reset(): void {
    this.state = {
      offset: 0,
      lastSync: 0,
      isSynced: false,
    }
    this.syncPromise = null
  }

  /**
   * Set offset manually (useful for testing or when server time is known)
   */
  setOffset(offset: number): void {
    this.state = {
      offset,
      lastSync: Date.now(),
      isSynced: true,
      lastError: undefined,
    }
  }
}

// Singleton instance for global use
let globalTimeSync: EPGTimeSync | null = null

/**
 * Get the global EPGTimeSync instance
 */
export function getEPGTimeSync(options?: TimeSyncOptions): EPGTimeSync {
  if (!globalTimeSync) {
    globalTimeSync = new EPGTimeSync(options)
  }
  return globalTimeSync
}

/**
 * Reset the global EPGTimeSync instance
 */
export function resetEPGTimeSync(): void {
  globalTimeSync = null
}

/**
 * Check if a program is currently airing using time-synced time
 */
export function isProgramNowPlaying(
  program: { startTime: string | number; endTime: string | number },
  timeSync?: EPGTimeSync
): boolean {
  const sync = timeSync || getEPGTimeSync()
  const now = sync.getCorrectedTimestamp()

  const start =
    typeof program.startTime === 'string'
      ? Date.parse(program.startTime)
      : program.startTime
  const end =
    typeof program.endTime === 'string'
      ? Date.parse(program.endTime)
      : program.endTime

  return now >= start && now < end
}

/**
 * Get the progress percentage of a currently airing program
 */
export function getProgramProgress(
  program: { startTime: string | number; endTime: string | number },
  timeSync?: EPGTimeSync
): number {
  const sync = timeSync || getEPGTimeSync()
  const now = sync.getCorrectedTimestamp()

  const start =
    typeof program.startTime === 'string'
      ? Date.parse(program.startTime)
      : program.startTime
  const end =
    typeof program.endTime === 'string'
      ? Date.parse(program.endTime)
      : program.endTime

  if (now < start) return 0
  if (now >= end) return 100

  const duration = end - start
  const elapsed = now - start

  return Math.round((elapsed / duration) * 100)
}

/**
 * Get time remaining for a currently airing program in milliseconds
 */
export function getProgramTimeRemaining(
  program: { startTime: string | number; endTime: string | number },
  timeSync?: EPGTimeSync
): number {
  const sync = timeSync || getEPGTimeSync()
  const now = sync.getCorrectedTimestamp()

  const end =
    typeof program.endTime === 'string'
      ? Date.parse(program.endTime)
      : program.endTime

  return Math.max(0, end - now)
}

/**
 * Find the current program from a list of programs
 */
export function findCurrentProgram<
  T extends { startTime: string | number; endTime: string | number },
>(programs: T[], timeSync?: EPGTimeSync): T | undefined {
  return programs.find((program) => isProgramNowPlaying(program, timeSync))
}

/**
 * Find the next program from a list of programs
 */
export function findNextProgram<
  T extends { startTime: string | number; endTime: string | number },
>(programs: T[], timeSync?: EPGTimeSync): T | undefined {
  const sync = timeSync || getEPGTimeSync()
  const now = sync.getCorrectedTimestamp()

  // Sort by start time and find first program starting after now
  const sorted = [...programs].sort((a, b) => {
    const startA =
      typeof a.startTime === 'string' ? Date.parse(a.startTime) : a.startTime
    const startB =
      typeof b.startTime === 'string' ? Date.parse(b.startTime) : b.startTime
    return startA - startB
  })

  return sorted.find((program) => {
    const start =
      typeof program.startTime === 'string'
        ? Date.parse(program.startTime)
        : program.startTime
    return start > now
  })
}
