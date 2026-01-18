import { useState, useCallback, useEffect } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { Modal } from '../../core/components/Modal'
import { XtreamLoginForm } from './XtreamLoginForm'
import { M3UUrlForm } from './M3UUrlForm'
import type { SourceType, XtreamSourceInput, M3USourceInput } from '../../core/types/source'

export interface AddSourceModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Callback when a source is submitted */
  onAddSource: (type: SourceType, data: XtreamSourceInput | M3USourceInput) => void
  /** Whether the form is in a loading state */
  isLoading?: boolean
  /** Error message to display */
  error?: string
  /** Test ID for testing purposes */
  testId?: string
}

interface SourceTypeSelectorProps {
  onSelect: (type: SourceType) => void
  testId?: string
}

interface SourceTypeButtonProps {
  type: SourceType
  title: string
  description: string
  icon: React.ReactNode
  onSelect: (type: SourceType) => void
  focusKey: string
  testId?: string
}

function SourceTypeButton({
  type,
  title,
  description,
  icon,
  onSelect,
  focusKey,
  testId,
}: SourceTypeButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onSelect(type),
  })

  const baseClasses = [
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'p-6',
    'rounded-xl',
    'bg-tv-card',
    'border-2',
    'transition-all',
    'duration-150',
    'cursor-pointer',
    'min-h-[180px]',
  ].join(' ')

  const focusClasses = focused
    ? 'border-tv-accent scale-105 shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : 'border-tv-border hover:border-tv-accent/50'

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(type)}
      className={`${baseClasses} ${focusClasses}`}
      data-testid={testId}
      data-focused={focused}
    >
      <div className="mb-4 text-tv-accent">{icon}</div>
      <h3 className="mb-2 text-tv-xl font-semibold text-tv-text">{title}</h3>
      <p className="text-center text-tv-base text-tv-text-muted">{description}</p>
    </button>
  )
}

function SourceTypeSelector({ onSelect, testId }: SourceTypeSelectorProps) {
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: false,
    focusKey: 'source-type-selector',
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="w-full" data-testid={testId}>
        <h2 className="mb-6 text-center text-tv-2xl font-bold text-tv-text">
          Add New Source
        </h2>
        <p className="mb-8 text-center text-tv-base text-tv-text-muted">
          Select the type of IPTV source you want to add
        </p>
        <div className="grid grid-cols-2 gap-6">
          <SourceTypeButton
            type="xtream"
            title="Xtream Codes"
            description="Connect using server URL, username and password"
            icon={
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            }
            onSelect={onSelect}
            focusKey="source-type-xtream"
            testId="source-type-xtream"
          />
          <SourceTypeButton
            type="m3u"
            title="M3U Playlist"
            description="Add a playlist URL directly"
            icon={
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            onSelect={onSelect}
            focusKey="source-type-m3u"
            testId="source-type-m3u"
          />
        </div>
      </div>
    </FocusContext.Provider>
  )
}

/**
 * AddSourceModal - A modal dialog for adding new IPTV sources.
 *
 * Features:
 * - Two-step flow: select source type, then fill in details
 * - Support for Xtream Codes and M3U playlist sources
 * - TV-optimized with spatial navigation
 * - Back navigation to return to source type selection
 * - Loading and error states
 */
export function AddSourceModal({
  isOpen,
  onClose,
  onAddSource,
  isLoading = false,
  error,
  testId,
}: AddSourceModalProps) {
  const [selectedType, setSelectedType] = useState<SourceType | null>(null)

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
    }
  }, [isOpen])

  const handleModalClose = useCallback(() => {
    setSelectedType(null)
    onClose()
  }, [onClose])

  const handleSelectType = useCallback((type: SourceType) => {
    setSelectedType(type)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedType(null)
  }, [])

  const handleXtreamSubmit = useCallback(
    (data: XtreamSourceInput) => {
      onAddSource('xtream', data)
    },
    [onAddSource]
  )

  const handleM3USubmit = useCallback(
    (data: M3USourceInput) => {
      onAddSource('m3u', data)
    },
    [onAddSource]
  )

  // Determine modal size based on content
  const modalSize = selectedType ? 'md' : 'lg'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      size={modalSize}
      testId={testId}
      focusKey="add-source-modal"
      closeOnEscape={!isLoading}
      closeOnBackdrop={!isLoading}
    >
      {selectedType === null && (
        <SourceTypeSelector
          onSelect={handleSelectType}
          testId="source-type-selector"
        />
      )}

      {selectedType === 'xtream' && (
        <XtreamLoginForm
          onSubmit={handleXtreamSubmit}
          onCancel={handleBack}
          isLoading={isLoading}
          error={error}
          testId="add-source-xtream-form"
        />
      )}

      {selectedType === 'm3u' && (
        <M3UUrlForm
          onSubmit={handleM3USubmit}
          onCancel={handleBack}
          isLoading={isLoading}
          error={error}
          testId="add-source-m3u-form"
        />
      )}
    </Modal>
  )
}
