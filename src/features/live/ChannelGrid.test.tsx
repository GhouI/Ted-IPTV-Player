import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { ChannelGrid } from './ChannelGrid'
import type { Channel } from '../../core/types/channel'

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
    logo: 'https://example.com/sports.png',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/sports',
    streamType: 'hls',
    isAvailable: true,
  },
  {
    id: 'ch-2',
    name: 'News Network',
    number: 2,
    logo: 'https://example.com/news.png',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/news',
    streamType: 'hls',
    isAvailable: true,
  },
  {
    id: 'ch-3',
    name: 'Movie Channel',
    number: 3,
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/movie',
    streamType: 'hls',
    isAvailable: true,
  },
]

describe('ChannelGrid', () => {
  const defaultProps = {
    channels: mockChannels,
    onChannelSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all channels', () => {
      render(<ChannelGrid {...defaultProps} />)
      expect(screen.getByText('Sports Channel')).toBeInTheDocument()
      expect(screen.getByText('News Network')).toBeInTheDocument()
      expect(screen.getByText('Movie Channel')).toBeInTheDocument()
    })

    it('applies testId', () => {
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)
      expect(screen.getByTestId('channel-grid')).toBeInTheDocument()
    })

    it('applies testId to individual channel cards', () => {
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)
      expect(screen.getByTestId('channel-grid-channel-ch-1')).toBeInTheDocument()
      expect(screen.getByTestId('channel-grid-channel-ch-2')).toBeInTheDocument()
      expect(screen.getByTestId('channel-grid-channel-ch-3')).toBeInTheDocument()
    })

    it('shows empty state when no channels', () => {
      render(<ChannelGrid {...defaultProps} channels={[]} />)
      expect(screen.getByText('No channels in this category')).toBeInTheDocument()
    })

    it('renders SVG icon in empty state', () => {
      render(<ChannelGrid {...defaultProps} channels={[]} testId="channel-grid" />)
      const container = screen.getByTestId('channel-grid')
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('grid layout', () => {
    it('renders with default 4 columns', () => {
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)
      const grid = screen.getByTestId('channel-grid')
      expect(grid).toHaveClass('grid-cols-4')
    })

    it('renders with 3 columns when specified', () => {
      render(<ChannelGrid {...defaultProps} columns={3} testId="channel-grid" />)
      const grid = screen.getByTestId('channel-grid')
      expect(grid).toHaveClass('grid-cols-3')
    })

    it('renders with 5 columns when specified', () => {
      render(<ChannelGrid {...defaultProps} columns={5} testId="channel-grid" />)
      const grid = screen.getByTestId('channel-grid')
      expect(grid).toHaveClass('grid-cols-5')
    })

    it('renders with 6 columns when specified', () => {
      render(<ChannelGrid {...defaultProps} columns={6} testId="channel-grid" />)
      const grid = screen.getByTestId('channel-grid')
      expect(grid).toHaveClass('grid-cols-6')
    })

    it('has gap class', () => {
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)
      const grid = screen.getByTestId('channel-grid')
      expect(grid).toHaveClass('gap-4')
    })
  })

  describe('interaction', () => {
    it('calls onChannelSelect when channel is clicked', async () => {
      const user = userEvent.setup()
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)

      await user.click(screen.getByTestId('channel-grid-channel-ch-1'))
      expect(defaultProps.onChannelSelect).toHaveBeenCalledTimes(1)
      expect(defaultProps.onChannelSelect).toHaveBeenCalledWith(mockChannels[0])
    })

    it('calls onChannelSelect with correct channel', async () => {
      const user = userEvent.setup()
      render(<ChannelGrid {...defaultProps} testId="channel-grid" />)

      await user.click(screen.getByTestId('channel-grid-channel-ch-2'))
      expect(defaultProps.onChannelSelect).toHaveBeenCalledWith(mockChannels[1])
    })

    it('handles missing onChannelSelect gracefully', async () => {
      const user = userEvent.setup()
      render(<ChannelGrid channels={mockChannels} testId="channel-grid" />)

      // Should not throw
      await user.click(screen.getByTestId('channel-grid-channel-ch-1'))
    })
  })

  describe('accessibility', () => {
    it('has grid role', () => {
      render(<ChannelGrid {...defaultProps} />)
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('has aria-label', () => {
      render(<ChannelGrid {...defaultProps} />)
      const grid = screen.getByRole('grid')
      expect(grid).toHaveAttribute('aria-label', 'Channel grid')
    })

    it('each channel card has button role', () => {
      render(<ChannelGrid {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })
  })
})
