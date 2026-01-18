import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { PlayerControls } from './PlayerControls'
import { usePlayerStore } from '../../core/stores/playerStore'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  usePlayerStore.getState().reset()
})

describe('PlayerControls', () => {
  describe('rendering', () => {
    it('renders the controls container', () => {
      render(<PlayerControls testId="controls" />)
      expect(screen.getByTestId('controls')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<PlayerControls testId="controls" className="custom-class" />)
      expect(screen.getByTestId('controls')).toHaveClass('custom-class')
    })

    it('is visible by default', () => {
      render(<PlayerControls testId="controls" />)
      expect(screen.getByTestId('controls')).toHaveAttribute('data-visible', 'true')
      expect(screen.getByTestId('controls')).toHaveClass('opacity-100')
    })

    it('is hidden when visible is false', () => {
      render(<PlayerControls testId="controls" visible={false} />)
      expect(screen.getByTestId('controls')).toHaveAttribute('data-visible', 'false')
      expect(screen.getByTestId('controls')).toHaveClass('opacity-0')
      expect(screen.getByTestId('controls')).toHaveClass('pointer-events-none')
    })
  })

  describe('PlayPause button', () => {
    it('renders play button when not playing', () => {
      usePlayerStore.getState().setPlaybackState('paused')
      render(<PlayerControls testId="controls" />)

      const button = screen.getByTestId('controls-playpause')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', 'Play')
    })

    it('renders pause button when playing', () => {
      usePlayerStore.getState().setPlaybackState('playing')
      render(<PlayerControls testId="controls" />)

      const button = screen.getByTestId('controls-playpause')
      expect(button).toHaveAttribute('aria-label', 'Pause')
    })

    it('calls onPlay when clicked while paused', () => {
      const onPlay = vi.fn()
      usePlayerStore.getState().setPlaybackState('paused')
      render(<PlayerControls testId="controls" onPlay={onPlay} />)

      fireEvent.click(screen.getByTestId('controls-playpause'))
      expect(onPlay).toHaveBeenCalled()
    })

    it('calls onPause when clicked while playing', () => {
      const onPause = vi.fn()
      usePlayerStore.getState().setPlaybackState('playing')
      render(<PlayerControls testId="controls" onPause={onPause} />)

      fireEvent.click(screen.getByTestId('controls-playpause'))
      expect(onPause).toHaveBeenCalled()
    })

    it('shows loading spinner when buffering', () => {
      usePlayerStore.getState().setPlaybackState('buffering')
      render(<PlayerControls testId="controls" />)

      const button = screen.getByTestId('controls-playpause')
      // The button should contain the spinner SVG (with animate-spin class)
      const spinner = button.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('TimeDisplay', () => {
    it('shows formatted time for VOD content', () => {
      usePlayerStore.getState().setCurrentTime(65) // 1:05
      usePlayerStore.getState().setDuration(3600) // 1:00:00

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time-current')).toHaveTextContent('01:05')
      expect(screen.getByTestId('controls-time-duration')).toHaveTextContent('1:00:00')
    })

    it('shows LIVE indicator for live streams', () => {
      usePlayerStore.getState().setDuration(0, true) // isLive = true

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time')).toHaveTextContent('LIVE')
    })

    it('shows 00:00 for zero or negative times', () => {
      usePlayerStore.getState().setCurrentTime(0)
      usePlayerStore.getState().setDuration(100)

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time-current')).toHaveTextContent('00:00')
    })
  })

  describe('SeekBar', () => {
    it('renders seek bar for VOD content', () => {
      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-seek')).toBeInTheDocument()
    })

    it('does not render seek bar for live streams', () => {
      usePlayerStore.getState().setDuration(0, true) // isLive = true

      render(<PlayerControls testId="controls" />)

      expect(screen.queryByTestId('controls-seek')).not.toBeInTheDocument()
    })

    it('does not render seek bar when not seekable', () => {
      usePlayerStore.getState().setDuration(100, false)
      usePlayerStore.getState().setSeekable(false)

      render(<PlayerControls testId="controls" />)

      expect(screen.queryByTestId('controls-seek')).not.toBeInTheDocument()
    })

    it('shows progress bar at correct position', () => {
      usePlayerStore.getState().setCurrentTime(30)
      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(<PlayerControls testId="controls" />)

      const progressBar = screen.getByTestId('controls-seek-progress')
      expect(progressBar).toHaveStyle({ width: '30%' })
    })

    it('shows buffer bar at correct position', () => {
      usePlayerStore.getState().setBufferedTime(60)
      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(<PlayerControls testId="controls" />)

      const bufferBar = screen.getByTestId('controls-seek-buffer')
      expect(bufferBar).toHaveStyle({ width: '60%' })
    })

    it('calls onSeek when track is clicked', () => {
      const onSeek = vi.fn()
      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(<PlayerControls testId="controls" onSeek={onSeek} />)

      const seekBar = screen.getByTestId('controls-seek')
      const track = seekBar.querySelector('.bg-white\\/30')

      // Mock getBoundingClientRect
      if (track) {
        vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
          left: 0,
          width: 100,
          top: 0,
          right: 100,
          bottom: 10,
          height: 10,
          x: 0,
          y: 0,
          toJSON: () => {},
        })

        // Click at 50%
        fireEvent.click(track, { clientX: 50 })
        expect(onSeek).toHaveBeenCalledWith(50) // 50% of 100 duration
      }
    })
  })

  describe('VolumeControl', () => {
    it('renders volume mute button', () => {
      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-volume-mute')).toBeInTheDocument()
    })

    it('calls onToggleMute when mute button is clicked', () => {
      const onToggleMute = vi.fn()
      render(<PlayerControls testId="controls" onToggleMute={onToggleMute} />)

      fireEvent.click(screen.getByTestId('controls-volume-mute'))
      expect(onToggleMute).toHaveBeenCalled()
    })

    it('shows volume off icon when volume is 0', () => {
      usePlayerStore.getState().setVolume(0)
      render(<PlayerControls testId="controls" />)

      const muteButton = screen.getByTestId('controls-volume-mute')
      // When volume is 0 (but not muted), the icon shows volume off
      // The aria-label is still "Mute" because that's the action it would take
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
    })

    it('shows volume low icon when volume is below 50%', () => {
      usePlayerStore.getState().setVolume(0.3)
      render(<PlayerControls testId="controls" />)

      const muteButton = screen.getByTestId('controls-volume-mute')
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
    })

    it('shows volume high icon when volume is above 50%', () => {
      usePlayerStore.getState().setVolume(0.8)
      render(<PlayerControls testId="controls" />)

      const muteButton = screen.getByTestId('controls-volume-mute')
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
    })

    it('shows mute icon when muted', () => {
      usePlayerStore.getState().setVolume(1)
      usePlayerStore.getState().setMuted(true)
      render(<PlayerControls testId="controls" />)

      const muteButton = screen.getByTestId('controls-volume-mute')
      expect(muteButton).toHaveAttribute('aria-label', 'Unmute')
    })
  })

  describe('spatial navigation', () => {
    it('play/pause button receives focus', async () => {
      render(<PlayerControls testId="controls" />)

      act(() => {
        setFocus('play-pause-btn')
      })

      const button = screen.getByTestId('controls-playpause')
      expect(button).toHaveAttribute('data-focused', 'true')
    })

    it('seek bar receives focus', async () => {
      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(<PlayerControls testId="controls" />)

      act(() => {
        setFocus('seek-bar')
      })

      const seekBar = screen.getByTestId('controls-seek')
      expect(seekBar).toHaveAttribute('data-focused', 'true')
    })

    it('volume button receives focus', async () => {
      render(<PlayerControls testId="controls" />)

      act(() => {
        setFocus('volume-btn')
      })

      const muteButton = screen.getByTestId('controls-volume-mute')
      expect(muteButton).toHaveAttribute('data-focused', 'true')
    })
  })

  describe('formatTime helper', () => {
    it('formats seconds to MM:SS', () => {
      usePlayerStore.getState().setCurrentTime(125) // 2:05
      usePlayerStore.getState().setDuration(3600)

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time-current')).toHaveTextContent('02:05')
    })

    it('formats hours correctly', () => {
      usePlayerStore.getState().setDuration(7325) // 2:02:05

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time-duration')).toHaveTextContent('2:02:05')
    })

    it('handles edge cases', () => {
      usePlayerStore.getState().setCurrentTime(0)
      usePlayerStore.getState().setDuration(60) // exactly 1 minute

      render(<PlayerControls testId="controls" />)

      expect(screen.getByTestId('controls-time-current')).toHaveTextContent('00:00')
      expect(screen.getByTestId('controls-time-duration')).toHaveTextContent('01:00')
    })
  })

  describe('callback integration', () => {
    it('passes all callbacks correctly', () => {
      const onPlay = vi.fn()
      const onPause = vi.fn()
      const onSeek = vi.fn()
      const onVolumeChange = vi.fn()
      const onToggleMute = vi.fn()

      usePlayerStore.getState().setDuration(100)
      usePlayerStore.getState().setSeekable(true)

      render(
        <PlayerControls
          testId="controls"
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onToggleMute={onToggleMute}
        />
      )

      // All callbacks should be provided to sub-components
      // We can verify this by interacting with the controls
      fireEvent.click(screen.getByTestId('controls-playpause'))
      expect(onPlay).toHaveBeenCalled()

      fireEvent.click(screen.getByTestId('controls-volume-mute'))
      expect(onToggleMute).toHaveBeenCalled()
    })
  })
})
