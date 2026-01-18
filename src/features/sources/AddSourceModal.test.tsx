import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { AddSourceModal } from './AddSourceModal'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

describe('AddSourceModal', () => {
  const mockOnClose = vi.fn()
  const mockOnAddSource = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <AddSourceModal
          isOpen={false}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.queryByText('Add New Source')).not.toBeInTheDocument()
    })

    it('renders source type selector when open', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText('Add New Source')).toBeInTheDocument()
      expect(screen.getByText('Select the type of IPTV source you want to add')).toBeInTheDocument()
    })

    it('renders both source type options', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText('Xtream Codes')).toBeInTheDocument()
      expect(screen.getByText('M3U Playlist')).toBeInTheDocument()
      expect(screen.getByText('Connect using server URL, username and password')).toBeInTheDocument()
      expect(screen.getByText('Add a playlist URL directly')).toBeInTheDocument()
    })

    it('applies testId to modal', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          testId="add-source-modal"
        />
      )

      expect(screen.getByTestId('add-source-modal')).toBeInTheDocument()
    })
  })

  describe('source type selection', () => {
    it('shows Xtream form when Xtream Codes is selected', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-type-xtream'))

      expect(screen.getByText('Add Xtream Codes Source')).toBeInTheDocument()
      expect(screen.getByTestId('xtream-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('xtream-server-input')).toBeInTheDocument()
      expect(screen.getByTestId('xtream-username-input')).toBeInTheDocument()
      expect(screen.getByTestId('xtream-password-input')).toBeInTheDocument()
    })

    it('shows M3U form when M3U Playlist is selected', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-type-m3u'))

      expect(screen.getByText('Add M3U Playlist')).toBeInTheDocument()
      expect(screen.getByTestId('m3u-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('m3u-playlist-input')).toBeInTheDocument()
      expect(screen.getByTestId('m3u-epg-input')).toBeInTheDocument()
    })

    it('hides source type selector after selection', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-type-xtream'))

      expect(screen.queryByText('Select the type of IPTV source you want to add')).not.toBeInTheDocument()
    })
  })

  describe('back navigation', () => {
    it('returns to source type selector when cancel is clicked on Xtream form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select Xtream
      await user.click(screen.getByTestId('source-type-xtream'))
      expect(screen.getByText('Add Xtream Codes Source')).toBeInTheDocument()

      // Click cancel (back)
      await user.click(screen.getByTestId('xtream-cancel-btn'))

      // Should show source type selector again
      expect(screen.getByText('Add New Source')).toBeInTheDocument()
      expect(screen.getByText('Xtream Codes')).toBeInTheDocument()
    })

    it('returns to source type selector when cancel is clicked on M3U form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select M3U
      await user.click(screen.getByTestId('source-type-m3u'))
      expect(screen.getByText('Add M3U Playlist')).toBeInTheDocument()

      // Click cancel (back)
      await user.click(screen.getByTestId('m3u-cancel-btn'))

      // Should show source type selector again
      expect(screen.getByText('Add New Source')).toBeInTheDocument()
      expect(screen.getByText('M3U Playlist')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls onAddSource with xtream type and data when Xtream form is submitted', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select Xtream
      await user.click(screen.getByTestId('source-type-xtream'))

      // Fill in form
      await user.type(screen.getByTestId('xtream-name-input'), 'My IPTV')
      await user.type(screen.getByTestId('xtream-server-input'), 'http://iptv.example.com:8080')
      await user.type(screen.getByTestId('xtream-username-input'), 'testuser')
      await user.type(screen.getByTestId('xtream-password-input'), 'testpass')

      // Submit
      await user.click(screen.getByTestId('xtream-submit-btn'))

      expect(mockOnAddSource).toHaveBeenCalledWith('xtream', {
        name: 'My IPTV',
        serverUrl: 'http://iptv.example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })
    })

    it('calls onAddSource with m3u type and data when M3U form is submitted', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select M3U
      await user.click(screen.getByTestId('source-type-m3u'))

      // Fill in form
      await user.type(screen.getByTestId('m3u-name-input'), 'My Playlist')
      await user.type(screen.getByTestId('m3u-playlist-input'), 'http://example.com/playlist.m3u')

      // Submit
      await user.click(screen.getByTestId('m3u-submit-btn'))

      expect(mockOnAddSource).toHaveBeenCalledWith('m3u', {
        name: 'My Playlist',
        playlistUrl: 'http://example.com/playlist.m3u',
      })
    })

    it('includes EPG URL when provided in M3U form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select M3U
      await user.click(screen.getByTestId('source-type-m3u'))

      // Fill in form with EPG URL
      await user.type(screen.getByTestId('m3u-name-input'), 'My Playlist')
      await user.type(screen.getByTestId('m3u-playlist-input'), 'http://example.com/playlist.m3u')
      await user.type(screen.getByTestId('m3u-epg-input'), 'http://example.com/epg.xml')

      // Submit
      await user.click(screen.getByTestId('m3u-submit-btn'))

      expect(mockOnAddSource).toHaveBeenCalledWith('m3u', {
        name: 'My Playlist',
        playlistUrl: 'http://example.com/playlist.m3u',
        epgUrl: 'http://example.com/epg.xml',
      })
    })
  })

  describe('loading state', () => {
    it('passes loading state to Xtream form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          isLoading={true}
        />
      )

      await user.click(screen.getByTestId('source-type-xtream'))

      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('passes loading state to M3U form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          isLoading={true}
        />
      )

      await user.click(screen.getByTestId('source-type-m3u'))

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('disables cancel button when loading', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          isLoading={true}
        />
      )

      await user.click(screen.getByTestId('source-type-xtream'))

      const cancelButton = screen.getByTestId('xtream-cancel-btn')
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('error state', () => {
    it('passes error message to Xtream form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          error="Connection failed"
        />
      )

      await user.click(screen.getByTestId('source-type-xtream'))

      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })

    it('passes error message to M3U form', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          error="Invalid playlist URL"
        />
      )

      await user.click(screen.getByTestId('source-type-m3u'))

      expect(screen.getByText('Invalid playlist URL')).toBeInTheDocument()
    })
  })

  describe('closing behavior', () => {
    it('calls onClose when modal close is triggered', async () => {
      const user = userEvent.setup()
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
          testId="add-source-modal"
        />
      )

      // Click backdrop to close
      const backdrop = screen.getByTestId('add-source-modal')
      await user.click(backdrop)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('resets selection when modal is closed and reopened', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Select Xtream
      await user.click(screen.getByTestId('source-type-xtream'))
      expect(screen.getByText('Add Xtream Codes Source')).toBeInTheDocument()

      // Close modal
      rerender(
        <AddSourceModal
          isOpen={false}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Reopen modal
      rerender(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Should show source type selector again
      await waitFor(() => {
        expect(screen.getByText('Add New Source')).toBeInTheDocument()
      })
    })
  })

  describe('source type buttons', () => {
    it('has data-focused attribute on source type buttons', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      const xtreamButton = screen.getByTestId('source-type-xtream')
      const m3uButton = screen.getByTestId('source-type-m3u')

      expect(xtreamButton).toHaveAttribute('data-focused')
      expect(m3uButton).toHaveAttribute('data-focused')
    })

    it('shows correct icons for source types', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      // Check SVG icons are present (they're inside the buttons)
      const xtreamButton = screen.getByTestId('source-type-xtream')
      const m3uButton = screen.getByTestId('source-type-m3u')

      expect(xtreamButton.querySelector('svg')).toBeInTheDocument()
      expect(m3uButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has dialog role on modal', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      render(
        <AddSourceModal
          isOpen={true}
          onClose={mockOnClose}
          onAddSource={mockOnAddSource}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
  })
})
