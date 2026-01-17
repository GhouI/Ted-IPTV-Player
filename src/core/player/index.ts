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
