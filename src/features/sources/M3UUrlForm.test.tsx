import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { M3UUrlForm } from './M3UUrlForm'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

describe('M3UUrlForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Add M3U Playlist')).toBeInTheDocument()
      expect(screen.getByText('Source Name')).toBeInTheDocument()
      expect(screen.getByText('Playlist URL')).toBeInTheDocument()
      expect(screen.getByText('EPG URL')).toBeInTheDocument()
      expect(screen.getByText('Add Playlist')).toBeInTheDocument()
    })

    it('shows optional label for EPG URL', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('(Optional)')).toBeInTheDocument()
    })

    it('renders cancel button when onCancel is provided', () => {
      render(
        <M3UUrlForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('does not render cancel button when onCancel is not provided', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('renders with initial values', () => {
      render(
        <M3UUrlForm
          onSubmit={mockOnSubmit}
          initialValues={{
            name: 'Test Playlist',
            playlistUrl: 'http://test.com/playlist.m3u',
            epgUrl: 'http://test.com/epg.xml',
          }}
        />
      )

      expect(screen.getByDisplayValue('Test Playlist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('http://test.com/playlist.m3u')).toBeInTheDocument()
      expect(screen.getByDisplayValue('http://test.com/epg.xml')).toBeInTheDocument()
    })

    it('renders error message when provided', () => {
      render(
        <M3UUrlForm
          onSubmit={mockOnSubmit}
          error="Failed to load playlist"
        />
      )

      expect(screen.getByText('Failed to load playlist')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} isLoading />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('applies testId to form element', () => {
      render(
        <M3UUrlForm onSubmit={mockOnSubmit} testId="test-form" />
      )

      expect(screen.getByTestId('test-form')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByText('Add Playlist'))

      expect(screen.getByText('Source name is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when playlist URL is empty', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      await user.type(nameInput, 'Test')
      await user.click(screen.getByText('Add Playlist'))

      expect(screen.getByText('Playlist URL is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when playlist URL is invalid', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'not-a-url')
      await user.click(screen.getByText('Add Playlist'))

      expect(
        screen.getByText('Please enter a valid URL (e.g., http://example.com/playlist.m3u)')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when EPG URL is provided but invalid', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')
      const epgInput = screen.getByTestId('m3u-epg-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')
      await user.type(epgInput, 'invalid-url')
      await user.click(screen.getByText('Add Playlist'))

      expect(
        screen.getByText('Please enter a valid URL (e.g., http://example.com/epg.xml)')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('accepts valid http URL', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test Playlist')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'http://test.com/playlist.m3u',
      })
    })

    it('accepts valid https URL', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test Playlist')
      await user.type(playlistInput, 'https://test.com/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'https://test.com/playlist.m3u',
      })
    })

    it('accepts empty EPG URL (optional field)', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test Playlist')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'http://test.com/playlist.m3u',
      })
      // Should not include epgUrl when empty
      expect(mockOnSubmit.mock.calls[0][0]).not.toHaveProperty('epgUrl')
    })

    it('includes EPG URL when provided and valid', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')
      const epgInput = screen.getByTestId('m3u-epg-input')

      await user.type(nameInput, 'Test Playlist')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')
      await user.type(epgInput, 'http://test.com/epg.xml')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'http://test.com/playlist.m3u',
        epgUrl: 'http://test.com/epg.xml',
      })
    })

    it('trims whitespace from all fields', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')
      const epgInput = screen.getByTestId('m3u-epg-input')

      await user.type(nameInput, '  Test Playlist  ')
      await user.type(playlistInput, '  http://test.com/playlist.m3u  ')
      await user.type(epgInput, '  http://test.com/epg.xml  ')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'http://test.com/playlist.m3u',
        epgUrl: 'http://test.com/epg.xml',
      })
    })

    it('does not include epgUrl if only whitespace', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')
      const epgInput = screen.getByTestId('m3u-epg-input')

      await user.type(nameInput, 'Test Playlist')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')
      await user.type(epgInput, '   ')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Playlist',
        playlistUrl: 'http://test.com/playlist.m3u',
      })
      expect(mockOnSubmit.mock.calls[0][0]).not.toHaveProperty('epgUrl')
    })
  })

  describe('form submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'My M3U')
      await user.type(playlistInput, 'http://iptv.example.com/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'My M3U',
        playlistUrl: 'http://iptv.example.com/playlist.m3u',
      })
    })

    it('does not call onSubmit when form is loading', async () => {
      const user = userEvent.setup()
      render(
        <M3UUrlForm
          onSubmit={mockOnSubmit}
          isLoading
          initialValues={{
            name: 'Test',
            playlistUrl: 'http://test.com/playlist.m3u',
          }}
        />
      )

      await user.click(screen.getByText('Loading...'))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('supports form submission via Enter key', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'http://test.com/playlist.m3u')

      // Submit via form
      fireEvent.submit(playlistInput.closest('form')!)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <M3UUrlForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      await user.click(screen.getByText('Cancel'))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('cancel button is disabled when loading', () => {
      render(
        <M3UUrlForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading
        />
      )

      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('input fields', () => {
    it('playlist URL field has url type', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const playlistInput = screen.getByTestId('m3u-playlist-input')
      expect(playlistInput).toHaveAttribute('type', 'url')
    })

    it('EPG URL field has url type', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const epgInput = screen.getByTestId('m3u-epg-input')
      expect(epgInput).toHaveAttribute('type', 'url')
    })

    it('updates values as user types', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      await user.type(nameInput, 'Hello')

      expect(nameInput).toHaveValue('Hello')
    })
  })

  describe('accessibility', () => {
    it('has data-focused attribute on focused inputs', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('data-focused')
      })
    })

    it('has labels for all inputs', () => {
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Source Name')).toBeInTheDocument()
      expect(screen.getByText('Playlist URL')).toBeInTheDocument()
      expect(screen.getByText('EPG URL')).toBeInTheDocument()
    })
  })

  describe('URL validation edge cases', () => {
    it('rejects ftp:// URLs', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'ftp://test.com/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(
        screen.getByText('Please enter a valid URL (e.g., http://example.com/playlist.m3u)')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('rejects file:// URLs', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'file:///etc/passwd')
      await user.click(screen.getByText('Add Playlist'))

      expect(
        screen.getByText('Please enter a valid URL (e.g., http://example.com/playlist.m3u)')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('accepts URL with query parameters', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'http://test.com/get.php?username=test&password=test&type=m3u_plus')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test',
        playlistUrl: 'http://test.com/get.php?username=test&password=test&type=m3u_plus',
      })
    })

    it('accepts URL with port number', async () => {
      const user = userEvent.setup()
      render(<M3UUrlForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('m3u-name-input')
      const playlistInput = screen.getByTestId('m3u-playlist-input')

      await user.type(nameInput, 'Test')
      await user.type(playlistInput, 'http://test.com:8080/playlist.m3u')
      await user.click(screen.getByText('Add Playlist'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test',
        playlistUrl: 'http://test.com:8080/playlist.m3u',
      })
    })
  })
})
