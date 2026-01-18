import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { ProgramDetails } from './ProgramDetails'
import type { Program } from '../../core/types/channel'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

// Create a mock program that is currently airing
function createCurrentProgram(overrides: Partial<Program> = {}): Program {
  const now = Date.now()
  return {
    id: 'program-1',
    channelId: 'channel-1',
    title: 'Test Program',
    description: 'A test program description that is interesting.',
    startTime: now - 30 * 60 * 1000, // 30 minutes ago
    endTime: now + 30 * 60 * 1000, // 30 minutes from now
    category: 'Entertainment',
    rating: 'TV-14',
    image: 'http://example.com/program.jpg',
    seasonNumber: 2,
    episodeNumber: 5,
    ...overrides,
  }
}

// Create a mock program that has already aired
function createPastProgram(overrides: Partial<Program> = {}): Program {
  const now = Date.now()
  return {
    id: 'program-2',
    channelId: 'channel-1',
    title: 'Past Program',
    description: 'A program that has already finished.',
    startTime: now - 120 * 60 * 1000, // 2 hours ago
    endTime: now - 60 * 60 * 1000, // 1 hour ago
    category: 'Drama',
    ...overrides,
  }
}

// Create a mock program scheduled for the future
function createFutureProgram(overrides: Partial<Program> = {}): Program {
  const now = Date.now()
  return {
    id: 'program-3',
    channelId: 'channel-1',
    title: 'Future Program',
    description: 'A program that will air later.',
    startTime: now + 60 * 60 * 1000, // 1 hour from now
    endTime: now + 120 * 60 * 1000, // 2 hours from now
    category: 'News',
    ...overrides,
  }
}

describe('ProgramDetails', () => {
  const defaultProps = {
    program: createCurrentProgram(),
    isOpen: true,
    onClose: vi.fn(),
    onWatch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-18T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering when open', () => {
    it('renders the modal when isOpen is true', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details')).toBeInTheDocument()
    })

    it('renders program title', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} />)
      expect(screen.getByText('Test Program')).toBeInTheDocument()
    })

    it('renders program description', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} />)
      expect(screen.getByText(/A test program description/)).toBeInTheDocument()
    })

    it('renders category when available', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} />)
      expect(screen.getByText('Entertainment')).toBeInTheDocument()
    })

    it('renders rating badge when available', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} />)
      expect(screen.getByText('TV-14')).toBeInTheDocument()
    })

    it('renders season and episode info when available', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} />)
      expect(screen.getByText('S2 E5')).toBeInTheDocument()
    })

    it('renders close button', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-close-btn')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  describe('rendering when closed', () => {
    it('does not render when isOpen is false', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} isOpen={false} testId="program-details" />)
      expect(screen.queryByTestId('program-details')).not.toBeInTheDocument()
    })
  })

  describe('currently airing programs', () => {
    it('shows LIVE NOW badge for currently airing programs', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByText('LIVE NOW')).toBeInTheDocument()
    })

    it('shows progress bar for currently airing programs', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-progress')).toBeInTheDocument()
    })

    it('shows watch button for currently airing programs when onWatch is provided', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-watch-btn')).toBeInTheDocument()
      expect(screen.getByText('Watch Now')).toBeInTheDocument()
    })

    it('does not show watch button when onWatch is not provided', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          onWatch={undefined}
          testId="program-details"
        />
      )
      expect(screen.queryByTestId('program-details-watch-btn')).not.toBeInTheDocument()
    })
  })

  describe('past programs', () => {
    it('does not show LIVE NOW badge for past programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createPastProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByText('LIVE NOW')).not.toBeInTheDocument()
    })

    it('does not show progress bar for past programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createPastProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByTestId('program-details-progress')).not.toBeInTheDocument()
    })

    it('does not show watch button for past programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createPastProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByTestId('program-details-watch-btn')).not.toBeInTheDocument()
    })
  })

  describe('future programs', () => {
    it('does not show LIVE NOW badge for future programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createFutureProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByText('LIVE NOW')).not.toBeInTheDocument()
    })

    it('does not show progress bar for future programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createFutureProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByTestId('program-details-progress')).not.toBeInTheDocument()
    })

    it('does not show watch button for future programs', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={createFutureProgram()}
          testId="program-details"
        />
      )
      expect(screen.queryByTestId('program-details-watch-btn')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onWatch when watch button is clicked', () => {
      vi.useRealTimers()
      const program = createCurrentProgram()
      render(
        <ProgramDetails
          {...defaultProps}
          program={program}
          testId="program-details"
        />
      )

      fireEvent.click(screen.getByTestId('program-details-watch-btn'))
      expect(defaultProps.onWatch).toHaveBeenCalledWith(program)
    })

    it('calls onClose when close button is clicked', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)

      fireEvent.click(screen.getByTestId('program-details-close-btn'))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)

      fireEvent.click(screen.getByTestId('program-details-backdrop'))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Backspace key is pressed', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)

      fireEvent.keyDown(window, { key: 'Backspace' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details')).toHaveAttribute('role', 'dialog')
    })

    it('has aria-modal attribute', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details')).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details')).toHaveAttribute(
        'aria-labelledby',
        'program-details-title'
      )
    })

    it('close button is focusable', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-close-btn')).toHaveAttribute('tabindex', '0')
    })

    it('watch button is focusable when present', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-watch-btn')).toHaveAttribute('tabindex', '0')
    })
  })

  describe('minimal program data', () => {
    const minimalProgram: Program = {
      id: 'program-minimal',
      channelId: 'channel-1',
      title: 'Minimal Program',
      startTime: Date.now() - 30 * 60 * 1000,
      endTime: Date.now() + 30 * 60 * 1000,
    }

    it('renders with minimal data', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={minimalProgram}
          testId="program-details"
        />
      )
      expect(screen.getByText('Minimal Program')).toBeInTheDocument()
    })

    it('does not render description when not available', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={minimalProgram}
          testId="program-details"
        />
      )
      expect(screen.queryByText(/A test program description/)).not.toBeInTheDocument()
    })

    it('does not render category when not available', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={minimalProgram}
          testId="program-details"
        />
      )
      expect(screen.queryByText('Entertainment')).not.toBeInTheDocument()
    })

    it('does not render rating when not available', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={minimalProgram}
          testId="program-details"
        />
      )
      expect(screen.queryByText('TV-14')).not.toBeInTheDocument()
    })

    it('does not render season/episode when not available', () => {
      vi.useRealTimers()
      render(
        <ProgramDetails
          {...defaultProps}
          program={minimalProgram}
          testId="program-details"
        />
      )
      expect(screen.queryByText('S2 E5')).not.toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details')).toBeInTheDocument()
    })

    it('applies testId to backdrop', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-backdrop')).toBeInTheDocument()
    })

    it('applies testId to buttons', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-watch-btn')).toBeInTheDocument()
      expect(screen.getByTestId('program-details-close-btn')).toBeInTheDocument()
    })

    it('applies testId to progress bar', () => {
      vi.useRealTimers()
      render(<ProgramDetails {...defaultProps} testId="program-details" />)
      expect(screen.getByTestId('program-details-progress')).toBeInTheDocument()
    })
  })
})
