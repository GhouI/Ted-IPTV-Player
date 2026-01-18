import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { ChannelCard } from './ChannelCard'
import type { Channel } from '../../core/types/channel'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockChannel: Channel = {
  id: 'ch-1',
  name: 'Test Channel',
  number: 1,
  logo: 'https://example.com/logo.png',
  categoryId: 'cat-1',
  streamUrl: 'http://example.com/stream',
  streamType: 'hls',
  epgChannelId: 'epg-1',
  isAvailable: true,
}

describe('ChannelCard', () => {
  const defaultProps = {
    channel: mockChannel,
    onSelect: vi.fn(),
    onFocus: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders channel name', () => {
      render(<ChannelCard {...defaultProps} />)
      expect(screen.getByText('Test Channel')).toBeInTheDocument()
    })

    it('renders channel number badge when provided', () => {
      render(<ChannelCard {...defaultProps} />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('does not render channel number badge when not provided', () => {
      const channelWithoutNumber = { ...mockChannel, number: undefined }
      render(<ChannelCard {...defaultProps} channel={channelWithoutNumber} />)
      // The number badge element shouldn't exist
      const numberBadge = screen.queryByText(/^\d+$/)
      expect(numberBadge).not.toBeInTheDocument()
    })

    it('renders channel logo when provided', () => {
      render(<ChannelCard {...defaultProps} />)
      const img = screen.getByRole('img', { name: /Test Channel logo/i })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('renders fallback initials when no logo', () => {
      const channelWithoutLogo = { ...mockChannel, logo: undefined }
      render(<ChannelCard {...defaultProps} channel={channelWithoutLogo} />)
      expect(screen.getByText('TC')).toBeInTheDocument()
    })

    it('renders now playing info when provided', () => {
      render(<ChannelCard {...defaultProps} nowPlaying="Current Show" />)
      expect(screen.getByText('Current Show')).toBeInTheDocument()
    })

    it('does not render now playing when not provided', () => {
      render(<ChannelCard {...defaultProps} />)
      expect(screen.queryByText('Current Show')).not.toBeInTheDocument()
    })

    it('applies testId', () => {
      render(<ChannelCard {...defaultProps} testId="channel-card" />)
      expect(screen.getByTestId('channel-card')).toBeInTheDocument()
    })

    it('shows unavailable overlay when channel is not available', () => {
      const unavailableChannel = { ...mockChannel, isAvailable: false }
      render(<ChannelCard {...defaultProps} channel={unavailableChannel} />)
      expect(screen.getByText('Unavailable')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelect when clicked', async () => {
      const user = userEvent.setup()
      render(<ChannelCard {...defaultProps} testId="channel-card" />)

      await user.click(screen.getByTestId('channel-card'))
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
    })

    it('handles missing onSelect gracefully', async () => {
      const user = userEvent.setup()
      render(<ChannelCard channel={mockChannel} testId="channel-card" />)

      // Should not throw
      await user.click(screen.getByTestId('channel-card'))
    })
  })

  describe('image fallback', () => {
    it('shows initials when image fails to load', () => {
      render(<ChannelCard {...defaultProps} testId="channel-card" />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      // After error, should show initials
      expect(screen.getByText('TC')).toBeInTheDocument()
    })

    it('generates correct initials for multi-word names', () => {
      const multiWordChannel = { ...mockChannel, name: 'News Network HD', logo: undefined }
      render(<ChannelCard {...defaultProps} channel={multiWordChannel} />)
      expect(screen.getByText('NN')).toBeInTheDocument()
    })

    it('generates correct initials for hyphenated names', () => {
      const hyphenatedChannel = { ...mockChannel, name: 'Sports-News', logo: undefined }
      render(<ChannelCard {...defaultProps} channel={hyphenatedChannel} />)
      expect(screen.getByText('SN')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has button role', () => {
      render(<ChannelCard {...defaultProps} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has aria-label with channel info', () => {
      render(<ChannelCard {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Test Channel'))
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('channel 1'))
    })

    it('includes now playing in aria-label when provided', () => {
      render(<ChannelCard {...defaultProps} nowPlaying="Current Show" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('now playing: Current Show'))
    })

    it('is focusable via tabIndex', () => {
      render(<ChannelCard {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('tabIndex', '0')
    })

    it('has lazy loading on image', () => {
      render(<ChannelCard {...defaultProps} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('focus states', () => {
    it('sets data-focused attribute', () => {
      render(<ChannelCard {...defaultProps} testId="channel-card" />)
      const card = screen.getByTestId('channel-card')
      expect(card).toHaveAttribute('data-focused')
    })
  })
})
