import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PlayerOverlay } from './PlayerOverlay'
import { useEPGStore } from '../../core/stores/epgStore'
import type { Channel, Program } from '../../core/types/channel'

const baseTime = new Date('2024-01-15T14:00:00').getTime()
const oneHour = 60 * 60 * 1000

const mockChannel: Channel = {
  id: 'ch-1',
  name: 'News Channel',
  number: 101,
  logo: 'https://example.com/logo.png',
  categoryId: 'cat-1',
  streamUrl: 'http://example.com/stream',
  epgChannelId: 'epg-ch-1',
}

const mockCurrentProgram: Program = {
  id: 'prog-1',
  channelId: 'epg-ch-1',
  title: 'Morning News',
  description: 'Daily morning news update',
  startTime: baseTime,
  endTime: baseTime + oneHour,
}

const mockNextProgram: Program = {
  id: 'prog-2',
  channelId: 'epg-ch-1',
  title: 'Weather Report',
  description: 'Weather forecast',
  startTime: baseTime + oneHour,
  endTime: baseTime + 2 * oneHour,
}

describe('PlayerOverlay', () => {
  beforeEach(() => {
    // Set current time to be during the first program (30 mins in)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T14:30:00'))

    // Reset the EPG store
    useEPGStore.getState().reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders the overlay when channel is provided', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay')).toBeInTheDocument()
    })

    it('does not render when channel is null', () => {
      render(<PlayerOverlay channel={null} testId="overlay" />)

      expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" className="custom-class" />)

      expect(screen.getByTestId('overlay')).toHaveClass('custom-class')
    })

    it('is visible by default', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'true')
      expect(screen.getByTestId('overlay')).toHaveClass('opacity-100')
    })

    it('is hidden when visible is false', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" visible={false} />)

      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'false')
      expect(screen.getByTestId('overlay')).toHaveClass('opacity-0')
      expect(screen.getByTestId('overlay')).toHaveClass('pointer-events-none')
    })
  })

  describe('channel info display', () => {
    it('displays channel name', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-name')).toHaveTextContent('News Channel')
    })

    it('displays channel number when available', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-number')).toHaveTextContent('101')
    })

    it('hides channel number when not available', () => {
      const channelWithoutNumber: Channel = {
        ...mockChannel,
        number: undefined,
      }

      render(<PlayerOverlay channel={channelWithoutNumber} testId="overlay" />)

      expect(screen.queryByTestId('overlay-number')).not.toBeInTheDocument()
    })

    it('displays channel logo', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      const logo = screen.getByTestId('overlay-logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('hides logo when not provided', () => {
      const channelWithoutLogo: Channel = {
        ...mockChannel,
        logo: undefined,
      }

      render(<PlayerOverlay channel={channelWithoutLogo} testId="overlay" />)

      expect(screen.queryByTestId('overlay-logo')).not.toBeInTheDocument()
    })
  })

  describe('current program display', () => {
    it('shows "Now Playing" label', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByText('Now Playing')).toBeInTheDocument()
    })

    it('displays current program title when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-current-title')).toHaveTextContent('Morning News')
    })

    it('shows time range for current program', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      const timeElement = screen.getByTestId('overlay-current-time')
      // The times should be formatted as HH:MM - HH:MM
      expect(timeElement).toBeInTheDocument()
    })

    it('shows remaining time for current program', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      // 30 minutes remaining
      expect(screen.getByTestId('overlay-current-remaining')).toHaveTextContent('30min left')
    })

    it('shows "No program information available" when no current program', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByText('No program information available')).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      const progressBar = screen.getByTestId('overlay-progress')
      expect(progressBar).toBeInTheDocument()
      // 50% progress (30 mins into a 60 min program)
      expect(progressBar).toHaveStyle({ width: '50%' })
    })
  })

  describe('next program display', () => {
    it('displays next program when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-next-title')).toHaveTextContent('Weather Report')
    })

    it('does not show next program section when no next program', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.queryByTestId('overlay-next-program')).not.toBeInTheDocument()
    })

    it('shows "Next:" label', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByText('Next:')).toBeInTheDocument()
    })
  })

  describe('channel ID fallback', () => {
    it('uses epgChannelId when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-current-title')).toHaveTextContent('Morning News')
    })

    it('falls back to channel id when epgChannelId is not set', () => {
      const channelWithoutEpgId: Channel = {
        ...mockChannel,
        epgChannelId: undefined,
      }

      useEPGStore.getState().setProgramsForChannel('ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={channelWithoutEpgId} testId="overlay" />)

      expect(screen.getByTestId('overlay-current-title')).toHaveTextContent('Morning News')
    })
  })

  describe('auto-hide functionality', () => {
    it('auto-hides after specified delay', () => {
      const onVisibilityChange = vi.fn()

      render(
        <PlayerOverlay
          channel={mockChannel}
          testId="overlay"
          autoHideDelay={1000}
          onVisibilityChange={onVisibilityChange}
        />
      )

      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'true')

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1100)
      })

      expect(onVisibilityChange).toHaveBeenCalledWith(false)
      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'false')
    })

    it('does not auto-hide when autoHideDelay is 0', () => {
      const onVisibilityChange = vi.fn()

      render(
        <PlayerOverlay
          channel={mockChannel}
          testId="overlay"
          autoHideDelay={0}
          onVisibilityChange={onVisibilityChange}
        />
      )

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(onVisibilityChange).not.toHaveBeenCalled()
      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'true')
    })

    it('resets auto-hide timer when visible prop changes', () => {
      const onVisibilityChange = vi.fn()

      const { rerender } = render(
        <PlayerOverlay
          channel={mockChannel}
          testId="overlay"
          autoHideDelay={2000}
          visible={true}
          onVisibilityChange={onVisibilityChange}
        />
      )

      // Wait 1 second
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Re-render with same visible prop (simulates user interaction resetting timer)
      rerender(
        <PlayerOverlay
          channel={mockChannel}
          testId="overlay"
          autoHideDelay={2000}
          visible={true}
          onVisibilityChange={onVisibilityChange}
        />
      )

      // Wait another 1.5 seconds (total 2.5 seconds from start)
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // Should have hidden by now (original timer would have fired at 2s)
      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'false')
    })

    it('does not auto-hide when not visible', () => {
      const onVisibilityChange = vi.fn()

      render(
        <PlayerOverlay
          channel={mockChannel}
          testId="overlay"
          autoHideDelay={1000}
          visible={false}
          onVisibilityChange={onVisibilityChange}
        />
      )

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should not have called onVisibilityChange because overlay was already hidden
      expect(onVisibilityChange).not.toHaveBeenCalled()
    })
  })

  describe('visibility sync', () => {
    it('syncs with external visible prop changes', () => {
      const { rerender } = render(
        <PlayerOverlay channel={mockChannel} testId="overlay" visible={true} />
      )

      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'true')

      rerender(<PlayerOverlay channel={mockChannel} testId="overlay" visible={false} />)

      expect(screen.getByTestId('overlay')).toHaveAttribute('data-visible', 'false')
    })
  })

  describe('time formatting', () => {
    it('handles hours remaining time', () => {
      // Set time to the start of a 3-hour program
      vi.setSystemTime(new Date('2024-01-15T14:00:00'))

      const longProgram: Program = {
        ...mockCurrentProgram,
        endTime: baseTime + 3 * oneHour,
      }

      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [longProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      // 3 hours remaining
      expect(screen.getByTestId('overlay-current-remaining')).toHaveTextContent('3h 0min left')
    })

    it('handles ISO string times', () => {
      const programWithISOTime: Program = {
        ...mockCurrentProgram,
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T15:00:00Z',
      }

      // Adjust time to be during the program considering timezone
      vi.setSystemTime(new Date('2024-01-15T14:30:00Z'))

      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [programWithISOTime])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-current-title')).toHaveTextContent('Morning News')
    })

    it('shows "Ending" when program is about to end', () => {
      // Set time to just before end
      vi.setSystemTime(new Date(baseTime + oneHour + 1000))

      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      // Program has ended, so no current program should be found
      expect(screen.getByText('No program information available')).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay')).toBeInTheDocument()
    })

    it('applies testId to current program section', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-current-program')).toBeInTheDocument()
    })

    it('applies testId to next program section', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      expect(screen.getByTestId('overlay-next-program')).toBeInTheDocument()
    })
  })

  describe('progress calculation', () => {
    it('shows 0% progress at program start', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'))

      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      const progressBar = screen.getByTestId('overlay-progress')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('shows 100% progress at program end', () => {
      // Set time to just before the program ends
      vi.setSystemTime(new Date(baseTime + oneHour - 1000))

      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<PlayerOverlay channel={mockChannel} testId="overlay" />)

      const progressBar = screen.getByTestId('overlay-progress')
      // Should be very close to 100%
      const widthMatch = progressBar.style.width.match(/(\d+(?:\.\d+)?)%/)
      expect(widthMatch).toBeTruthy()
      expect(parseFloat(widthMatch![1])).toBeGreaterThan(99)
    })
  })
})
