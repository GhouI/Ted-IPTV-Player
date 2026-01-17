/**
 * Player module exports
 */

export {
  detectMSESupport,
  detectEMESupport,
  detectNativeHLSSupport,
  detectHLSSupport,
  detectDASHSupport,
  detectNativeVideoSupport,
  isVideoCodecSupported,
  isAudioCodecSupported,
  getSupportedVideoCodecs,
  getSupportedAudioCodecs,
  detectCapabilities,
  clearCapabilitiesCache,
  canPlayType,
  recommendPlayerStrategy,
  hasPotentialDRMSupport,
  isDRMKeySystemSupported,
  DRM_KEY_SYSTEMS,
} from './capabilityDetector'

export { BasePlayerAdapter } from './BasePlayerAdapter'
export { NativePlayerAdapter } from './NativePlayerAdapter'
export { ShakaPlayerAdapter, isShakaSupported } from './ShakaPlayerAdapter'

// Player factory exports
export {
  createPlayer,
  getRecommendedPlayerType,
  isPlayerTypeSupported,
  getPlayerSupportSummary,
} from './PlayerFactory'
export type {
  PlayerType,
  CreatePlayerOptions,
  CreatePlayerResult,
} from './PlayerFactory'
