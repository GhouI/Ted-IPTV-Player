import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { XtreamLoginForm } from './XtreamLoginForm'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

describe('XtreamLoginForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Add Xtream Codes Source')).toBeInTheDocument()
      expect(screen.getByText('Source Name')).toBeInTheDocument()
      expect(screen.getByText('Server URL')).toBeInTheDocument()
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
      expect(screen.getByText('Connect')).toBeInTheDocument()
    })

    it('renders cancel button when onCancel is provided', () => {
      render(
        <XtreamLoginForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('does not render cancel button when onCancel is not provided', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('renders with initial values', () => {
      render(
        <XtreamLoginForm
          onSubmit={mockOnSubmit}
          initialValues={{
            name: 'Test Provider',
            serverUrl: 'http://test.com:8080',
            username: 'testuser',
            password: 'testpass',
          }}
        />
      )

      expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument()
      expect(screen.getByDisplayValue('http://test.com:8080')).toBeInTheDocument()
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('testpass')).toBeInTheDocument()
    })

    it('renders error message when provided', () => {
      render(
        <XtreamLoginForm
          onSubmit={mockOnSubmit}
          error="Connection failed"
        />
      )

      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} isLoading />)

      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('applies testId to form element', () => {
      render(
        <XtreamLoginForm onSubmit={mockOnSubmit} testId="test-form" />
      )

      expect(screen.getByTestId('test-form')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByText('Connect'))

      expect(screen.getByText('Source name is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when server URL is empty', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      await user.type(nameInput, 'Test')
      await user.click(screen.getByText('Connect'))

      expect(screen.getByText('Server URL is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when server URL is invalid', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')

      await user.type(nameInput, 'Test')
      await user.type(serverInput, 'not-a-url')
      await user.click(screen.getByText('Connect'))

      expect(
        screen.getByText('Please enter a valid URL (e.g., http://example.com:8080)')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when username is empty', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')

      await user.type(nameInput, 'Test')
      await user.type(serverInput, 'http://test.com:8080')
      await user.click(screen.getByText('Connect'))

      expect(screen.getByText('Username is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')

      await user.type(nameInput, 'Test')
      await user.type(serverInput, 'http://test.com:8080')
      await user.type(usernameInput, 'testuser')
      await user.click(screen.getByText('Connect'))

      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('accepts valid http URL', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, 'Test Provider')
      await user.type(serverInput, 'http://test.com:8080')
      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'testpass')
      await user.click(screen.getByText('Connect'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Provider',
        serverUrl: 'http://test.com:8080',
        username: 'testuser',
        password: 'testpass',
      })
    })

    it('accepts valid https URL', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, 'Test Provider')
      await user.type(serverInput, 'https://test.com')
      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'testpass')
      await user.click(screen.getByText('Connect'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Provider',
        serverUrl: 'https://test.com',
        username: 'testuser',
        password: 'testpass',
      })
    })

    it('strips trailing slashes from server URL', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, 'Test Provider')
      await user.type(serverInput, 'http://test.com:8080///')
      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'testpass')
      await user.click(screen.getByText('Connect'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Provider',
        serverUrl: 'http://test.com:8080',
        username: 'testuser',
        password: 'testpass',
      })
    })

    it('trims whitespace from all fields', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, '  Test Provider  ')
      await user.type(serverInput, '  http://test.com:8080  ')
      await user.type(usernameInput, '  testuser  ')
      await user.type(passwordInput, '  testpass  ')
      await user.click(screen.getByText('Connect'))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Provider',
        serverUrl: 'http://test.com:8080',
        username: 'testuser',
        password: 'testpass',
      })
    })
  })

  describe('form submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, 'My IPTV')
      await user.type(serverInput, 'http://iptv.example.com:8080')
      await user.type(usernameInput, 'user123')
      await user.type(passwordInput, 'secret456')
      await user.click(screen.getByText('Connect'))

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'My IPTV',
        serverUrl: 'http://iptv.example.com:8080',
        username: 'user123',
        password: 'secret456',
      })
    })

    it('does not call onSubmit when form is loading', async () => {
      const user = userEvent.setup()
      render(
        <XtreamLoginForm
          onSubmit={mockOnSubmit}
          isLoading
          initialValues={{
            name: 'Test',
            serverUrl: 'http://test.com:8080',
            username: 'user',
            password: 'pass',
          }}
        />
      )

      await user.click(screen.getByText('Connecting...'))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('supports form submission via Enter key', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      const serverInput = screen.getByTestId('xtream-server-input')
      const usernameInput = screen.getByTestId('xtream-username-input')
      const passwordInput = screen.getByTestId('xtream-password-input')

      await user.type(nameInput, 'Test')
      await user.type(serverInput, 'http://test.com:8080')
      await user.type(usernameInput, 'user')
      await user.type(passwordInput, 'pass')

      // Submit via form
      fireEvent.submit(passwordInput.closest('form')!)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <XtreamLoginForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      await user.click(screen.getByText('Cancel'))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('cancel button is disabled when loading', () => {
      render(
        <XtreamLoginForm
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
    it('password field has correct type', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const passwordInput = screen.getByTestId('xtream-password-input')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('server URL field has url type', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const serverInput = screen.getByTestId('xtream-server-input')
      expect(serverInput).toHaveAttribute('type', 'url')
    })

    it('updates values as user types', async () => {
      const user = userEvent.setup()
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByTestId('xtream-name-input')
      await user.type(nameInput, 'Hello')

      expect(nameInput).toHaveValue('Hello')
    })
  })

  describe('accessibility', () => {
    it('has data-focused attribute on focused inputs', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('data-focused')
      })
    })

    it('has labels for all inputs', () => {
      render(<XtreamLoginForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Source Name')).toBeInTheDocument()
      expect(screen.getByText('Server URL')).toBeInTheDocument()
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
    })
  })
})
