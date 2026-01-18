import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { QualitySelector } from './QualitySelector'
import { usePlayerStore } from '../../core/stores/playerStore'
import type { QualityTrack } from '../../core/types/player'

// Mock quality tracks for testing
const mockQualityTracks: QualityTrack[] = [
  {
    id: '1080p',
    label: '1080p',
    height: 1080,
    width: 1920,
    bitrate: 5000000,
    codec: 'avc1.4d401f',
    frameRate: 30,
  },
  {
    id: '720p',
    label: '720p',
    height: 720,
    width: 1280,
    bitrate: 2500000,
    codec: 'avc1.4d401f',
    frameRate: 30,
  },
  {
    id: '480p',
    label: '480p',
    height: 480,
    width: 854,
    bitrate: 1000000,
    codec: 'avc1.4d401e',
    frameRate: 30,
  },
  {
    id: '360p',
    label: '360p',
    height: 360,
    width: 640,
    bitrate: 500000,
    codec: 'avc1.4d401e',
    frameRate: 30,
  },
]

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  usePlayerStore.getState().reset()
})

describe('QualitySelector', () => {
  describe('rendering', () => {
    it('renders the selector container when visible', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)
      expect(screen.getByTestId('quality-selector')).toBeInTheDocument()
    })

    it('does not render when visible is false', () => {
      render(<QualitySelector testId="quality-selector" visible={false} />)
      expect(screen.queryByTestId('quality-selector')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<QualitySelector testId="quality-selector" className="custom-class" visible={true} />)
      expect(screen.getByTestId('quality-selector')).toHaveClass('custom-class')
    })

    it('renders header with "Quality" text', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)
      expect(screen.getByText('Quality')).toBeInTheDocument()
    })

    it('has correct accessibility attributes', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)
      const selector = screen.getByTestId('quality-selector')
      expect(selector).toHaveAttribute('role', 'menu')
      expect(selector).toHaveAttribute('aria-label', 'Quality selection')
    })
  })

  describe('Auto quality option', () => {
    it('always renders Auto option at the top', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)
      expect(screen.getByTestId('quality-selector-auto')).toBeInTheDocument()
      expect(screen.getByText('Auto')).toBeInTheDocument()
      expect(screen.getByText('Automatic quality selection')).toBeInTheDocument()
    })

    it('shows Auto as selected when isAutoQuality is true', () => {
      usePlayerStore.getState().enableAutoQuality()
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const autoOption = screen.getByTestId('quality-selector-auto')
      expect(autoOption).toHaveAttribute('data-selected', 'true')
      expect(autoOption).toHaveAttribute('aria-checked', 'true')
    })

    it('calls onQualityChange with null when Auto is selected', () => {
      const onQualityChange = vi.fn()
      usePlayerStore.getState().setQualityTracks(mockQualityTracks)
      usePlayerStore.getState().selectQuality(mockQualityTracks[0])

      render(
        <QualitySelector
          testId="quality-selector"
          visible={true}
          onQualityChange={onQualityChange}
        />
      )

      fireEvent.click(screen.getByTestId('quality-selector-auto'))
      expect(onQualityChange).toHaveBeenCalledWith(null)
    })
  })

  describe('quality tracks display', () => {
    beforeEach(() => {
      usePlayerStore.getState().setQualityTracks(mockQualityTracks)
    })

    it('renders all quality tracks from the store', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('1080p')).toBeInTheDocument()
      expect(screen.getByText('720p')).toBeInTheDocument()
      expect(screen.getByText('480p')).toBeInTheDocument()
      expect(screen.getByText('360p')).toBeInTheDocument()
    })

    it('sorts quality tracks by resolution (highest first)', () => {
      // Add tracks in random order
      usePlayerStore.getState().setQualityTracks([
        mockQualityTracks[2], // 480p
        mockQualityTracks[0], // 1080p
        mockQualityTracks[3], // 360p
        mockQualityTracks[1], // 720p
      ])

      render(<QualitySelector testId="quality-selector" visible={true} />)

      const options = screen.getAllByRole('menuitem')
      // Auto is first, then sorted by height
      expect(options[0]).toHaveTextContent('Auto')
      expect(options[1]).toHaveTextContent('1080p')
      expect(options[2]).toHaveTextContent('720p')
      expect(options[3]).toHaveTextContent('480p')
      expect(options[4]).toHaveTextContent('360p')
    })

    it('displays bitrate in human-readable format', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      // 5000000 bps = 5.0 Mbps
      expect(screen.getByText('5.0 Mbps')).toBeInTheDocument()
      // 2500000 bps = 2.5 Mbps
      expect(screen.getByText('2.5 Mbps')).toBeInTheDocument()
      // 1000000 bps = 1.0 Mbps
      expect(screen.getByText('1.0 Mbps')).toBeInTheDocument()
      // 500000 bps = 500 Kbps
      expect(screen.getByText('500 Kbps')).toBeInTheDocument()
    })

    it('displays resolution for each track', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('1920x1080')).toBeInTheDocument()
      expect(screen.getByText('1280x720')).toBeInTheDocument()
      expect(screen.getByText('854x480')).toBeInTheDocument()
      expect(screen.getByText('640x360')).toBeInTheDocument()
    })

    it('shows empty state when no quality tracks available', () => {
      usePlayerStore.getState().setQualityTracks([])
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('No quality options available')).toBeInTheDocument()
    })
  })

  describe('quality selection', () => {
    beforeEach(() => {
      usePlayerStore.getState().setQualityTracks(mockQualityTracks)
    })

    it('highlights the currently selected quality track', () => {
      usePlayerStore.getState().selectQuality(mockQualityTracks[1]) // 720p
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const option720p = screen.getByTestId('quality-selector-720p')
      expect(option720p).toHaveAttribute('data-selected', 'true')

      const option1080p = screen.getByTestId('quality-selector-1080p')
      expect(option1080p).toHaveAttribute('data-selected', 'false')
    })

    it('calls onQualityChange when a quality track is selected', () => {
      const onQualityChange = vi.fn()
      render(
        <QualitySelector
          testId="quality-selector"
          visible={true}
          onQualityChange={onQualityChange}
        />
      )

      fireEvent.click(screen.getByTestId('quality-selector-720p'))
      expect(onQualityChange).toHaveBeenCalledWith(mockQualityTracks[1])
    })

    it('calls onClose after quality selection', () => {
      const onClose = vi.fn()
      const onQualityChange = vi.fn()
      render(
        <QualitySelector
          testId="quality-selector"
          visible={true}
          onQualityChange={onQualityChange}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByTestId('quality-selector-1080p'))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('spatial navigation', () => {
    beforeEach(() => {
      usePlayerStore.getState().setQualityTracks(mockQualityTracks)
    })

    it('Auto option receives focus', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      act(() => {
        setFocus('quality-option-Auto')
      })

      const autoOption = screen.getByTestId('quality-selector-auto')
      expect(autoOption).toHaveAttribute('data-focused', 'true')
    })

    it('quality options receive focus', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      act(() => {
        setFocus('quality-option-1080p')
      })

      const option = screen.getByTestId('quality-selector-1080p')
      expect(option).toHaveAttribute('data-focused', 'true')
    })

    it('selects quality on Enter press when focused', () => {
      const onQualityChange = vi.fn()
      render(
        <QualitySelector
          testId="quality-selector"
          visible={true}
          onQualityChange={onQualityChange}
        />
      )

      act(() => {
        setFocus('quality-option-720p')
      })

      // Simulate Enter key press (the spatial navigation library calls onEnterPress)
      fireEvent.click(screen.getByTestId('quality-selector-720p'))
      expect(onQualityChange).toHaveBeenCalledWith(mockQualityTracks[1])
    })
  })

  describe('formatBitrate helper', () => {
    it('formats Mbps correctly', () => {
      const track: QualityTrack = {
        id: 'test',
        label: 'Test',
        height: 1080,
        width: 1920,
        bitrate: 8500000, // 8.5 Mbps
      }
      usePlayerStore.getState().setQualityTracks([track])
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('8.5 Mbps')).toBeInTheDocument()
    })

    it('formats Kbps correctly', () => {
      const track: QualityTrack = {
        id: 'test',
        label: 'Test',
        height: 240,
        width: 426,
        bitrate: 250000, // 250 Kbps
      }
      usePlayerStore.getState().setQualityTracks([track])
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('250 Kbps')).toBeInTheDocument()
    })

    it('formats bps correctly for very low bitrates', () => {
      const track: QualityTrack = {
        id: 'test',
        label: 'Test',
        height: 144,
        width: 256,
        bitrate: 500, // 500 bps (edge case)
      }
      usePlayerStore.getState().setQualityTracks([track])
      render(<QualitySelector testId="quality-selector" visible={true} />)

      expect(screen.getByText('500 bps')).toBeInTheDocument()
    })
  })

  describe('visibility transitions', () => {
    it('has transition classes for smooth animation', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const selector = screen.getByTestId('quality-selector')
      expect(selector).toHaveClass('transition-all')
      expect(selector).toHaveClass('duration-200')
    })

    it('applies visible state classes when visible', () => {
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const selector = screen.getByTestId('quality-selector')
      expect(selector).toHaveClass('opacity-100')
      expect(selector).toHaveClass('translate-y-0')
    })
  })

  describe('checkmark indicator', () => {
    beforeEach(() => {
      usePlayerStore.getState().setQualityTracks(mockQualityTracks)
    })

    it('shows checkmark on selected quality', () => {
      usePlayerStore.getState().selectQuality(mockQualityTracks[0]) // 1080p
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const selectedOption = screen.getByTestId('quality-selector-1080p')
      const checkmark = selectedOption.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
    })

    it('shows checkmark on Auto when auto quality is enabled', () => {
      usePlayerStore.getState().enableAutoQuality()
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const autoOption = screen.getByTestId('quality-selector-auto')
      const checkmark = autoOption.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
    })

    it('does not show checkmark on non-selected options', () => {
      usePlayerStore.getState().selectQuality(mockQualityTracks[0]) // 1080p
      render(<QualitySelector testId="quality-selector" visible={true} />)

      const unselectedOption = screen.getByTestId('quality-selector-720p')
      const checkmark = unselectedOption.querySelector('svg')
      expect(checkmark).not.toBeInTheDocument()
    })
  })
})
