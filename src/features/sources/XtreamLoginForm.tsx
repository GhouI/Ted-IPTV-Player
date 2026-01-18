import { useState, useCallback, type FormEvent } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { XtreamSourceInput } from '../../core/types/source'

export interface XtreamLoginFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: XtreamSourceInput) => void
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether the form is in a loading state */
  isLoading?: boolean
  /** Error message to display */
  error?: string
  /** Initial values for the form fields */
  initialValues?: Partial<XtreamSourceInput>
  /** Test ID for testing purposes */
  testId?: string
}

interface FocusableInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password' | 'url'
  placeholder?: string
  error?: string
  focusKey?: string
  testId?: string
  autoFocus?: boolean
}

function FocusableInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  focusKey,
  testId,
  autoFocus = false,
}: FocusableInputProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {
      if (ref.current) {
        ref.current.focus()
      }
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const baseInputClasses = [
    'w-full',
    'px-4',
    'py-3',
    'rounded-lg',
    'bg-tv-card',
    'text-tv-text',
    'text-tv-lg',
    'border-2',
    'outline-none',
    'transition-all',
    'duration-150',
  ].join(' ')

  const stateClasses = focused
    ? 'border-tv-accent shadow-[0_0_0_2px_var(--color-tv-accent),0_0_15px_var(--color-tv-accent-glow)]'
    : error
      ? 'border-red-500'
      : 'border-tv-border focus:border-tv-accent'

  return (
    <div className="mb-4">
      <label className="mb-2 block text-tv-base font-medium text-tv-text-muted">
        {label}
      </label>
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${baseInputClasses} ${stateClasses}`}
        data-testid={testId}
        data-focused={focused}
        autoFocus={autoFocus}
        autoComplete={type === 'password' ? 'current-password' : 'off'}
      />
      {error && (
        <p className="mt-1 text-tv-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

interface FocusableButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  isLoading?: boolean
  focusKey?: string
  testId?: string
}

function FocusableButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  isLoading = false,
  focusKey,
  testId,
}: FocusableButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: disabled || isLoading ? undefined : onClick,
    focusable: !disabled,
  })

  const baseClasses = [
    'px-6',
    'py-3',
    'rounded-lg',
    'text-tv-lg',
    'font-medium',
    'transition-all',
    'duration-150',
    'outline-none',
    'min-w-[120px]',
  ].join(' ')

  const variantClasses =
    variant === 'primary'
      ? 'bg-tv-accent text-white hover:bg-tv-accent-hover'
      : 'bg-tv-card text-tv-text hover:bg-tv-card-hover'

  const disabledClasses = disabled || isLoading
    ? 'opacity-50 cursor-not-allowed'
    : ''

  const focusClasses = focused && !disabled
    ? 'ring-4 ring-tv-focus scale-105 shadow-[0_0_20px_var(--color-tv-accent-glow)]'
    : ''

  return (
    <button
      ref={ref}
      type="button"
      onClick={disabled || isLoading ? undefined : onClick}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${focusClasses}`}
      disabled={disabled || isLoading}
      data-testid={testId}
      data-focused={focused}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Connecting...
        </span>
      ) : (
        label
      )}
    </button>
  )
}

interface FormErrors {
  name?: string
  serverUrl?: string
  username?: string
  password?: string
}

function validateUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * XtreamLoginForm - A TV-optimized form for entering Xtream Codes credentials.
 *
 * Features:
 * - Spatial navigation support for TV remote control
 * - Form validation with error messages
 * - Loading state during connection
 * - Server URL, username, and password fields
 * - Source name field for identifying the source
 */
export function XtreamLoginForm({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialValues = {},
  testId,
}: XtreamLoginFormProps) {
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: false,
    focusKey: 'xtream-login-form',
  })

  const [name, setName] = useState(initialValues.name || '')
  const [serverUrl, setServerUrl] = useState(initialValues.serverUrl || '')
  const [username, setUsername] = useState(initialValues.username || '')
  const [password, setPassword] = useState(initialValues.password || '')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Source name is required'
    }

    if (!serverUrl.trim()) {
      newErrors.serverUrl = 'Server URL is required'
    } else if (!validateUrl(serverUrl)) {
      newErrors.serverUrl = 'Please enter a valid URL (e.g., http://example.com:8080)'
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, serverUrl, username, password])

  const handleSubmit = useCallback(() => {
    if (isLoading) return

    if (validate()) {
      onSubmit({
        name: name.trim(),
        serverUrl: serverUrl.trim().replace(/\/+$/, ''), // Remove trailing slashes
        username: username.trim(),
        password: password.trim(),
      })
    }
  }, [name, serverUrl, username, password, isLoading, validate, onSubmit])

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <form
        ref={ref}
        onSubmit={handleFormSubmit}
        className="w-full max-w-md"
        data-testid={testId}
      >
        <h2 className="mb-6 text-center text-tv-2xl font-bold text-tv-text">
          Add Xtream Codes Source
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-center text-tv-base text-red-300">
            {error}
          </div>
        )}

        <FocusableInput
          label="Source Name"
          value={name}
          onChange={setName}
          placeholder="My IPTV Provider"
          error={errors.name}
          focusKey="xtream-name-input"
          testId="xtream-name-input"
          autoFocus
        />

        <FocusableInput
          label="Server URL"
          value={serverUrl}
          onChange={setServerUrl}
          type="url"
          placeholder="http://example.com:8080"
          error={errors.serverUrl}
          focusKey="xtream-server-input"
          testId="xtream-server-input"
        />

        <FocusableInput
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Enter your username"
          error={errors.username}
          focusKey="xtream-username-input"
          testId="xtream-username-input"
        />

        <FocusableInput
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Enter your password"
          error={errors.password}
          focusKey="xtream-password-input"
          testId="xtream-password-input"
        />

        <div className="mt-6 flex justify-end gap-4">
          {onCancel && (
            <FocusableButton
              label="Cancel"
              onClick={onCancel}
              variant="secondary"
              disabled={isLoading}
              focusKey="xtream-cancel-btn"
              testId="xtream-cancel-btn"
            />
          )}
          <FocusableButton
            label="Connect"
            onClick={handleSubmit}
            variant="primary"
            isLoading={isLoading}
            focusKey="xtream-submit-btn"
            testId="xtream-submit-btn"
          />
        </div>
      </form>
    </FocusContext.Provider>
  )
}
