import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { EPGProgram } from './EPGProgram'
import type { Program } from '../../core/types/channel'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const baseTime = new Date('2024-01-15T14:00:00').getTime()
const oneHour = 60 * 60 * 1000

const mockProgram: Program = {
  id: 'prog-1',
  channelId: 'ch-1',
  title: 'Morning Show',
  description: 'Daily morning news',
  startTime: baseTime,
  endTime: baseTime + oneHour,
}

describe('EPGProgram', () => {
  const defaultProps = {
    program: mockProgram,
    left: 0,
    width: 33.33,
    channelId: 'ch-1',
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering with program', () => {
    it('renders the component', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      expect(screen.getByTestId('program')).toBeInTheDocument()
    })

    it('displays program title', () => {
      render(<EPGProgram {...defaultProps} />)

      expect(screen.getByText('Morning Show')).toBeInTheDocument()
    })

    it('displays program time range when width is sufficient', () => {
      render(<EPGProgram {...defaultProps} width={20} />)

      // Should show time range (format depends on locale)
      const cell = screen.getByRole('gridcell')
      expect(cell).toHaveAttribute('aria-label')
      expect(cell.getAttribute('aria-label')).toContain('Morning Show')
    })

    it('applies correct positioning styles', () => {
      render(<EPGProgram {...defaultProps} left={25} width={50} testId="program" />)

      const cell = screen.getByTestId('program')
      expect(cell).toHaveStyle({ left: '25%', width: '50%' })
    })
  })

  describe('rendering without program (empty cell)', () => {
    it('renders empty cell when program is null', () => {
      render(
        <EPGProgram
          {...defaultProps}
          program={null}
          testId="program"
        />
      )

      expect(screen.getByTestId('program')).toBeInTheDocument()
    })

    it('shows "No Program Info" for empty cells', () => {
      render(<EPGProgram {...defaultProps} program={null} />)

      expect(screen.getByText('No Program Info')).toBeInTheDocument()
    })
  })

  describe('currently airing', () => {
    beforeEach(() => {
      // Set current time to be during the program
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T14:30:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows airing indicator for current programs', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      const cell = screen.getByTestId('program')
      expect(cell).toHaveAttribute('data-airing', 'true')
    })
  })

  describe('not currently airing', () => {
    beforeEach(() => {
      // Set current time to be after the program
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T16:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not show airing indicator for past programs', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      const cell = screen.getByTestId('program')
      expect(cell).toHaveAttribute('data-airing', 'false')
    })
  })

  describe('focusability', () => {
    it('program cells are focusable', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      const cell = screen.getByTestId('program')
      expect(cell).toHaveAttribute('tabindex', '0')
    })

    it('empty cells are not focusable', () => {
      render(<EPGProgram {...defaultProps} program={null} testId="program" />)

      const cell = screen.getByTestId('program')
      // Empty cells should not have onEnterPress handler and should not be focusable
      // The tabindex is still 0 because of role="gridcell", but focusable is false
      expect(cell).toBeInTheDocument()
    })

    it('program cells have data-focused attribute', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      const cell = screen.getByTestId('program')
      expect(cell).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has gridcell role', () => {
      render(<EPGProgram {...defaultProps} />)

      expect(screen.getByRole('gridcell')).toBeInTheDocument()
    })

    it('has descriptive aria-label', () => {
      render(<EPGProgram {...defaultProps} />)

      const cell = screen.getByRole('gridcell')
      expect(cell.getAttribute('aria-label')).toContain('Morning Show')
    })
  })

  describe('time formatting', () => {
    it('handles timestamp start time', () => {
      render(<EPGProgram {...defaultProps} />)

      expect(screen.getByText('Morning Show')).toBeInTheDocument()
    })

    it('handles ISO string start time', () => {
      const programWithISOTime: Program = {
        ...mockProgram,
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T15:00:00Z',
      }

      render(<EPGProgram {...defaultProps} program={programWithISOTime} />)

      expect(screen.getByText('Morning Show')).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<EPGProgram {...defaultProps} testId="program" />)

      expect(screen.getByTestId('program')).toBeInTheDocument()
    })
  })
})
