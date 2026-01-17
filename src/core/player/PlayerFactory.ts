/**
 * Player Factory with capability-based selection
 *
 * Automatically selects the appropriate player adapter based on:
 * - Browser capabilities (MSE, EME support)
 * - Stream type (HLS, DASH, MP4)
 * - Device constraints (VIDAA TV compatibility)
 */

import type { PlayerAdapter, PlayerConfig, StreamType } from '../types/player'
import { NativePlayerAdapter } from './NativePlayerAdapter'
import { detectCapabilities, detectNativeHLSSupport, recommendPlayerStrategy } from './capabilityDetector'

/**
 * Player type enum for explicit player selection
 */
export type PlayerType = 'shaka' | 'native' | 'auto'

/**
 * Options for creating a player
 */
export interface CreatePlayerOptions {
  /** Explicit player type selection (default: 'auto') */
  playerType?: PlayerType
  /** Player configuration */
  config?: PlayerConfig
  /** Stream URL to determine best player (optional) */
  streamUrl?: string
}

/**
 * Result of player creation
 */
export interface CreatePlayerResult {
  /** The created player adapter */
  player: PlayerAdapter
  /** The type of player that was created */
  type: 'shaka' | 'native'
  /** Capabilities detected for this browser/device */
  capabilities: ReturnType<typeof detectCapabilities>
}

/**
 * Detect stream type from URL
 */
function detectStreamType(url: string): StreamType {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
    return 'hls'
  }
  if (lowerUrl.includes('.mpd') || lowerUrl.includes('/dash/')) {
    return 'dash'
  }
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.m4v')) {
    return 'mp4'
  }
  return 'unknown'
}

/**
 * Determine if Shaka Player should be used for a given stream
 */
function shouldUseShakaPlayer(
  streamType: StreamType,
  capabilities: ReturnType<typeof detectCapabilities>
): boolean {
  // DASH always requires MSE (Shaka)
  if (streamType === 'dash') {
    return capabilities.mse && capabilities.dash
  }

  // HLS: prefer native on Safari, Shaka elsewhere
  if (streamType === 'hls') {
    // If native HLS is supported (Safari, iOS), use native player
    if (detectNativeHLSSupport()) {
      return false
    }
    // Otherwise use Shaka if MSE is available
    return capabilities.mse && capabilities.hls
  }

  // Direct streams (MP4): use native player
  if (streamType === 'mp4') {
    return false
  }

  // Unknown stream type: try Shaka if MSE available, otherwise native
  return capabilities.mse
}

/**
 * Lazily load and create Shaka Player adapter
 */
async function createShakaPlayer(): Promise<PlayerAdapter> {
  // Dynamic import to reduce initial bundle size
  const { ShakaPlayerAdapter, isShakaSupported } = await import('./ShakaPlayerAdapter')

  // Verify Shaka is supported
  const supported = await isShakaSupported()
  if (!supported) {
    throw new Error('Shaka Player is not supported on this browser')
  }

  return new ShakaPlayerAdapter()
}

/**
 * Create a Native player adapter
 */
function createNativePlayer(): PlayerAdapter {
  return new NativePlayerAdapter()
}

/**
 * Create an appropriate player based on capabilities and stream type
 *
 * @param options - Player creation options
 * @returns Promise resolving to the created player and metadata
 *
 * @example
 * // Auto-select based on stream URL
 * const { player, type } = await createPlayer({
 *   streamUrl: 'https://example.com/stream.m3u8'
 * })
 *
 * @example
 * // Force native player
 * const { player } = await createPlayer({ playerType: 'native' })
 *
 * @example
 * // Force Shaka player with config
 * const { player } = await createPlayer({
 *   playerType: 'shaka',
 *   config: { bufferSize: 60 }
 * })
 */
export async function createPlayer(options: CreatePlayerOptions = {}): Promise<CreatePlayerResult> {
  const { playerType = 'auto', streamUrl } = options
  const capabilities = detectCapabilities()

  let type: 'shaka' | 'native'
  let player: PlayerAdapter

  if (playerType === 'native') {
    // Forced native player
    type = 'native'
    player = createNativePlayer()
  } else if (playerType === 'shaka') {
    // Forced Shaka player
    if (!capabilities.mse) {
      throw new Error('Shaka Player requires MSE support which is not available')
    }
    type = 'shaka'
    player = await createShakaPlayer()
  } else {
    // Auto-select based on capabilities and stream type
    const streamType = streamUrl ? detectStreamType(streamUrl) : 'unknown'
    const useShaka = shouldUseShakaPlayer(streamType, capabilities)

    if (useShaka) {
      try {
        type = 'shaka'
        player = await createShakaPlayer()
      } catch {
        // Fall back to native if Shaka fails to load
        type = 'native'
        player = createNativePlayer()
      }
    } else {
      type = 'native'
      player = createNativePlayer()
    }
  }

  return {
    player,
    type,
    capabilities,
  }
}

/**
 * Get the recommended player type without creating a player
 *
 * Useful for UI to show which player will be used
 */
export function getRecommendedPlayerType(streamUrl?: string): 'shaka' | 'native' | 'unsupported' {
  const recommendation = recommendPlayerStrategy()

  if (recommendation === 'unsupported') {
    return 'unsupported'
  }

  if (!streamUrl) {
    return recommendation
  }

  const capabilities = detectCapabilities()
  const streamType = detectStreamType(streamUrl)

  if (shouldUseShakaPlayer(streamType, capabilities)) {
    return 'shaka'
  }

  return 'native'
}

/**
 * Check if a specific player type is supported
 */
export function isPlayerTypeSupported(playerType: PlayerType): boolean {
  const capabilities = detectCapabilities()

  switch (playerType) {
    case 'shaka':
      return capabilities.mse
    case 'native':
      return capabilities.nativeVideo
    case 'auto':
      return capabilities.nativeVideo || capabilities.mse
  }
}

/**
 * Get a summary of player support for the current browser
 */
export function getPlayerSupportSummary(): {
  shaka: boolean
  native: boolean
  recommended: 'shaka' | 'native' | 'unsupported'
  capabilities: ReturnType<typeof detectCapabilities>
} {
  const capabilities = detectCapabilities()
  const recommended = recommendPlayerStrategy()

  return {
    shaka: capabilities.mse,
    native: capabilities.nativeVideo,
    recommended,
    capabilities,
  }
}
