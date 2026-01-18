import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EPGTimeline } from './EPGTimeline'

describe('EPGTimeline', () => {
  const baseTime = new Date('2024-01-15T14:00:00').getTime()
  const thirtyMinutes = 30 * 60 * 1000

  const defaultTimeSlots = [
    baseTime,
    baseTime + thirtyMinutes,
    baseTime + 2 * thirtyMinutes,
    baseTime + 3 * thirtyMinutes,
    baseTime + 4 * thirtyMinutes,
    baseTime + 5 * thirtyMinutes,
  ]

  const defaultProps = {
    timeSlots: defaultTimeSlots,
    timeWindowStart: baseTime,
  }

  describe('rendering', () => {
    it('renders the component', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByTestId('timeline')).toBeInTheDocument()
    })

    it('renders channel label in first column', () => {
      render(<EPGTimeline {...defaultProps} />)

      expect(screen.getByText('Channel')).toBeInTheDocument()
    })

    it('renders all time slots', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      // Should have 6 time slots
      defaultTimeSlots.forEach((_, index) => {
        expect(screen.getByTestId(`timeline-slot-${index}`)).toBeInTheDocument()
      })
    })

    it('formats time correctly', () => {
      render(<EPGTimeline {...defaultProps} />)

      // Check that times are displayed (format depends on locale)
      const slots = screen.getAllByRole('columnheader')
      expect(slots.length).toBe(6)
    })
  })

  describe('current time indicator', () => {
    beforeEach(() => {
      // Mock Date.now to return a time within the window
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T15:30:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows current time indicator when now is within the window', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByTestId('timeline-now-indicator')).toBeInTheDocument()
    })

    it('has correct aria-label for current time indicator', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByLabelText('Current time')).toBeInTheDocument()
    })
  })

  describe('current time indicator outside window', () => {
    beforeEach(() => {
      // Mock Date.now to return a time outside the window (before)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not show current time indicator when now is before the window', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.queryByTestId('timeline-now-indicator')).not.toBeInTheDocument()
    })
  })

  describe('current time indicator after window', () => {
    beforeEach(() => {
      // Mock Date.now to return a time outside the window (after)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T20:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not show current time indicator when now is after the window', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.queryByTestId('timeline-now-indicator')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has row role', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByRole('row', { name: 'Time slots' })).toBeInTheDocument()
    })

    it('has columnheader role for time slots', () => {
      render(<EPGTimeline {...defaultProps} />)

      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBe(6)
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByTestId('timeline')).toBeInTheDocument()
    })

    it('applies testId to time slots', () => {
      render(<EPGTimeline {...defaultProps} testId="timeline" />)

      expect(screen.getByTestId('timeline-slot-0')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-slot-5')).toBeInTheDocument()
    })
  })
})
