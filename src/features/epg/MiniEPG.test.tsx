import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MiniEPG } from './MiniEPG'
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

describe('MiniEPG', () => {
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
    it('renders the component', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByTestId('mini-epg')).toBeInTheDocument()
    })

    it('displays channel name', () => {
      render(<MiniEPG channel={mockChannel} />)

      expect(screen.getByText('News Channel')).toBeInTheDocument()
    })

    it('displays channel number when available', () => {
      render(<MiniEPG channel={mockChannel} />)

      expect(screen.getByText('101.')).toBeInTheDocument()
    })

    it('hides channel number when not available', () => {
      const channelWithoutNumber: Channel = {
        ...mockChannel,
        number: undefined,
      }

      render(<MiniEPG channel={channelWithoutNumber} />)

      expect(screen.queryByText('.')).not.toBeInTheDocument()
    })

    it('displays channel logo', () => {
      render(<MiniEPG channel={mockChannel} />)

      const logo = screen.getByAltText('News Channel')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('hides logo when not provided', () => {
      const channelWithoutLogo: Channel = {
        ...mockChannel,
        logo: undefined,
      }

      render(<MiniEPG channel={channelWithoutLogo} />)

      expect(screen.queryByAltText('News Channel')).not.toBeInTheDocument()
    })
  })

  describe('now playing section', () => {
    it('shows "Now" label', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Now')).toBeInTheDocument()
    })

    it('displays current program when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Morning News')).toBeInTheDocument()
    })

    it('shows remaining time for current program', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      // 30 minutes remaining
      expect(screen.getByText('30min left')).toBeInTheDocument()
    })

    it('shows "No program info available" when no current program', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('No program info available')).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      const progressBar = screen.getByTestId('mini-epg-progress')
      expect(progressBar).toBeInTheDocument()
      // 50% progress (30 mins into a 60 min program)
      expect(progressBar).toHaveStyle({ width: '50%' })
    })
  })

  describe('next program section', () => {
    it('shows "Next" label', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('displays next program when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [
        mockCurrentProgram,
        mockNextProgram,
      ])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Weather Report')).toBeInTheDocument()
    })

    it('shows "No upcoming program" when no next program', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('No upcoming program')).toBeInTheDocument()
    })
  })

  describe('channel ID fallback', () => {
    it('uses epgChannelId when available', () => {
      useEPGStore.getState().setProgramsForChannel('epg-ch-1', [mockCurrentProgram])

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Morning News')).toBeInTheDocument()
    })

    it('falls back to channel id when epgChannelId is not set', () => {
      const channelWithoutEpgId: Channel = {
        ...mockChannel,
        epgChannelId: undefined,
      }

      useEPGStore.getState().setProgramsForChannel('ch-1', [mockCurrentProgram])

      render(<MiniEPG channel={channelWithoutEpgId} testId="mini-epg" />)

      expect(screen.getByText('Morning News')).toBeInTheDocument()
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

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      // 3 hours remaining
      expect(screen.getByText('3h 0min left')).toBeInTheDocument()
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

      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByText('Morning News')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      render(<MiniEPG channel={mockChannel} className="custom-class" testId="mini-epg" />)

      const container = screen.getByTestId('mini-epg')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByTestId('mini-epg')).toBeInTheDocument()
    })

    it('applies testId to now section', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByTestId('mini-epg-now')).toBeInTheDocument()
    })

    it('applies testId to next section', () => {
      render(<MiniEPG channel={mockChannel} testId="mini-epg" />)

      expect(screen.getByTestId('mini-epg-next')).toBeInTheDocument()
    })
  })
})
