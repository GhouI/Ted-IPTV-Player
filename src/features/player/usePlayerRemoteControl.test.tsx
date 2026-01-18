import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  usePlayerRemoteControl,
  PLAYER_KEY_CODES,
} from './usePlayerRemoteControl'
import { usePlayerStore } from '../../core/stores/playerStore'
import { useChannelStore } from '../../core/stores/channelStore'
import type { Channel } from '../../core/types/channel'

// Mock the stores
vi.mock('../../core/stores/playerStore', () => ({
  usePlayerStore: vi.fn(),
}))

vi.mock('../../core/stores/channelStore', () => ({
  useChannelStore: vi.fn(),
}))

// Mock channels for testing
const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: 'Channel 1',
    streamUrl: 'http://example.com/stream1',
    categoryId: 'cat-1',
  },
  {
    id: 'channel-2',
    name: 'Channel 2',
    streamUrl: 'http://example.com/stream2',
    categoryId: 'cat-1',
  },
  {
    id: 'channel-3',
    name: 'Channel 3',
    streamUrl: 'http://example.com/stream3',
    categoryId: 'cat-1',
  },
]

describe('usePlayerRemoteControl', () => {
  // Default mock implementations
  const mockSetVolume = vi.fn()
  const mockToggleMute = vi.fn()
  const mockSetFullscreen = vi.fn()
  const mockShowControls = vi.fn()
  const mockSetCurrentChannel = vi.fn()
  const mockGetFilteredChannels = vi.fn(() => mockChannels)

  const defaultPlayerStore = {
    playbackState: 'playing' as const,
    isSeekable: true,
    volume: 0.5,
    isMuted: false,
    isFullscreen: false,
    controlsVisible: false,
    setVolume: mockSetVolume,
    toggleMute: mockToggleMute,
    setFullscreen: mockSetFullscreen,
    showControls: mockShowControls,
  }

  const defaultChannelStore = {
    channels: mockChannels,
    currentChannel: mockChannels[0],
    setCurrentChannel: mockSetCurrentChannel,
    getFilteredChannels: mockGetFilteredChannels,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      defaultPlayerStore
    )
    ;(useChannelStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      defaultChannelStore
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Helper to simulate a key press
   */
  function pressKey(keyCode: number) {
    const event = new KeyboardEvent('keydown', {
      keyCode,
      bubbles: true,
    })
    window.dispatchEvent(event)
  }

  describe('initialization', () => {
    it('should return active state when enabled', () => {
      const { result } = renderHook(() => usePlayerRemoteControl())
      expect(result.current.isActive).toBe(true)
    })

    it('should return inactive state when disabled', () => {
      const { result } = renderHook(() =>
        usePlayerRemoteControl({ enabled: false })
      )
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('play/pause handling', () => {
    it('should call onPlayPause when Enter is pressed', () => {
      const onPlayPause = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onPlayPause }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.ENTER)
      })

      expect(onPlayPause).toHaveBeenCalledTimes(1)
      expect(mockShowControls).toHaveBeenCalled()
    })

    it('should call onPlayPause when Space is pressed', () => {
      const onPlayPause = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onPlayPause }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.SPACE)
      })

      expect(onPlayPause).toHaveBeenCalledTimes(1)
    })

    it('should call onPlayPause when P key is pressed', () => {
      const onPlayPause = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onPlayPause }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.P_KEY)
      })

      expect(onPlayPause).toHaveBeenCalledTimes(1)
    })

    it('should call onPlayPause when media play/pause button is pressed', () => {
      const onPlayPause = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onPlayPause }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.MEDIA_PLAY_PAUSE)
      })

      expect(onPlayPause).toHaveBeenCalledTimes(1)
    })
  })

  describe('channel navigation', () => {
    it('should call onChannelUp when Page Up is pressed', () => {
      const onChannelUp = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onChannelUp }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_UP)
      })

      expect(onChannelUp).toHaveBeenCalledTimes(1)
    })

    it('should call onChannelDown when Page Down is pressed', () => {
      const onChannelDown = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onChannelDown }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_DOWN)
      })

      expect(onChannelDown).toHaveBeenCalledTimes(1)
    })

    it('should navigate to next channel when no callback is provided', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_UP)
      })

      expect(mockSetCurrentChannel).toHaveBeenCalledWith(mockChannels[1])
    })

    it('should wrap around to first channel when at end', () => {
      ;(useChannelStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        {
          ...defaultChannelStore,
          currentChannel: mockChannels[2], // Last channel
        }
      )

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_UP)
      })

      expect(mockSetCurrentChannel).toHaveBeenCalledWith(mockChannels[0])
    })

    it('should navigate to previous channel', () => {
      ;(useChannelStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        {
          ...defaultChannelStore,
          currentChannel: mockChannels[1], // Second channel
        }
      )

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_DOWN)
      })

      expect(mockSetCurrentChannel).toHaveBeenCalledWith(mockChannels[0])
    })

    it('should wrap around to last channel when at beginning', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.PAGE_DOWN)
      })

      expect(mockSetCurrentChannel).toHaveBeenCalledWith(mockChannels[2])
    })
  })

  describe('seek handling', () => {
    it('should call onSeekForward with seekStep when Right arrow is pressed', () => {
      const onSeekForward = vi.fn()
      renderHook(() =>
        usePlayerRemoteControl({ onSeekForward, seekStep: 15 })
      )

      act(() => {
        pressKey(PLAYER_KEY_CODES.RIGHT)
      })

      expect(onSeekForward).toHaveBeenCalledWith(15)
      expect(mockShowControls).toHaveBeenCalled()
    })

    it('should call onSeekBackward with seekStep when Left arrow is pressed', () => {
      const onSeekBackward = vi.fn()
      renderHook(() =>
        usePlayerRemoteControl({ onSeekBackward, seekStep: 15 })
      )

      act(() => {
        pressKey(PLAYER_KEY_CODES.LEFT)
      })

      expect(onSeekBackward).toHaveBeenCalledWith(15)
    })

    it('should not seek when stream is not seekable', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        isSeekable: false,
      })

      const onSeekForward = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onSeekForward }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.RIGHT)
      })

      expect(onSeekForward).not.toHaveBeenCalled()
    })

    it('should handle rewind button', () => {
      const onSeekBackward = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onSeekBackward }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.REWIND)
      })

      expect(onSeekBackward).toHaveBeenCalledWith(10) // Default seekStep
    })

    it('should handle fast forward button', () => {
      const onSeekForward = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onSeekForward }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.FAST_FORWARD)
      })

      expect(onSeekForward).toHaveBeenCalledWith(10) // Default seekStep
    })
  })

  describe('volume handling', () => {
    it('should increase volume when Up arrow is pressed and controls are hidden', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.UP)
      })

      expect(mockSetVolume).toHaveBeenCalledWith(0.6) // 0.5 + 0.1
      expect(mockShowControls).toHaveBeenCalled()
    })

    it('should decrease volume when Down arrow is pressed and controls are hidden', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.DOWN)
      })

      expect(mockSetVolume).toHaveBeenCalledWith(0.4) // 0.5 - 0.1
    })

    it('should not change volume when controls are visible', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        controlsVisible: true,
      })

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.UP)
      })

      expect(mockSetVolume).not.toHaveBeenCalled()
    })

    it('should clamp volume at maximum (1)', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        volume: 0.95,
      })

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.UP)
      })

      expect(mockSetVolume).toHaveBeenCalledWith(1)
    })

    it('should clamp volume at minimum (0)', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        volume: 0.05,
      })

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.DOWN)
      })

      expect(mockSetVolume).toHaveBeenCalledWith(0)
    })

    it('should use custom volumeStep', () => {
      renderHook(() => usePlayerRemoteControl({ volumeStep: 0.2 }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.UP)
      })

      expect(mockSetVolume).toHaveBeenCalledWith(0.7) // 0.5 + 0.2
    })
  })

  describe('mute toggle', () => {
    it('should toggle mute when M key is pressed', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.M_KEY)
      })

      expect(mockToggleMute).toHaveBeenCalledTimes(1)
      expect(mockShowControls).toHaveBeenCalled()
    })
  })

  describe('fullscreen toggle', () => {
    it('should toggle fullscreen when F key is pressed', () => {
      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.F_KEY)
      })

      expect(mockSetFullscreen).toHaveBeenCalledWith(true)
      expect(mockShowControls).toHaveBeenCalled()
    })

    it('should exit fullscreen when already in fullscreen', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        isFullscreen: true,
      })

      renderHook(() => usePlayerRemoteControl())

      act(() => {
        pressKey(PLAYER_KEY_CODES.F_KEY)
      })

      expect(mockSetFullscreen).toHaveBeenCalledWith(false)
    })
  })

  describe('back button', () => {
    it('should call onBack when Back button is pressed', () => {
      const onBack = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onBack }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.BACK)
      })

      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('should call onBack when Backspace is pressed', () => {
      const onBack = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onBack }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.BACK_ALT)
      })

      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('disabled state', () => {
    it('should not handle any keys when disabled', () => {
      const onPlayPause = vi.fn()
      renderHook(() =>
        usePlayerRemoteControl({ enabled: false, onPlayPause })
      )

      act(() => {
        pressKey(PLAYER_KEY_CODES.SPACE)
      })

      expect(onPlayPause).not.toHaveBeenCalled()
    })
  })

  describe('external controlsVisible prop', () => {
    it('should use external controlsVisible when provided', () => {
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...defaultPlayerStore,
        controlsVisible: false, // Store says hidden
      })

      // But external says visible
      renderHook(() =>
        usePlayerRemoteControl({ controlsVisible: true })
      )

      act(() => {
        pressKey(PLAYER_KEY_CODES.UP)
      })

      // Should not change volume because controlsVisible is true
      expect(mockSetVolume).not.toHaveBeenCalled()
    })
  })

  describe('media stop button', () => {
    it('should call onPlayPause when media stop is pressed', () => {
      const onPlayPause = vi.fn()
      renderHook(() => usePlayerRemoteControl({ onPlayPause }))

      act(() => {
        pressKey(PLAYER_KEY_CODES.MEDIA_STOP)
      })

      expect(onPlayPause).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => usePlayerRemoteControl())

      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      unmount()

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      addSpy.mockRestore()
      removeSpy.mockRestore()
    })
  })
})
