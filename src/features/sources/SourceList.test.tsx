import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SourceList } from './SourceList'
import type { Source, XtreamSource, M3USource } from '../../core/types/source'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockXtreamSource: XtreamSource = {
  id: 'xtream-1',
  name: 'My Xtream Source',
  type: 'xtream',
  serverUrl: 'http://example.com:8080',
  username: 'user',
  password: 'pass',
  createdAt: '2026-01-01T00:00:00Z',
}

const mockM3USource: M3USource = {
  id: 'm3u-1',
  name: 'My M3U Playlist',
  type: 'm3u',
  playlistUrl: 'http://example.com/playlist.m3u',
  createdAt: '2026-01-02T00:00:00Z',
}

const mockSources: Source[] = [mockXtreamSource, mockM3USource]

describe('SourceList', () => {
  const mockOnSelectSource = vi.fn()
  const mockOnRemoveSource = vi.fn()
  const mockOnAddSource = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders list of sources', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          testId="source-list"
        />
      )

      expect(screen.getByText('My Xtream Source')).toBeInTheDocument()
      expect(screen.getByText('My M3U Playlist')).toBeInTheDocument()
    })

    it('renders source type labels', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      // Check within the specific source items for type labels
      const xtreamItem = screen.getByTestId('source-item-xtream-1')
      const m3uItem = screen.getByTestId('source-item-m3u-1')

      expect(xtreamItem).toHaveTextContent('Xtream')
      expect(m3uItem).toHaveTextContent('M3U')
    })

    it('renders add source button', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText('Add Source')).toBeInTheDocument()
      expect(screen.getByTestId('add-source-btn')).toBeInTheDocument()
    })

    it('applies testId to container', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          testId="source-list"
        />
      )

      expect(screen.getByTestId('source-list')).toBeInTheDocument()
    })

    it('renders remove button for each source', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByTestId('source-item-xtream-1-remove-btn')).toBeInTheDocument()
      expect(screen.getByTestId('source-item-m3u-1-remove-btn')).toBeInTheDocument()
    })
  })

  describe('active source', () => {
    it('shows active indicator for active source', () => {
      render(
        <SourceList
          sources={mockSources}
          activeSourceId="xtream-1"
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const activeItem = screen.getByTestId('source-item-xtream-1')
      expect(activeItem).toHaveAttribute('data-active', 'true')
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('shows active label in source description', () => {
      render(
        <SourceList
          sources={mockSources}
          activeSourceId="m3u-1"
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText(/M3U.*Active/)).toBeInTheDocument()
    })

    it('does not show active indicator for inactive sources', () => {
      render(
        <SourceList
          sources={mockSources}
          activeSourceId="xtream-1"
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const inactiveItem = screen.getByTestId('source-item-m3u-1')
      expect(inactiveItem).toHaveAttribute('data-active', 'false')
    })
  })

  describe('interactions', () => {
    it('calls onSelectSource when a source is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-item-xtream-1'))

      expect(mockOnSelectSource).toHaveBeenCalledWith(mockXtreamSource)
    })

    it('calls onRemoveSource when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-item-xtream-1-remove-btn'))

      expect(mockOnRemoveSource).toHaveBeenCalledWith(mockXtreamSource)
    })

    it('does not call onSelectSource when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('source-item-m3u-1-remove-btn'))

      expect(mockOnRemoveSource).toHaveBeenCalledWith(mockM3USource)
      expect(mockOnSelectSource).not.toHaveBeenCalled()
    })

    it('calls onAddSource when add button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('add-source-btn'))

      expect(mockOnAddSource).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('renders empty state when no sources', () => {
      render(
        <SourceList
          sources={[]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          testId="source-list"
        />
      )

      expect(screen.getByText('No Sources Added')).toBeInTheDocument()
      expect(screen.getByText('Add an IPTV source to start watching')).toBeInTheDocument()
    })

    it('renders add button in empty state', () => {
      render(
        <SourceList
          sources={[]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText('Add Your First Source')).toBeInTheDocument()
      expect(screen.getByTestId('empty-add-source-btn')).toBeInTheDocument()
    })

    it('calls onAddSource when empty state button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SourceList
          sources={[]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      await user.click(screen.getByTestId('empty-add-source-btn'))

      expect(mockOnAddSource).toHaveBeenCalled()
    })

    it('applies empty state testId', () => {
      render(
        <SourceList
          sources={[]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          testId="source-list"
        />
      )

      expect(screen.getByTestId('source-list-empty')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders loading skeleton when isLoading is true', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          isLoading={true}
          testId="source-list"
        />
      )

      expect(screen.getByTestId('source-list-loading')).toBeInTheDocument()
    })

    it('does not render sources when loading', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          isLoading={true}
        />
      )

      expect(screen.queryByText('My Xtream Source')).not.toBeInTheDocument()
      expect(screen.queryByText('My M3U Playlist')).not.toBeInTheDocument()
    })

    it('renders loading skeletons', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
          isLoading={true}
          testId="source-list"
        />
      )

      // Should have skeleton items with pulse animation
      const loadingContainer = screen.getByTestId('source-list-loading')
      const skeletons = loadingContainer.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })
  })

  describe('focus states', () => {
    it('has data-focused attribute on source items', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const xtreamItem = screen.getByTestId('source-item-xtream-1')
      const m3uItem = screen.getByTestId('source-item-m3u-1')

      expect(xtreamItem).toHaveAttribute('data-focused')
      expect(m3uItem).toHaveAttribute('data-focused')
    })

    it('has data-focused attribute on add source button', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const addButton = screen.getByTestId('add-source-btn')
      expect(addButton).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has role button on source items', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const xtreamItem = screen.getByTestId('source-item-xtream-1')
      expect(xtreamItem).toHaveAttribute('role', 'button')
    })

    it('has tabIndex on source items', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const xtreamItem = screen.getByTestId('source-item-xtream-1')
      expect(xtreamItem).toHaveAttribute('tabIndex', '0')
    })

    it('has aria-label on remove buttons', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const removeButton = screen.getByTestId('source-item-xtream-1-remove-btn')
      expect(removeButton).toHaveAttribute('aria-label', 'Remove My Xtream Source')
    })
  })

  describe('icons', () => {
    it('renders server icon for Xtream sources', () => {
      render(
        <SourceList
          sources={[mockXtreamSource]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const sourceItem = screen.getByTestId('source-item-xtream-1')
      expect(sourceItem.querySelector('svg')).toBeInTheDocument()
    })

    it('renders document icon for M3U sources', () => {
      render(
        <SourceList
          sources={[mockM3USource]}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const sourceItem = screen.getByTestId('source-item-m3u-1')
      expect(sourceItem.querySelector('svg')).toBeInTheDocument()
    })

    it('renders plus icon on add button', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const addButton = screen.getByTestId('add-source-btn')
      expect(addButton.querySelector('svg')).toBeInTheDocument()
    })

    it('renders trash icon on remove buttons', () => {
      render(
        <SourceList
          sources={mockSources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      const removeButton = screen.getByTestId('source-item-xtream-1-remove-btn')
      expect(removeButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('multiple sources', () => {
    it('renders many sources correctly', () => {
      const manySources: Source[] = [
        mockXtreamSource,
        mockM3USource,
        { ...mockXtreamSource, id: 'xtream-2', name: 'Second Xtream' },
        { ...mockM3USource, id: 'm3u-2', name: 'Second M3U' },
      ]

      render(
        <SourceList
          sources={manySources}
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByText('My Xtream Source')).toBeInTheDocument()
      expect(screen.getByText('My M3U Playlist')).toBeInTheDocument()
      expect(screen.getByText('Second Xtream')).toBeInTheDocument()
      expect(screen.getByText('Second M3U')).toBeInTheDocument()
    })

    it('handles active source among many sources', () => {
      const manySources: Source[] = [
        mockXtreamSource,
        mockM3USource,
        { ...mockXtreamSource, id: 'xtream-2', name: 'Second Xtream' },
      ]

      render(
        <SourceList
          sources={manySources}
          activeSourceId="xtream-2"
          onSelectSource={mockOnSelectSource}
          onRemoveSource={mockOnRemoveSource}
          onAddSource={mockOnAddSource}
        />
      )

      expect(screen.getByTestId('source-item-xtream-1')).toHaveAttribute('data-active', 'false')
      expect(screen.getByTestId('source-item-m3u-1')).toHaveAttribute('data-active', 'false')
      expect(screen.getByTestId('source-item-xtream-2')).toHaveAttribute('data-active', 'true')
    })
  })
})
