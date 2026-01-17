/**
 * Type declarations for shaka-player
 *
 * Shaka Player is a JavaScript library for adaptive media playback.
 * This provides minimal type declarations for the features we use.
 */

declare module 'shaka-player' {
  export interface Track {
    id: number | null
    active: boolean
    type: string
    bandwidth: number
    language: string
    label: string | null
    kind: string | null
    mimeType: string | null
  }

  export interface VariantTrack extends Track {
    type: 'variant'
    height: number | null
    width: number | null
    frameRate: number | null
    videoCodec: string | null
    audioCodec: string | null
    channelsCount: number | null
    audioId: number | null
    audioBandwidth: number | null
  }

  export interface TextTrack extends Track {
    type: 'text'
  }

  export interface PlayerConfiguration {
    streaming?: {
      bufferingGoal?: number
      rebufferingGoal?: number
      bufferBehind?: number
      retryParameters?: {
        maxAttempts?: number
        baseDelay?: number
        backoffFactor?: number
        fuzzFactor?: number
      }
    }
    abr?: {
      enabled?: boolean
    }
    preferredAudioLanguage?: string
    preferredTextLanguage?: string
  }

  export class Player {
    static isBrowserSupported(): boolean

    constructor(videoElement?: HTMLMediaElement)

    attach(mediaElement: HTMLMediaElement): Promise<void>
    detach(): Promise<void>
    load(uri: string, startTime?: number): Promise<void>
    unload(): Promise<void>
    destroy(): Promise<void>

    configure(config: PlayerConfiguration): boolean
    configure(path: string, value: unknown): boolean
    getConfiguration(): PlayerConfiguration

    getVariantTracks(): VariantTrack[]
    getTextTracks(): TextTrack[]

    selectVariantTrack(track: VariantTrack, clearBuffer?: boolean): void
    selectTextTrack(track: TextTrack): void

    setTextTrackVisibility(visible: boolean): void
    isTextTrackVisible(): boolean

    addEventListener(type: string, listener: (event: Event) => void): void
    removeEventListener(type: string, listener: (event: Event) => void): void
  }

  export const polyfill: {
    installAll(): void
  }
}
