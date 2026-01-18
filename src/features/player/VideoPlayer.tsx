import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '../../core/stores/playerStore'
import { createPlayer } from '../../core/player'
import type { PlayerAdapter, PlayerConfig, PlayerEvent } from '../../core/types/player'
import type { CreatePlayerResult } from '../../core/player'

export interface VideoPlayerProps {
  /** Stream URL to play */
  src?: string
  /** Whether to auto-play when source is set */
  autoPlay?: boolean
  /** Player configuration options */
  config?: PlayerConfig
  /** Callback when playback starts */
  onPlay?: () => void
  /** Callback when playback pauses */
  onPause?: () => void
  /** Callback when playback ends */
  onEnded?: () => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
  /** Callback when stream is loaded and ready */
  onReady?: () => void
  /** Whether to show the video element (false for audio-only) */
  visible?: boolean
  /** Additional CSS classes for the container */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * VideoPlayer - Main video player component with Shaka Player integration.
 *
 * Features:
 * - Auto-selects best player (Shaka or Native) based on browser capabilities
 * - Supports HLS and DASH adaptive streaming
 * - Syncs playback state to Zustand store
 * - Handles stream loading, error recovery, and cleanup
 * - Exposes player controls via store actions
 */
export function VideoPlayer({
  src,
  autoPlay = false,
  config,
  onPlay,
  onPause,
  onEnded,
  onError,
  onReady,
  visible = true,
  className = '',
  testId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<PlayerAdapter | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [playerType, setPlayerType] = useState<'shaka' | 'native' | null>(null)

  // Get store actions
  const {
    setPlaybackState,
    setCurrentTime,
    setDuration,
    setBufferedTime,
    setVolume,
    setMuted,
    setCurrentUrl,
    setQualityTracks,
    selectQuality,
    setAudioTracks,
    selectAudioTrack,
    setSubtitleTracks,
    selectSubtitleTrack,
    setError,
    setSeekable,
    reset,
  } = usePlayerStore()

  /**
   * Handle player events and sync to store
   */
  const handlePlayerEvent = useCallback(
    (event: PlayerEvent) => {
      switch (event.type) {
        case 'statechange': {
          setPlaybackState(event.newState)
          if (event.newState === 'playing') {
            onPlay?.()
          } else if (event.newState === 'paused') {
            onPause?.()
          }
          break
        }
        case 'timeupdate': {
          setCurrentTime(event.currentTime)
          setBufferedTime(event.bufferedTime)
          break
        }
        case 'durationchange': {
          setDuration(event.duration, event.isLive)
          setSeekable(!event.isLive && event.duration > 0)
          break
        }
        case 'volumechange': {
          setVolume(event.volume)
          setMuted(event.isMuted)
          break
        }
        case 'qualitychange': {
          selectQuality(event.newQuality)
          break
        }
        case 'audiotrackchange': {
          selectAudioTrack(event.audioTrack)
          break
        }
        case 'subtitletrackchange': {
          selectSubtitleTrack(event.subtitleTrack)
          break
        }
        case 'tracksloaded': {
          setQualityTracks(event.qualityTracks)
          setAudioTracks(event.audioTracks)
          setSubtitleTracks(event.subtitleTracks)
          onReady?.()
          break
        }
        case 'error': {
          setError(event.error)
          onError?.(new Error(event.error.message))
          break
        }
        case 'ended': {
          onEnded?.()
          break
        }
      }
    },
    [
      setPlaybackState,
      setCurrentTime,
      setBufferedTime,
      setDuration,
      setSeekable,
      setVolume,
      setMuted,
      selectQuality,
      selectAudioTrack,
      selectSubtitleTrack,
      setQualityTracks,
      setAudioTracks,
      setSubtitleTracks,
      setError,
      onPlay,
      onPause,
      onEnded,
      onError,
      onReady,
    ]
  )

  /**
   * Initialize the player
   */
  const initializePlayer = useCallback(async () => {
    if (!videoRef.current) return

    try {
      // Create player with auto-selection based on capabilities
      const result: CreatePlayerResult = await createPlayer({
        playerType: 'auto',
        streamUrl: src,
        config,
      })

      playerRef.current = result.player
      setPlayerType(result.type)

      // Initialize with video element
      await result.player.initialize(videoRef.current, config)

      // Subscribe to player events
      const eventTypes: PlayerEvent['type'][] = [
        'statechange',
        'timeupdate',
        'durationchange',
        'volumechange',
        'qualitychange',
        'audiotrackchange',
        'subtitletrackchange',
        'tracksloaded',
        'error',
        'ended',
      ]

      eventTypes.forEach((eventType) => {
        result.player.addEventListener(eventType, handlePlayerEvent)
      })

      setIsInitialized(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize player'
      setError({
        code: 'MEDIA_ERROR',
        message: errorMessage,
        recoverable: false,
        timestamp: Date.now(),
      })
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [src, config, handlePlayerEvent, setError, onError])

  /**
   * Load source into the player
   */
  const loadSource = useCallback(async () => {
    if (!playerRef.current || !src || !isInitialized) return

    try {
      setCurrentUrl(src)
      await playerRef.current.load(src, autoPlay)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load stream'
      setError({
        code: 'MEDIA_ERROR',
        message: errorMessage,
        recoverable: true,
        timestamp: Date.now(),
      })
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [src, autoPlay, isInitialized, setCurrentUrl, setError, onError])

  /**
   * Cleanup player resources
   */
  const destroyPlayer = useCallback(async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.destroy()
      } catch {
        // Ignore cleanup errors
      }
      playerRef.current = null
    }
    setIsInitialized(false)
    setPlayerType(null)
  }, [])

  // Initialize player on mount
  useEffect(() => {
    initializePlayer()

    return () => {
      destroyPlayer()
      reset()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load source when it changes and player is initialized
  useEffect(() => {
    if (isInitialized && src) {
      loadSource()
    }
  }, [src, isInitialized, loadSource])

  // CSS classes for the container
  const containerClasses = [
    'relative',
    'w-full',
    'h-full',
    'bg-black',
    visible ? '' : 'opacity-0 pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      data-player-type={playerType}
      data-initialized={isInitialized}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        data-testid={testId ? `${testId}-video` : undefined}
      />
    </div>
  )
}

