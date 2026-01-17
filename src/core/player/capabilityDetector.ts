/**
 * MSE/EME capability detection utility
 * Detects browser support for Media Source Extensions, Encrypted Media Extensions,
 * and various video/audio codecs for VIDAA TV compatibility
 */

import type { PlayerCapabilities } from '../types/player'

/**
 * Common video codecs to test for support
 */
const VIDEO_CODECS = [
  'avc1.42E01E', // H.264 Baseline
  'avc1.4D401E', // H.264 Main
  'avc1.64001E', // H.264 High
  'hvc1.1.6.L93.B0', // HEVC/H.265
  'vp8', // VP8
  'vp09.00.10.08', // VP9
  'av01.0.01M.08', // AV1
] as const

/**
 * Common audio codecs to test for support
 */
const AUDIO_CODECS = [
  'mp4a.40.2', // AAC-LC
  'mp4a.40.5', // HE-AAC
  'mp4a.40.29', // HE-AAC v2
  'ac-3', // Dolby Digital (AC-3)
  'ec-3', // Dolby Digital Plus (E-AC-3)
  'opus', // Opus
  'vorbis', // Vorbis
] as const

/**
 * MIME types for codec testing
 */
const VIDEO_MIME_PREFIX = 'video/mp4; codecs='
const AUDIO_MIME_PREFIX = 'audio/mp4; codecs='

/**
 * Cached capabilities result to avoid repeated detection
 */
let cachedCapabilities: PlayerCapabilities | null = null

/**
 * Check if Media Source Extensions (MSE) are supported
 */
export function detectMSESupport(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'MediaSource' in window &&
    typeof MediaSource !== 'undefined' &&
    typeof MediaSource.isTypeSupported === 'function'
  )
}

/**
 * Check if Encrypted Media Extensions (EME) are supported
 */
export function detectEMESupport(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof navigator === 'undefined') return false

  return (
    'requestMediaKeySystemAccess' in navigator &&
    typeof navigator.requestMediaKeySystemAccess === 'function'
  )
}

/**
 * Check if native HLS playback is supported via video element
 */
export function detectNativeHLSSupport(): boolean {
  if (typeof document === 'undefined') return false

  const video = document.createElement('video')
  return (
    video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    video.canPlayType('application/x-mpegURL') !== ''
  )
}

/**
 * Check if HLS playback is supported (native or via MSE)
 */
export function detectHLSSupport(): boolean {
  // Native HLS (Safari, iOS)
  if (detectNativeHLSSupport()) return true

  // HLS via MSE (using hls.js or similar)
  if (detectMSESupport()) {
    return MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
  }

  return false
}

/**
 * Check if DASH playback is supported (requires MSE)
 */
export function detectDASHSupport(): boolean {
  if (!detectMSESupport()) return false

  // DASH requires MSE and basic codec support
  return MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
}

/**
 * Check if native video playback is available
 */
export function detectNativeVideoSupport(): boolean {
  if (typeof document === 'undefined') return false

  const video = document.createElement('video')
  return typeof video.canPlayType === 'function'
}

/**
 * Check if a specific video codec is supported
 */
export function isVideoCodecSupported(codec: string): boolean {
  if (typeof document === 'undefined') return false

  const video = document.createElement('video')
  const mimeType = `${VIDEO_MIME_PREFIX}"${codec}"`

  // Check both native video element and MSE support
  const nativeSupport = video.canPlayType(mimeType) !== ''
  const mseSupport = detectMSESupport() && MediaSource.isTypeSupported(mimeType)

  return nativeSupport || mseSupport
}

/**
 * Check if a specific audio codec is supported
 */
export function isAudioCodecSupported(codec: string): boolean {
  if (typeof document === 'undefined') return false

  const audio = document.createElement('audio')
  const mimeType = `${AUDIO_MIME_PREFIX}"${codec}"`

  // Check both native audio element and MSE support
  const nativeSupport = audio.canPlayType(mimeType) !== ''
  const mseSupport = detectMSESupport() && MediaSource.isTypeSupported(mimeType)

  return nativeSupport || mseSupport
}

/**
 * Get list of supported video codecs
 */
export function getSupportedVideoCodecs(): string[] {
  return VIDEO_CODECS.filter(codec => isVideoCodecSupported(codec))
}

/**
 * Get list of supported audio codecs
 */
export function getSupportedAudioCodecs(): string[] {
  return AUDIO_CODECS.filter(codec => isAudioCodecSupported(codec))
}

/**
 * Detect all player capabilities
 * Results are cached after first detection
 */
export function detectCapabilities(): PlayerCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities
  }

  cachedCapabilities = {
    mse: detectMSESupport(),
    eme: detectEMESupport(),
    hls: detectHLSSupport(),
    dash: detectDASHSupport(),
    nativeVideo: detectNativeVideoSupport(),
    supportedVideoCodecs: getSupportedVideoCodecs(),
    supportedAudioCodecs: getSupportedAudioCodecs(),
  }

  return cachedCapabilities
}

/**
 * Clear cached capabilities (useful for testing)
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null
}

/**
 * Check if the browser can play a specific MIME type
 */
export function canPlayType(mimeType: string): 'probably' | 'maybe' | '' {
  if (typeof document === 'undefined') return ''

  const video = document.createElement('video')
  return video.canPlayType(mimeType) as 'probably' | 'maybe' | ''
}

/**
 * Determine the best player strategy based on capabilities
 */
export function recommendPlayerStrategy(): 'shaka' | 'native' | 'unsupported' {
  const capabilities = detectCapabilities()

  // Prefer Shaka Player if MSE is available (for HLS/DASH via MSE)
  if (capabilities.mse && (capabilities.hls || capabilities.dash)) {
    return 'shaka'
  }

  // Fall back to native player for native HLS (Safari) or direct streams
  if (capabilities.nativeVideo) {
    return 'native'
  }

  return 'unsupported'
}

/**
 * Check if DRM playback is likely supported
 * Note: Full DRM support detection requires async key system access testing
 */
export function hasPotentialDRMSupport(): boolean {
  return detectEMESupport()
}

/**
 * Async check for specific DRM key system support
 */
export async function isDRMKeySystemSupported(keySystem: string): Promise<boolean> {
  if (!detectEMESupport()) return false

  const config: MediaKeySystemConfiguration[] = [{
    initDataTypes: ['cenc'],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
  }]

  try {
    await navigator.requestMediaKeySystemAccess(keySystem, config)
    return true
  } catch {
    return false
  }
}

/**
 * Common DRM key systems
 */
export const DRM_KEY_SYSTEMS = {
  WIDEVINE: 'com.widevine.alpha',
  PLAYREADY: 'com.microsoft.playready',
  FAIRPLAY: 'com.apple.fps.1_0',
  CLEARKEY: 'org.w3.clearkey',
} as const
