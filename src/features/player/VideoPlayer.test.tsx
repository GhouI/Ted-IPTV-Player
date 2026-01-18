import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { VideoPlayer } from './VideoPlayer'
import { useVideoPlayerControls } from './useVideoPlayerControls'
import { usePlayerStore } from '../../core/stores/playerStore'
import * as PlayerFactory from '../../core/player/PlayerFactory'
import type { PlayerAdapter, PlayerState, PlayerEventListener } from '../../core/types/player'

// Mock the PlayerFactory module
vi.mock('../../core/player/PlayerFactory', () => ({
  createPlayer: vi.fn(),
}))

// Create a mock player adapter
function createMockPlayerAdapter(): PlayerAdapter & {
  eventListeners: Map<string, PlayerEventListener[]>
  triggerEvent: (event: Parameters<PlayerEventListener>[0]) => void
} {
  const eventListeners = new Map<string, PlayerEventListener[]>()

  const mockState: PlayerState = {
    playbackState: 'idle',
    currentTime: 0,
    duration: 0,
    bufferedTime: 0,
    volume: 1,
    isMuted: false,
    isLive: false,
    isSeekable: true,
    currentUrl: null,
    streamType: 'unknown',
    qualityTracks: [],
    selectedQuality: null,
    isAutoQuality: true,
    audioTracks: [],
    selectedAudioTrack: null,
    subtitleTracks: [],
    selectedSubtitleTrack: null,
    error: null,
  }

  return {
    eventListeners,
    initialize: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    setQuality: vi.fn(),
    setAudioTrack: vi.fn(),
    setSubtitleTrack: vi.fn(),
    getState: vi.fn().mockReturnValue(mockState),
    addEventListener: vi.fn((type: string, listener: PlayerEventListener) => {
      const listeners = eventListeners.get(type) || []
      listeners.push(listener)
      eventListeners.set(type, listeners)
    }),
    removeEventListener: vi.fn((type: string, listener: PlayerEventListener) => {
      const listeners = eventListeners.get(type) || []
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    triggerEvent: (event) => {
      const listeners = eventListeners.get(event.type) || []
      listeners.forEach((listener) => listener(event))
    },
  }
}

describe('VideoPlayer', () => {
  let mockPlayer: ReturnType<typeof createMockPlayerAdapter>

  beforeEach(() => {
    mockPlayer = createMockPlayerAdapter()

    vi.mocked(PlayerFactory.createPlayer).mockResolvedValue({
      player: mockPlayer,
      type: 'shaka',
      capabilities: {
        mse: true,
        eme: true,
        hls: true,
        dash: true,
        nativeVideo: true,
        supportedVideoCodecs: ['avc1.42E01E'],
        supportedAudioCodecs: ['mp4a.40.2'],
      },
    })

    // Reset the player store
    usePlayerStore.getState().reset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders video element', async () => {
      render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        expect(screen.getByTestId('player-video')).toBeInTheDocument()
      })
    })

    it('renders container with correct class', async () => {
      render(<VideoPlayer testId="player" className="custom-class" />)

      await waitFor(() => {
        const container = screen.getByTestId('player')
        expect(container).toHaveClass('custom-class')
      })
    })

    it('sets data attributes for player type and state', async () => {
      render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        const container = screen.getByTestId('player')
        expect(container).toHaveAttribute('data-player-type', 'shaka')
        expect(container).toHaveAttribute('data-initialized', 'true')
      })
    })

    it('hides video when visible is false', async () => {
      render(<VideoPlayer testId="player" visible={false} />)

      await waitFor(() => {
        const container = screen.getByTestId('player')
        expect(container).toHaveClass('opacity-0')
        expect(container).toHaveClass('pointer-events-none')
      })
    })
  })

  describe('initialization', () => {
    it('creates player on mount', async () => {
      render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        expect(PlayerFactory.createPlayer).toHaveBeenCalledWith({
          playerType: 'auto',
          streamUrl: undefined,
          config: undefined,
        })
      })
    })

    it('initializes player with video element', async () => {
      render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        expect(mockPlayer.initialize).toHaveBeenCalledWith(
          expect.any(HTMLVideoElement),
          undefined
        )
      })
    })

    it('passes config to player creation', async () => {
      const config = { bufferSize: 60, autoPlay: true }
      render(<VideoPlayer testId="player" config={config} />)

      await waitFor(() => {
        expect(PlayerFactory.createPlayer).toHaveBeenCalledWith({
          playerType: 'auto',
          streamUrl: undefined,
          config,
        })
      })
    })

    it('subscribes to player events', async () => {
      render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalledWith('statechange', expect.any(Function))
        expect(mockPlayer.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function))
        expect(mockPlayer.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
        expect(mockPlayer.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
      })
    })
  })

  describe('source loading', () => {
    it('loads source when provided', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        expect(mockPlayer.load).toHaveBeenCalledWith('https://example.com/stream.m3u8', false)
      })
    })

    it('loads source with autoPlay when specified', async () => {
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          autoPlay
        />
      )

      await waitFor(() => {
        expect(mockPlayer.load).toHaveBeenCalledWith('https://example.com/stream.m3u8', true)
      })
    })

    it('updates store with current URL', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        const state = usePlayerStore.getState()
        expect(state.currentUrl).toBe('https://example.com/stream.m3u8')
      })
    })
  })

  describe('event handling', () => {
    it('syncs statechange events to store', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'statechange',
          timestamp: Date.now(),
          previousState: 'loading',
          newState: 'playing',
        })
      })

      const state = usePlayerStore.getState()
      expect(state.playbackState).toBe('playing')
    })

    it('calls onPlay callback when playback starts', async () => {
      const onPlay = vi.fn()
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onPlay={onPlay}
        />
      )

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'statechange',
          timestamp: Date.now(),
          previousState: 'loading',
          newState: 'playing',
        })
      })

      expect(onPlay).toHaveBeenCalled()
    })

    it('calls onPause callback when playback pauses', async () => {
      const onPause = vi.fn()
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onPause={onPause}
        />
      )

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'statechange',
          timestamp: Date.now(),
          previousState: 'playing',
          newState: 'paused',
        })
      })

      expect(onPause).toHaveBeenCalled()
    })

    it('syncs timeupdate events to store', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'timeupdate',
          timestamp: Date.now(),
          currentTime: 45.5,
          bufferedTime: 60,
        })
      })

      const state = usePlayerStore.getState()
      expect(state.currentTime).toBe(45.5)
      expect(state.bufferedTime).toBe(60)
    })

    it('syncs durationchange events to store', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'durationchange',
          timestamp: Date.now(),
          duration: 3600,
          isLive: false,
        })
      })

      const state = usePlayerStore.getState()
      expect(state.duration).toBe(3600)
      expect(state.isLive).toBe(false)
      expect(state.isSeekable).toBe(true)
    })

    it('syncs volumechange events to store', async () => {
      render(<VideoPlayer testId="player" src="https://example.com/stream.m3u8" />)

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'volumechange',
          timestamp: Date.now(),
          volume: 0.5,
          isMuted: false,
        })
      })

      const state = usePlayerStore.getState()
      expect(state.volume).toBe(0.5)
      expect(state.isMuted).toBe(false)
    })

    it('syncs tracksloaded events to store', async () => {
      const onReady = vi.fn()
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onReady={onReady}
        />
      )

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      const qualityTracks = [
        { id: '1080p', label: '1080p', height: 1080, width: 1920, bitrate: 5000000 },
      ]
      const audioTracks = [
        { id: 'en', label: 'English', language: 'en' },
      ]
      const subtitleTracks = [
        { id: 'en-cc', label: 'English CC', language: 'en', isClosedCaption: true },
      ]

      act(() => {
        mockPlayer.triggerEvent({
          type: 'tracksloaded',
          timestamp: Date.now(),
          qualityTracks,
          audioTracks,
          subtitleTracks,
        })
      })

      const state = usePlayerStore.getState()
      expect(state.qualityTracks).toEqual(qualityTracks)
      expect(state.audioTracks).toEqual(audioTracks)
      expect(state.subtitleTracks).toEqual(subtitleTracks)
      expect(onReady).toHaveBeenCalled()
    })

    it('calls onEnded callback when playback ends', async () => {
      const onEnded = vi.fn()
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onEnded={onEnded}
        />
      )

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'ended',
          timestamp: Date.now(),
        })
      })

      expect(onEnded).toHaveBeenCalled()
    })

    it('handles error events', async () => {
      const onError = vi.fn()
      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onError={onError}
        />
      )

      await waitFor(() => {
        expect(mockPlayer.addEventListener).toHaveBeenCalled()
      })

      act(() => {
        mockPlayer.triggerEvent({
          type: 'error',
          timestamp: Date.now(),
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred',
            recoverable: true,
            timestamp: Date.now(),
          },
        })
      })

      const state = usePlayerStore.getState()
      expect(state.error).toBeDefined()
      expect(state.error?.code).toBe('NETWORK_ERROR')
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('cleanup', () => {
    it('destroys player on unmount', async () => {
      const { unmount } = render(<VideoPlayer testId="player" />)

      await waitFor(() => {
        expect(mockPlayer.initialize).toHaveBeenCalled()
      })

      unmount()

      expect(mockPlayer.destroy).toHaveBeenCalled()
    })

    it('resets store on unmount', async () => {
      const { unmount } = render(
        <VideoPlayer testId="player" src="https://example.com/stream.m3u8" />
      )

      await waitFor(() => {
        expect(mockPlayer.load).toHaveBeenCalled()
      })

      // Simulate state changes
      act(() => {
        mockPlayer.triggerEvent({
          type: 'timeupdate',
          timestamp: Date.now(),
          currentTime: 100,
          bufferedTime: 120,
        })
      })

      unmount()

      const state = usePlayerStore.getState()
      expect(state.currentTime).toBe(0)
      expect(state.currentUrl).toBeNull()
    })
  })

  describe('error handling', () => {
    it('handles initialization error', async () => {
      const onError = vi.fn()
      vi.mocked(PlayerFactory.createPlayer).mockRejectedValue(
        new Error('Failed to initialize')
      )

      render(<VideoPlayer testId="player" onError={onError} />)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })

      const state = usePlayerStore.getState()
      expect(state.error).toBeDefined()
      expect(state.error?.message).toBe('Failed to initialize')
    })

    it('handles load error', async () => {
      const onError = vi.fn()
      mockPlayer.load = vi.fn().mockRejectedValue(new Error('Failed to load stream'))

      render(
        <VideoPlayer
          testId="player"
          src="https://example.com/stream.m3u8"
          onError={onError}
        />
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })

      const state = usePlayerStore.getState()
      expect(state.error).toBeDefined()
    })
  })
})

describe('useVideoPlayerControls', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset()
  })

  it('returns current playback state', () => {
    usePlayerStore.getState().setPlaybackState('playing')

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="state">{controls.playbackState}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('state')).toHaveTextContent('playing')
  })

  it('returns computed isPlaying value', () => {
    usePlayerStore.getState().setPlaybackState('playing')

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="playing">{controls.isPlaying ? 'yes' : 'no'}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('playing')).toHaveTextContent('yes')
  })

  it('returns computed isBuffering value', () => {
    usePlayerStore.getState().setPlaybackState('buffering')

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="buffering">{controls.isBuffering ? 'yes' : 'no'}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('buffering')).toHaveTextContent('yes')
  })

  it('returns progress percent', () => {
    usePlayerStore.getState().setCurrentTime(30)
    usePlayerStore.getState().setDuration(100)

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="progress">{controls.progressPercent}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('progress')).toHaveTextContent('30')
  })

  it('returns volume percent', () => {
    usePlayerStore.getState().setVolume(0.5)

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="volume">{controls.volumePercent}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('volume')).toHaveTextContent('50')
  })

  it('returns quality label', () => {
    usePlayerStore.getState().setQualityTracks([
      { id: '1080p', label: '1080p', height: 1080, width: 1920, bitrate: 5000000 },
    ])
    usePlayerStore.getState().selectQuality({
      id: '1080p',
      label: '1080p',
      height: 1080,
      width: 1920,
      bitrate: 5000000,
    })

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="quality">{controls.qualityLabel}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('quality')).toHaveTextContent('1080p')
  })

  it('returns Auto when auto quality is enabled', () => {
    usePlayerStore.getState().enableAutoQuality()

    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return <div data-testid="quality">{controls.qualityLabel}</div>
    }

    render(<TestComponent />)
    expect(screen.getByTestId('quality')).toHaveTextContent('Auto')
  })

  it('provides toggleMute action', () => {
    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return (
        <button onClick={controls.toggleMute} data-testid="mute-btn">
          {controls.isMuted ? 'Unmute' : 'Mute'}
        </button>
      )
    }

    render(<TestComponent />)

    // Initial state - not muted
    expect(screen.getByTestId('mute-btn')).toHaveTextContent('Mute')

    // Toggle mute
    act(() => {
      screen.getByTestId('mute-btn').click()
    })

    expect(screen.getByTestId('mute-btn')).toHaveTextContent('Unmute')
  })

  it('provides showControls and hideControls actions', () => {
    const TestComponent = () => {
      const controls = useVideoPlayerControls()
      return (
        <div>
          <span data-testid="visible">{controls.controlsVisible ? 'yes' : 'no'}</span>
          <button onClick={controls.hideControls} data-testid="hide">Hide</button>
          <button onClick={controls.showControls} data-testid="show">Show</button>
        </div>
      )
    }

    render(<TestComponent />)

    // Initial state - visible
    expect(screen.getByTestId('visible')).toHaveTextContent('yes')

    // Hide controls
    act(() => {
      screen.getByTestId('hide').click()
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('no')

    // Show controls
    act(() => {
      screen.getByTestId('show').click()
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('yes')
  })
})
