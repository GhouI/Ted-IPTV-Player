import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { EPGChannelList } from './EPGChannelList'
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
    isAvailable: true,
  },
  {
    id: 'ch-2',
    name: 'News Network',
    number: 2,
    logo: 'https://example.com/news.png',
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/news',
    isAvailable: true,
  },
  {
    id: 'ch-3',
    name: 'Movies Plus',
    categoryId: 'cat-3',
    streamUrl: 'http://example.com/movies',
    isAvailable: true,
  },
]

describe('EPGChannelList', () => {
  const defaultProps = {
    channels: mockChannels,
    onChannelSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the component', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      expect(screen.getByTestId('channel-list')).toBeInTheDocument()
    })

    it('renders all channels', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      expect(screen.getByTestId('channel-list-item-0')).toBeInTheDocument()
      expect(screen.getByTestId('channel-list-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('channel-list-item-2')).toBeInTheDocument()
    })

    it('displays channel names', () => {
      render(<EPGChannelList {...defaultProps} />)

      expect(screen.getByText('Sports Channel')).toBeInTheDocument()
      expect(screen.getByText('News Network')).toBeInTheDocument()
      expect(screen.getByText('Movies Plus')).toBeInTheDocument()
    })

    it('displays channel numbers when present', () => {
      render(<EPGChannelList {...defaultProps} />)

      expect(screen.getByText('1.')).toBeInTheDocument()
      expect(screen.getByText('2.')).toBeInTheDocument()
    })

    it('renders channel logos', () => {
      render(<EPGChannelList {...defaultProps} />)

      // Images with alt="" have presentation role for accessibility (decorative images)
      const images = screen.getAllByRole('presentation')
      expect(images.length).toBeGreaterThan(0)
    })

    it('shows placeholder for channels without logo', () => {
      // Channel 3 (Movies Plus) doesn't have a logo, should show first letter placeholder
      const channelsWithNoLogo: Channel[] = [
        {
          id: 'ch-1',
          name: 'No Logo Channel',
          categoryId: 'cat-1',
          streamUrl: 'http://example.com/nologochannel',
          isAvailable: true,
        },
      ]

      render(<EPGChannelList channels={channelsWithNoLogo} />)

      // Should show first letter as placeholder
      expect(screen.getByText('N')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders empty list when no channels', () => {
      render(<EPGChannelList channels={[]} testId="channel-list" />)

      expect(screen.getByTestId('channel-list')).toBeInTheDocument()
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })
  })

  describe('focusability', () => {
    it('channel items are focusable', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      const item = screen.getByTestId('channel-list-item-0')
      expect(item).toHaveAttribute('tabindex', '0')
    })

    it('channel items have data-focused attribute', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      const item = screen.getByTestId('channel-list-item-0')
      expect(item).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has list role', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      expect(screen.getByRole('list', { name: 'Channels' })).toBeInTheDocument()
    })

    it('channel items have listitem role', () => {
      render(<EPGChannelList {...defaultProps} />)

      const items = screen.getAllByRole('listitem')
      expect(items.length).toBe(3)
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      expect(screen.getByTestId('channel-list')).toBeInTheDocument()
    })

    it('applies testId to channel items', () => {
      render(<EPGChannelList {...defaultProps} testId="channel-list" />)

      expect(screen.getByTestId('channel-list-item-0')).toBeInTheDocument()
      expect(screen.getByTestId('channel-list-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('channel-list-item-2')).toBeInTheDocument()
    })
  })
})
