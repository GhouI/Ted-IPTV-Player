import { useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '../../core/stores/playerStore'
import { useChannelStore } from '../../core/stores/channelStore'
import { VIDAA_KEY_CODES } from '../../core/navigation'

/**
 * Key codes for player remote control
 */
export const PLAYER_KEY_CODES = {
  // VIDAA remote keys
  ...VIDAA_KEY_CODES,
  // Media keys (standard web)
  MEDIA_PLAY_PAUSE: 179,
  MEDIA_STOP: 178,
  MEDIA_TRACK_NEXT: 176,
  MEDIA_TRACK_PREVIOUS: 177,
  // Keyboard keys for testing
  SPACE: 32,
  P_KEY: 80, // 'P' for play/pause
  M_KEY: 77, // 'M' for mute
  F_KEY: 70, // 'F' for fullscreen
  // Channel navigation
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  CHANNEL_UP: 427, // VIDAA channel up
  CHANNEL_DOWN: 428, // VIDAA channel down
  // Seek keys
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  REWIND: 412, // VIDAA rewind
  FAST_FORWARD: 417, // VIDAA fast forward
} as const

export interface PlayerRemoteControlOptions {
  /** Whether remote control is enabled */
  enabled?: boolean
  /** Seek step in seconds when pressing left/right */
  seekStep?: number
  /** Volume step when pressing up/down (0-1 scale) */
  volumeStep?: number
  /** Callback when play/pause is toggled */
  onPlayPause?: () => void
  /** Callback when channel up is pressed */
  onChannelUp?: () => void
  /** Callback when channel down is pressed */
  onChannelDown?: () => void
  /** Callback when seek forward is pressed */
  onSeekForward?: (seconds: number) => void
  /** Callback when seek backward is pressed */
  onSeekBackward?: (seconds: number) => void
  /** Callback when back button is pressed */
  onBack?: () => void
  /** Whether controls are currently visible (affects key behavior) */
  controlsVisible?: boolean
}

export interface PlayerRemoteControlState {
  /** Whether remote control is currently active */
  isActive: boolean
}

/**
 * usePlayerRemoteControl - Hook for handling TV remote control input during video playback.
 *
 * Features:
 * - Play/pause toggle (OK/Enter, Space, P key, media play/pause button)
 * - Channel up/down navigation (Page Up/Down, Channel buttons)
 * - Volume control (Up/Down arrows when controls hidden)
 * - Seek forward/backward (Left/Right arrows, rewind/fast-forward buttons)
 * - Mute toggle (M key)
 * - Fullscreen toggle (F key)
 *
 * @param options Configuration options for remote control behavior
 * @returns State object with remote control status
 */
export function usePlayerRemoteControl(
  options: PlayerRemoteControlOptions = {}
): PlayerRemoteControlState {
  const {
    enabled = true,
    seekStep = 10,
    volumeStep = 0.1,
    onPlayPause,
    onChannelUp,
    onChannelDown,
    onSeekForward,
    onSeekBackward,
    onBack,
    controlsVisible: externalControlsVisible,
  } = options

  // Get player state and actions
  const {
    isSeekable,
    volume,
    isFullscreen,
    controlsVisible: storeControlsVisible,
    setVolume,
    toggleMute,
    setFullscreen,
    showControls,
  } = usePlayerStore()

  // Get channel state
  const { currentChannel, setCurrentChannel, getFilteredChannels } =
    useChannelStore()

  // Track active state
  const [isActive, setIsActive] = useState(enabled)

  // Use external controls visible state if provided, otherwise use store state
  const controlsVisible = externalControlsVisible ?? storeControlsVisible

  /**
   * Toggle play/pause state
   */
  const handlePlayPause = useCallback(() => {
    onPlayPause?.()
    showControls()
  }, [onPlayPause, showControls])

  /**
   * Change to next channel
   */
  const handleChannelUp = useCallback(() => {
    if (onChannelUp) {
      onChannelUp()
      return
    }

    const filteredChannels = getFilteredChannels()
    if (filteredChannels.length === 0 || !currentChannel) return

    const currentIndex = filteredChannels.findIndex(
      (ch) => ch.id === currentChannel.id
    )
    if (currentIndex === -1) return

    // Move to next channel (wrap around to first if at end)
    const nextIndex = (currentIndex + 1) % filteredChannels.length
    setCurrentChannel(filteredChannels[nextIndex])
    showControls()
  }, [
    onChannelUp,
    getFilteredChannels,
    currentChannel,
    setCurrentChannel,
    showControls,
  ])

  /**
   * Change to previous channel
   */
  const handleChannelDown = useCallback(() => {
    if (onChannelDown) {
      onChannelDown()
      return
    }

    const filteredChannels = getFilteredChannels()
    if (filteredChannels.length === 0 || !currentChannel) return

    const currentIndex = filteredChannels.findIndex(
      (ch) => ch.id === currentChannel.id
    )
    if (currentIndex === -1) return

    // Move to previous channel (wrap around to last if at beginning)
    const prevIndex =
      currentIndex === 0 ? filteredChannels.length - 1 : currentIndex - 1
    setCurrentChannel(filteredChannels[prevIndex])
    showControls()
  }, [
    onChannelDown,
    getFilteredChannels,
    currentChannel,
    setCurrentChannel,
    showControls,
  ])

  /**
   * Seek forward
   */
  const handleSeekForward = useCallback(() => {
    if (!isSeekable) return

    if (onSeekForward) {
      onSeekForward(seekStep)
    }
    showControls()
  }, [isSeekable, onSeekForward, seekStep, showControls])

  /**
   * Seek backward
   */
  const handleSeekBackward = useCallback(() => {
    if (!isSeekable) return

    if (onSeekBackward) {
      onSeekBackward(seekStep)
    }
    showControls()
  }, [isSeekable, onSeekBackward, seekStep, showControls])

  /**
   * Increase volume
   */
  const handleVolumeUp = useCallback(() => {
    const newVolume = Math.min(1, volume + volumeStep)
    setVolume(newVolume)
    showControls()
  }, [volume, volumeStep, setVolume, showControls])

  /**
   * Decrease volume
   */
  const handleVolumeDown = useCallback(() => {
    const newVolume = Math.max(0, volume - volumeStep)
    setVolume(newVolume)
    showControls()
  }, [volume, volumeStep, setVolume, showControls])

  /**
   * Toggle mute
   */
  const handleMuteToggle = useCallback(() => {
    toggleMute()
    showControls()
  }, [toggleMute, showControls])

  /**
   * Toggle fullscreen
   */
  const handleFullscreenToggle = useCallback(() => {
    setFullscreen(!isFullscreen)
    showControls()
  }, [isFullscreen, setFullscreen, showControls])

  /**
   * Handle back button
   */
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    }
  }, [onBack])

  /**
   * Key event handler
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if not enabled or if target is an input element
      if (!enabled) return
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const keyCode = event.keyCode

      switch (keyCode) {
        // Play/Pause keys
        case PLAYER_KEY_CODES.ENTER:
        case PLAYER_KEY_CODES.SPACE:
        case PLAYER_KEY_CODES.P_KEY:
        case PLAYER_KEY_CODES.MEDIA_PLAY_PAUSE:
          event.preventDefault()
          handlePlayPause()
          break

        // Channel navigation
        case PLAYER_KEY_CODES.PAGE_UP:
        case PLAYER_KEY_CODES.CHANNEL_UP:
          event.preventDefault()
          handleChannelUp()
          break

        case PLAYER_KEY_CODES.PAGE_DOWN:
        case PLAYER_KEY_CODES.CHANNEL_DOWN:
          event.preventDefault()
          handleChannelDown()
          break

        // Seek/Volume with arrow keys
        case PLAYER_KEY_CODES.LEFT:
        case PLAYER_KEY_CODES.ARROW_LEFT:
        case PLAYER_KEY_CODES.REWIND:
          event.preventDefault()
          handleSeekBackward()
          break

        case PLAYER_KEY_CODES.RIGHT:
        case PLAYER_KEY_CODES.ARROW_RIGHT:
        case PLAYER_KEY_CODES.FAST_FORWARD:
          event.preventDefault()
          handleSeekForward()
          break

        // Volume with up/down when controls are hidden
        case PLAYER_KEY_CODES.UP:
          if (!controlsVisible) {
            event.preventDefault()
            handleVolumeUp()
          }
          break

        case PLAYER_KEY_CODES.DOWN:
          if (!controlsVisible) {
            event.preventDefault()
            handleVolumeDown()
          }
          break

        // Mute toggle
        case PLAYER_KEY_CODES.M_KEY:
          event.preventDefault()
          handleMuteToggle()
          break

        // Fullscreen toggle
        case PLAYER_KEY_CODES.F_KEY:
          event.preventDefault()
          handleFullscreenToggle()
          break

        // Back button
        case PLAYER_KEY_CODES.BACK:
        case PLAYER_KEY_CODES.BACK_ALT:
          event.preventDefault()
          handleBack()
          break

        // Stop playback
        case PLAYER_KEY_CODES.MEDIA_STOP:
          event.preventDefault()
          handlePlayPause()
          break
      }
    },
    [
      enabled,
      controlsVisible,
      handlePlayPause,
      handleChannelUp,
      handleChannelDown,
      handleSeekForward,
      handleSeekBackward,
      handleVolumeUp,
      handleVolumeDown,
      handleMuteToggle,
      handleFullscreenToggle,
      handleBack,
    ]
  )

  // Set up key event listener
  useEffect(() => {
    if (!enabled) {
      setIsActive(false)
      return
    }

    setIsActive(true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    isActive,
  }
}
