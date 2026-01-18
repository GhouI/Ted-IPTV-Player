import { useState, useCallback, type FormEvent } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { M3USourceInput } from '../../core/types/source'

export interface M3UUrlFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: M3USourceInput) => void
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether the form is in a loading state */
  isLoading?: boolean
  /** Error message to display */
  error?: string
  /** Initial values for the form fields */
  initialValues?: Partial<M3USourceInput>
  /** Test ID for testing purposes */
  testId?: string
}

interface FocusableInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'url'
  placeholder?: string
  error?: string
  focusKey?: string
  testId?: string
  autoFocus?: boolean
  optional?: boolean
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
  optional = false,
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
        {optional && <span className="ml-1 text-tv-sm text-tv-text-muted/60">(Optional)</span>}
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
        autoComplete="off"
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
          Loading...
        </span>
      ) : (
        label
      )}
    </button>
  )
}

interface FormErrors {
  name?: string
  playlistUrl?: string
  epgUrl?: string
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

function validateM3UUrl(url: string): boolean {
  if (!validateUrl(url)) return false
  // M3U URLs should be valid URLs - we accept any valid HTTP/HTTPS URL
  // The content will be validated when loading the playlist
  return true
}

/**
 * M3UUrlForm - A TV-optimized form for entering M3U playlist URLs.
 *
 * Features:
 * - Spatial navigation support for TV remote control
 * - Form validation with error messages
 * - Loading state during connection
 * - Playlist URL input with validation
 * - Optional EPG URL input
 * - Source name field for identifying the source
 */
export function M3UUrlForm({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialValues = {},
  testId,
}: M3UUrlFormProps) {
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: false,
    focusKey: 'm3u-url-form',
  })

  const [name, setName] = useState(initialValues.name || '')
  const [playlistUrl, setPlaylistUrl] = useState(initialValues.playlistUrl || '')
  const [epgUrl, setEpgUrl] = useState(initialValues.epgUrl || '')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Source name is required'
    }

    if (!playlistUrl.trim()) {
      newErrors.playlistUrl = 'Playlist URL is required'
    } else if (!validateM3UUrl(playlistUrl)) {
      newErrors.playlistUrl = 'Please enter a valid URL (e.g., http://example.com/playlist.m3u)'
    }

    // EPG URL is optional, but if provided it must be valid
    if (epgUrl.trim() && !validateUrl(epgUrl)) {
      newErrors.epgUrl = 'Please enter a valid URL (e.g., http://example.com/epg.xml)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, playlistUrl, epgUrl])

  const handleSubmit = useCallback(() => {
    if (isLoading) return

    if (validate()) {
      const data: M3USourceInput = {
        name: name.trim(),
        playlistUrl: playlistUrl.trim(),
      }

      // Only include epgUrl if it's not empty
      const trimmedEpgUrl = epgUrl.trim()
      if (trimmedEpgUrl) {
        data.epgUrl = trimmedEpgUrl
      }

      onSubmit(data)
    }
  }, [name, playlistUrl, epgUrl, isLoading, validate, onSubmit])

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
          Add M3U Playlist
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
          placeholder="My M3U Playlist"
          error={errors.name}
          focusKey="m3u-name-input"
          testId="m3u-name-input"
          autoFocus
        />

        <FocusableInput
          label="Playlist URL"
          value={playlistUrl}
          onChange={setPlaylistUrl}
          type="url"
          placeholder="http://example.com/playlist.m3u"
          error={errors.playlistUrl}
          focusKey="m3u-playlist-input"
          testId="m3u-playlist-input"
        />

        <FocusableInput
          label="EPG URL"
          value={epgUrl}
          onChange={setEpgUrl}
          type="url"
          placeholder="http://example.com/epg.xml"
          error={errors.epgUrl}
          focusKey="m3u-epg-input"
          testId="m3u-epg-input"
          optional
        />

        <div className="mt-6 flex justify-end gap-4">
          {onCancel && (
            <FocusableButton
              label="Cancel"
              onClick={onCancel}
              variant="secondary"
              disabled={isLoading}
              focusKey="m3u-cancel-btn"
              testId="m3u-cancel-btn"
            />
          )}
          <FocusableButton
            label="Add Playlist"
            onClick={handleSubmit}
            variant="primary"
            isLoading={isLoading}
            focusKey="m3u-submit-btn"
            testId="m3u-submit-btn"
          />
        </div>
      </form>
    </FocusContext.Provider>
  )
}
