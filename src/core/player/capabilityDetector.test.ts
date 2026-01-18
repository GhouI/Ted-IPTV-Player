/**
 * Tests for MSE/EME capability detection utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
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

// Mock video element
const createMockVideoElement = (supportedTypes: Record<string, string> = {}) => ({
  canPlayType: vi.fn((mimeType: string) => supportedTypes[mimeType] || ''),
})

// Mock audio element
const createMockAudioElement = (supportedTypes: Record<string, string> = {}) => ({
  canPlayType: vi.fn((mimeType: string) => supportedTypes[mimeType] || ''),
})

describe('capabilityDetector', () => {
  let originalWindow: typeof globalThis.window
  let originalNavigator: typeof globalThis.navigator
  let originalDocument: typeof globalThis.document
  let originalMediaSource: typeof globalThis.MediaSource

  beforeEach(() => {
    // Clear cache before each test
    clearCapabilitiesCache()

    // Store originals
    originalWindow = globalThis.window
    originalNavigator = globalThis.navigator
    originalDocument = globalThis.document
    originalMediaSource = globalThis.MediaSource
  })

  afterEach(() => {
    // Restore originals
    globalThis.window = originalWindow
    globalThis.navigator = originalNavigator
    globalThis.document = originalDocument
    globalThis.MediaSource = originalMediaSource
    vi.restoreAllMocks()
    clearCapabilitiesCache()
  })

  describe('detectMSESupport', () => {
    it('should return false when window is undefined', () => {
      // @ts-expect-error - Testing undefined window
      globalThis.window = undefined
      expect(detectMSESupport()).toBe(false)
    })

    it('should return false when MediaSource is not available', () => {
      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined
      expect(detectMSESupport()).toBe(false)
    })

    it('should return true when MediaSource is available with isTypeSupported', () => {
      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => true),
      } as unknown as typeof MediaSource
      expect(detectMSESupport()).toBe(true)
    })

    it('should return false when isTypeSupported is not a function', () => {
      globalThis.MediaSource = {
        isTypeSupported: 'not a function',
      } as unknown as typeof MediaSource
      expect(detectMSESupport()).toBe(false)
    })
  })

  describe('detectEMESupport', () => {
    it('should return false when window is undefined', () => {
      // @ts-expect-error - Testing undefined window
      globalThis.window = undefined
      expect(detectEMESupport()).toBe(false)
    })

    it('should return false when navigator is undefined', () => {
      // @ts-expect-error - Testing undefined navigator
      globalThis.navigator = undefined
      expect(detectEMESupport()).toBe(false)
    })

    it('should return false when requestMediaKeySystemAccess is not available', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      })
      expect(detectEMESupport()).toBe(false)
    })

    it('should return true when requestMediaKeySystemAccess is available', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          requestMediaKeySystemAccess: vi.fn(),
        },
        writable: true,
        configurable: true,
      })
      expect(detectEMESupport()).toBe(true)
    })
  })

  describe('detectNativeHLSSupport', () => {
    it('should return false when document is undefined', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      expect(detectNativeHLSSupport()).toBe(false)
    })

    it('should return true when video element supports HLS MIME type', () => {
      const mockVideo = createMockVideoElement({
        'application/vnd.apple.mpegurl': 'maybe',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectNativeHLSSupport()).toBe(true)
    })

    it('should return true when video element supports x-mpegURL MIME type', () => {
      const mockVideo = createMockVideoElement({
        'application/x-mpegURL': 'probably',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectNativeHLSSupport()).toBe(true)
    })

    it('should return false when video element does not support HLS', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectNativeHLSSupport()).toBe(false)
    })
  })

  describe('detectHLSSupport', () => {
    it('should return true when native HLS is supported', () => {
      const mockVideo = createMockVideoElement({
        'application/vnd.apple.mpegurl': 'probably',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectHLSSupport()).toBe(true)
    })

    it('should return true when MSE supports required codecs', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      globalThis.MediaSource = {
        isTypeSupported: vi.fn((type: string) =>
          type.includes('avc1.42E01E') && type.includes('mp4a.40.2')
        ),
      } as unknown as typeof MediaSource

      expect(detectHLSSupport()).toBe(true)
    })

    it('should return false when neither native nor MSE HLS is supported', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      expect(detectHLSSupport()).toBe(false)
    })
  })

  describe('detectDASHSupport', () => {
    it('should return false when MSE is not supported', () => {
      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined
      expect(detectDASHSupport()).toBe(false)
    })

    it('should return true when MSE supports required codecs', () => {
      globalThis.MediaSource = {
        isTypeSupported: vi.fn((type: string) =>
          type.includes('avc1.42E01E') && type.includes('mp4a.40.2')
        ),
      } as unknown as typeof MediaSource

      expect(detectDASHSupport()).toBe(true)
    })

    it('should return false when MSE does not support required codecs', () => {
      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => false),
      } as unknown as typeof MediaSource

      expect(detectDASHSupport()).toBe(false)
    })
  })

  describe('detectNativeVideoSupport', () => {
    it('should return false when document is undefined', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      expect(detectNativeVideoSupport()).toBe(false)
    })

    it('should return true when video element has canPlayType', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectNativeVideoSupport()).toBe(true)
    })

    it('should return false when canPlayType is not a function', () => {
      const mockVideo = { canPlayType: 'not a function' }
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(detectNativeVideoSupport()).toBe(false)
    })
  })

  describe('isVideoCodecSupported', () => {
    it('should return false when document is undefined', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      expect(isVideoCodecSupported('avc1.42E01E')).toBe(false)
    })

    it('should return true when video element supports codec', () => {
      const mockVideo = createMockVideoElement({
        'video/mp4; codecs="avc1.42E01E"': 'probably',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      expect(isVideoCodecSupported('avc1.42E01E')).toBe(true)
    })

    it('should return true when MSE supports codec', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      globalThis.MediaSource = {
        isTypeSupported: vi.fn((type: string) => type.includes('avc1.42E01E')),
      } as unknown as typeof MediaSource

      expect(isVideoCodecSupported('avc1.42E01E')).toBe(true)
    })

    it('should return false when codec is not supported', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => false),
      } as unknown as typeof MediaSource

      expect(isVideoCodecSupported('unknown.codec')).toBe(false)
    })
  })

  describe('isAudioCodecSupported', () => {
    it('should return false when document is undefined', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      expect(isAudioCodecSupported('mp4a.40.2')).toBe(false)
    })

    it('should return true when audio element supports codec', () => {
      const mockAudio = createMockAudioElement({
        'audio/mp4; codecs="mp4a.40.2"': 'probably',
      })
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'audio') return mockAudio as unknown as HTMLAudioElement
        return createMockVideoElement({}) as unknown as HTMLVideoElement
      })

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      expect(isAudioCodecSupported('mp4a.40.2')).toBe(true)
    })

    it('should return true when MSE supports codec', () => {
      const mockAudio = createMockAudioElement({})
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'audio') return mockAudio as unknown as HTMLAudioElement
        return createMockVideoElement({}) as unknown as HTMLVideoElement
      })

      globalThis.MediaSource = {
        isTypeSupported: vi.fn((type: string) => type.includes('mp4a.40.2')),
      } as unknown as typeof MediaSource

      expect(isAudioCodecSupported('mp4a.40.2')).toBe(true)
    })
  })

  describe('getSupportedVideoCodecs', () => {
    it('should return array of supported video codecs', () => {
      const mockVideo = createMockVideoElement({
        'video/mp4; codecs="avc1.42E01E"': 'probably',
        'video/mp4; codecs="avc1.4D401E"': 'probably',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const codecs = getSupportedVideoCodecs()
      expect(codecs).toContain('avc1.42E01E')
      expect(codecs).toContain('avc1.4D401E')
    })

    it('should return empty array when no codecs supported', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const codecs = getSupportedVideoCodecs()
      expect(codecs).toEqual([])
    })
  })

  describe('getSupportedAudioCodecs', () => {
    it('should return array of supported audio codecs', () => {
      const mockAudio = createMockAudioElement({
        'audio/mp4; codecs="mp4a.40.2"': 'probably',
        'audio/mp4; codecs="opus"': 'probably',
      })
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'audio') return mockAudio as unknown as HTMLAudioElement
        return createMockVideoElement({}) as unknown as HTMLVideoElement
      })

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const codecs = getSupportedAudioCodecs()
      expect(codecs).toContain('mp4a.40.2')
      expect(codecs).toContain('opus')
    })
  })

  describe('detectCapabilities', () => {
    it('should return complete capabilities object', () => {
      const mockVideo = createMockVideoElement({
        'video/mp4; codecs="avc1.42E01E"': 'probably',
      })
      const mockAudio = createMockAudioElement({
        'audio/mp4; codecs="mp4a.40.2"': 'probably',
      })
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'audio') return mockAudio as unknown as HTMLAudioElement
        return mockVideo as unknown as HTMLVideoElement
      })

      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => true),
      } as unknown as typeof MediaSource

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          requestMediaKeySystemAccess: vi.fn(),
        },
        writable: true,
        configurable: true,
      })

      const capabilities = detectCapabilities()

      expect(capabilities).toHaveProperty('mse')
      expect(capabilities).toHaveProperty('eme')
      expect(capabilities).toHaveProperty('hls')
      expect(capabilities).toHaveProperty('dash')
      expect(capabilities).toHaveProperty('nativeVideo')
      expect(capabilities).toHaveProperty('supportedVideoCodecs')
      expect(capabilities).toHaveProperty('supportedAudioCodecs')
      expect(Array.isArray(capabilities.supportedVideoCodecs)).toBe(true)
      expect(Array.isArray(capabilities.supportedAudioCodecs)).toBe(true)
    })

    it('should cache capabilities', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const firstCall = detectCapabilities()
      const secondCall = detectCapabilities()

      expect(firstCall).toBe(secondCall)
    })

    it('should return fresh result after cache clear', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const firstCall = detectCapabilities()
      clearCapabilitiesCache()
      const secondCall = detectCapabilities()

      expect(firstCall).not.toBe(secondCall)
      expect(firstCall).toEqual(secondCall)
    })
  })

  describe('canPlayType', () => {
    it('should return empty string when document is undefined', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      expect(canPlayType('video/mp4')).toBe('')
    })

    it('should return video element canPlayType result', () => {
      const mockVideo = createMockVideoElement({
        'video/mp4': 'probably',
        'video/webm': 'maybe',
      })
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      expect(canPlayType('video/mp4')).toBe('probably')
      expect(canPlayType('video/webm')).toBe('maybe')
      expect(canPlayType('video/unknown')).toBe('')
    })
  })

  describe('recommendPlayerStrategy', () => {
    it('should recommend shaka when MSE and HLS/DASH are supported', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => true),
      } as unknown as typeof MediaSource

      clearCapabilitiesCache()
      expect(recommendPlayerStrategy()).toBe('shaka')
    })

    it('should recommend native when only native video is supported', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      clearCapabilitiesCache()
      expect(recommendPlayerStrategy()).toBe('native')
    })

    it('should return unsupported when nothing is available', () => {
      // @ts-expect-error - Testing undefined document
      globalThis.document = undefined
      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      clearCapabilitiesCache()
      expect(recommendPlayerStrategy()).toBe('unsupported')
    })
  })

  describe('hasPotentialDRMSupport', () => {
    it('should return true when EME is supported', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          requestMediaKeySystemAccess: vi.fn(),
        },
        writable: true,
        configurable: true,
      })

      expect(hasPotentialDRMSupport()).toBe(true)
    })

    it('should return false when EME is not supported', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      })

      expect(hasPotentialDRMSupport()).toBe(false)
    })
  })

  describe('isDRMKeySystemSupported', () => {
    it('should return false when EME is not supported', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      })

      const result = await isDRMKeySystemSupported(DRM_KEY_SYSTEMS.WIDEVINE)
      expect(result).toBe(false)
    })

    it('should return true when key system is supported', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          requestMediaKeySystemAccess: vi.fn().mockResolvedValue({}),
        },
        writable: true,
        configurable: true,
      })

      const result = await isDRMKeySystemSupported(DRM_KEY_SYSTEMS.WIDEVINE)
      expect(result).toBe(true)
    })

    it('should return false when key system access throws', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          requestMediaKeySystemAccess: vi.fn().mockRejectedValue(new Error('Not supported')),
        },
        writable: true,
        configurable: true,
      })

      const result = await isDRMKeySystemSupported(DRM_KEY_SYSTEMS.WIDEVINE)
      expect(result).toBe(false)
    })
  })

  describe('DRM_KEY_SYSTEMS', () => {
    it('should have correct key system identifiers', () => {
      expect(DRM_KEY_SYSTEMS.WIDEVINE).toBe('com.widevine.alpha')
      expect(DRM_KEY_SYSTEMS.PLAYREADY).toBe('com.microsoft.playready')
      expect(DRM_KEY_SYSTEMS.FAIRPLAY).toBe('com.apple.fps.1_0')
      expect(DRM_KEY_SYSTEMS.CLEARKEY).toBe('org.w3.clearkey')
    })
  })

  describe('clearCapabilitiesCache', () => {
    it('should clear the cached capabilities', () => {
      const mockVideo = createMockVideoElement({})
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      // @ts-expect-error - Testing missing MediaSource
      globalThis.MediaSource = undefined

      const first = detectCapabilities()
      clearCapabilitiesCache()

      // Change mock behavior
      globalThis.MediaSource = {
        isTypeSupported: vi.fn(() => true),
      } as unknown as typeof MediaSource

      const second = detectCapabilities()

      expect(first.mse).toBe(false)
      expect(second.mse).toBe(true)
    })
  })
})
