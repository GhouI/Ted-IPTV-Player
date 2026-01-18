import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { EPGGrid } from './EPGGrid'
import type { Channel, Program } from '../../core/types/channel'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    name: 'Sports Channel',
    number: 1,
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/sports',
    epgChannelId: 'epg-ch-1',
    isAvailable: true,
  },
  {
    id: 'ch-2',
    name: 'News Network',
    number: 2,
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/news',
    epgChannelId: 'epg-ch-2',
    isAvailable: true,
  },
]

const baseTime = new Date('2024-01-15T14:00:00').getTime()
const oneHour = 60 * 60 * 1000
const threeHours = 3 * oneHour

const mockPrograms: Record<string, Program[]> = {
  'epg-ch-1': [
    {
      id: 'prog-1',
      channelId: 'epg-ch-1',
      title: 'Morning Show',
      description: 'Daily morning news',
      startTime: baseTime,
      endTime: baseTime + oneHour,
    },
    {
      id: 'prog-2',
      channelId: 'epg-ch-1',
      title: 'Afternoon Sports',
      startTime: baseTime + oneHour,
      endTime: baseTime + 2 * oneHour,
    },
  ],
  'epg-ch-2': [
    {
      id: 'prog-3',
      channelId: 'epg-ch-2',
      title: 'Breaking News',
      startTime: baseTime,
      endTime: baseTime + 30 * 60 * 1000,
    },
  ],
}

describe('EPGGrid', () => {
  const defaultProps = {
    channels: mockChannels,
    programs: mockPrograms,
    timeWindowStart: baseTime,
    timeWindowEnd: baseTime + threeHours,
    onProgramSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the component', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByTestId('grid')).toBeInTheDocument()
    })

    it('renders rows for each channel', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByTestId('grid-row-0')).toBeInTheDocument()
      expect(screen.getByTestId('grid-row-1')).toBeInTheDocument()
    })

    it('displays program titles', () => {
      render(<EPGGrid {...defaultProps} />)

      expect(screen.getByText('Morning Show')).toBeInTheDocument()
      expect(screen.getByText('Afternoon Sports')).toBeInTheDocument()
      expect(screen.getByText('Breaking News')).toBeInTheDocument()
    })
  })

  describe('program positioning', () => {
    it('renders programs as grid cells', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      const cells = screen.getAllByRole('gridcell')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('fills gaps with no program info cells', () => {
      render(<EPGGrid {...defaultProps} />)

      // Channel 2 has a gap after "Breaking News" (30 min program in 3 hour window)
      expect(screen.getAllByText('No Program Info').length).toBeGreaterThan(0)
    })
  })

  describe('empty programs', () => {
    it('shows empty cells when channel has no programs', () => {
      const propsWithoutPrograms = {
        ...defaultProps,
        programs: {},
      }

      render(<EPGGrid {...propsWithoutPrograms} />)

      // Should show "No Program Info" for all cells
      const emptyTexts = screen.getAllByText('No Program Info')
      expect(emptyTexts.length).toBe(2) // One for each channel
    })
  })

  describe('partial programs', () => {
    it('handles programs that start before the time window', () => {
      const programsWithEarlyStart: Record<string, Program[]> = {
        'epg-ch-1': [
          {
            id: 'prog-early',
            channelId: 'epg-ch-1',
            title: 'Early Program',
            startTime: baseTime - oneHour, // Starts 1 hour before window
            endTime: baseTime + oneHour, // Ends 1 hour into window
          },
        ],
      }

      render(
        <EPGGrid
          {...defaultProps}
          programs={programsWithEarlyStart}
        />
      )

      expect(screen.getByText('Early Program')).toBeInTheDocument()
    })

    it('handles programs that end after the time window', () => {
      const programsWithLateEnd: Record<string, Program[]> = {
        'epg-ch-1': [
          {
            id: 'prog-late',
            channelId: 'epg-ch-1',
            title: 'Late Program',
            startTime: baseTime + 2 * oneHour, // Starts 2 hours into window
            endTime: baseTime + 4 * oneHour, // Ends 1 hour after window
          },
        ],
      }

      render(
        <EPGGrid
          {...defaultProps}
          programs={programsWithLateEnd}
        />
      )

      expect(screen.getByText('Late Program')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has grid role', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByRole('grid', { name: 'Program guide' })).toBeInTheDocument()
    })

    it('has row role for channel rows', () => {
      render(<EPGGrid {...defaultProps} />)

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(2)
    })

    it('has gridcell role for program cells', () => {
      render(<EPGGrid {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByTestId('grid')).toBeInTheDocument()
    })

    it('applies testId to rows', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByTestId('grid-row-0')).toBeInTheDocument()
      expect(screen.getByTestId('grid-row-1')).toBeInTheDocument()
    })

    it('applies testId to cells', () => {
      render(<EPGGrid {...defaultProps} testId="grid" />)

      expect(screen.getByTestId('grid-row-0-cell-0')).toBeInTheDocument()
    })
  })
})
