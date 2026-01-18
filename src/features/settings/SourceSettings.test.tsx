import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SourceSettings } from './SourceSettings'
import type { Source, XtreamSource, M3USource } from '../../core/types/source'

// Initialize spatial navigation before tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

// Mock sources for testing
const mockXtreamSource: XtreamSource = {
  id: 'xtream-1',
  name: 'My Xtream Provider',
  type: 'xtream',
  serverUrl: 'http://example.com',
  username: 'user',
  password: 'pass',
}

const mockM3USource: M3USource = {
  id: 'm3u-1',
  name: 'My M3U Playlist',
  type: 'm3u',
  url: 'http://example.com/playlist.m3u',
}

const mockSources: Source[] = [mockXtreamSource, mockM3USource]

describe('SourceSettings', () => {
  describe('rendering', () => {
    it('should render the source settings section', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      expect(screen.getByText('IPTV Sources')).toBeInTheDocument()
    })

    it('should render with test ID', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      expect(screen.getByTestId('sources')).toBeInTheDocument()
    })

    it('should render add source button', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      expect(screen.getByTestId('sources-add-btn')).toBeInTheDocument()
      expect(screen.getByText('Add Source')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should display empty state when no sources', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      expect(screen.getByTestId('sources-empty')).toBeInTheDocument()
      expect(screen.getByText('No Sources Added')).toBeInTheDocument()
      expect(
        screen.getByText('Add an IPTV source to start watching')
      ).toBeInTheDocument()
    })

    it('should display empty state icon', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      const emptyState = screen.getByTestId('sources-empty')
      expect(emptyState.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('source list', () => {
    it('should display all sources', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(screen.getByText('My Xtream Provider')).toBeInTheDocument()
      expect(screen.getByText('My M3U Playlist')).toBeInTheDocument()
    })

    it('should display source type labels', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(screen.getByText('Xtream Codes')).toBeInTheDocument()
      expect(screen.getByText('M3U Playlist')).toBeInTheDocument()
    })

    it('should render source items with correct test IDs', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(screen.getByTestId('sources-source-xtream-1')).toBeInTheDocument()
      expect(screen.getByTestId('sources-source-m3u-1')).toBeInTheDocument()
    })

    it('should not show empty state when sources exist', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(screen.queryByTestId('sources-empty')).not.toBeInTheDocument()
    })
  })

  describe('active source', () => {
    it('should highlight active source', () => {
      render(
        <SourceSettings
          sources={mockSources}
          activeSourceId="xtream-1"
          testId="sources"
        />
      )

      const activeSource = screen.getByTestId('sources-source-xtream-1')
      expect(activeSource).toHaveAttribute('data-active', 'true')
    })

    it('should display Active badge on active source', () => {
      render(
        <SourceSettings
          sources={mockSources}
          activeSourceId="xtream-1"
          testId="sources"
        />
      )

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show Active text in subtitle for active source', () => {
      render(
        <SourceSettings
          sources={mockSources}
          activeSourceId="xtream-1"
          testId="sources"
        />
      )

      expect(screen.getByText(/Xtream Codes.*Active/)).toBeInTheDocument()
    })

    it('should not highlight inactive sources', () => {
      render(
        <SourceSettings
          sources={mockSources}
          activeSourceId="xtream-1"
          testId="sources"
        />
      )

      const inactiveSource = screen.getByTestId('sources-source-m3u-1')
      expect(inactiveSource).toHaveAttribute('data-active', 'false')
    })

    it('should handle null activeSourceId', () => {
      render(
        <SourceSettings
          sources={mockSources}
          activeSourceId={null}
          testId="sources"
        />
      )

      const source1 = screen.getByTestId('sources-source-xtream-1')
      const source2 = screen.getByTestId('sources-source-m3u-1')

      expect(source1).toHaveAttribute('data-active', 'false')
      expect(source2).toHaveAttribute('data-active', 'false')
    })
  })

  describe('source selection', () => {
    it('should call onSelectSource when source is clicked', () => {
      const onSelectSource = vi.fn()
      render(
        <SourceSettings
          sources={mockSources}
          onSelectSource={onSelectSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-source-xtream-1'))

      expect(onSelectSource).toHaveBeenCalledWith(mockXtreamSource)
    })

    it('should call onSelectSource with correct source', () => {
      const onSelectSource = vi.fn()
      render(
        <SourceSettings
          sources={mockSources}
          onSelectSource={onSelectSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-source-m3u-1'))

      expect(onSelectSource).toHaveBeenCalledWith(mockM3USource)
    })

    it('should handle missing onSelectSource gracefully', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      // Should not throw when clicking without callback
      expect(() =>
        fireEvent.click(screen.getByTestId('sources-source-xtream-1'))
      ).not.toThrow()
    })
  })

  describe('source removal', () => {
    it('should render remove button for each source', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(
        screen.getByTestId('sources-source-xtream-1-remove-btn')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('sources-source-m3u-1-remove-btn')
      ).toBeInTheDocument()
    })

    it('should call onRemoveSource when remove button is clicked', () => {
      const onRemoveSource = vi.fn()
      render(
        <SourceSettings
          sources={mockSources}
          onRemoveSource={onRemoveSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-source-xtream-1-remove-btn'))

      expect(onRemoveSource).toHaveBeenCalledWith(mockXtreamSource)
    })

    it('should not trigger source selection when remove is clicked', () => {
      const onSelectSource = vi.fn()
      const onRemoveSource = vi.fn()
      render(
        <SourceSettings
          sources={mockSources}
          onSelectSource={onSelectSource}
          onRemoveSource={onRemoveSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-source-xtream-1-remove-btn'))

      expect(onRemoveSource).toHaveBeenCalled()
      expect(onSelectSource).not.toHaveBeenCalled()
    })

    it('should handle missing onRemoveSource gracefully', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(() =>
        fireEvent.click(screen.getByTestId('sources-source-xtream-1-remove-btn'))
      ).not.toThrow()
    })

    it('should have aria-label on remove buttons', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      const removeBtn = screen.getByTestId('sources-source-xtream-1-remove-btn')
      expect(removeBtn).toHaveAttribute(
        'aria-label',
        'Remove My Xtream Provider'
      )
    })
  })

  describe('add source', () => {
    it('should call onAddSource when add button is clicked', () => {
      const onAddSource = vi.fn()
      render(
        <SourceSettings
          sources={[]}
          onAddSource={onAddSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-add-btn'))

      expect(onAddSource).toHaveBeenCalled()
    })

    it('should handle missing onAddSource gracefully', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      expect(() =>
        fireEvent.click(screen.getByTestId('sources-add-btn'))
      ).not.toThrow()
    })

    it('should display add source button when sources exist', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      expect(screen.getByTestId('sources-add-btn')).toBeInTheDocument()
    })
  })

  describe('focus states', () => {
    it('should have data-focused attribute on source items', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      const source = screen.getByTestId('sources-source-xtream-1')
      expect(source).toHaveAttribute('data-focused')
    })

    it('should have data-focused attribute on add button', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      const addBtn = screen.getByTestId('sources-add-btn')
      expect(addBtn).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('should have proper role on source items', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      const source = screen.getByTestId('sources-source-xtream-1')
      expect(source).toHaveAttribute('role', 'button')
    })

    it('should have tabIndex on source items', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      const source = screen.getByTestId('sources-source-xtream-1')
      expect(source).toHaveAttribute('tabIndex', '0')
    })

    it('should have proper button type on add button', () => {
      render(<SourceSettings sources={[]} testId="sources" />)

      const addBtn = screen.getByTestId('sources-add-btn')
      expect(addBtn.tagName).toBe('BUTTON')
      expect(addBtn).toHaveAttribute('type', 'button')
    })

    it('should have proper button type on remove buttons', () => {
      render(<SourceSettings sources={mockSources} testId="sources" />)

      const removeBtn = screen.getByTestId('sources-source-xtream-1-remove-btn')
      expect(removeBtn.tagName).toBe('BUTTON')
      expect(removeBtn).toHaveAttribute('type', 'button')
    })
  })

  describe('source type icons', () => {
    it('should display Xtream icon for Xtream sources', () => {
      render(
        <SourceSettings sources={[mockXtreamSource]} testId="sources" />
      )

      const source = screen.getByTestId('sources-source-xtream-1')
      expect(source.querySelector('svg')).toBeInTheDocument()
    })

    it('should display M3U icon for M3U sources', () => {
      render(
        <SourceSettings sources={[mockM3USource]} testId="sources" />
      )

      const source = screen.getByTestId('sources-source-m3u-1')
      expect(source.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('multiple sources', () => {
    it('should render multiple sources in order', () => {
      const sources: Source[] = [
        { ...mockXtreamSource, id: '1', name: 'First' },
        { ...mockXtreamSource, id: '2', name: 'Second' },
        { ...mockXtreamSource, id: '3', name: 'Third' },
      ]
      render(<SourceSettings sources={sources} testId="sources" />)

      const sourceNames = screen.getAllByText(/First|Second|Third/)
      expect(sourceNames).toHaveLength(3)
    })

    it('should allow selecting different sources', () => {
      const onSelectSource = vi.fn()
      const sources: Source[] = [
        { ...mockXtreamSource, id: '1', name: 'First' },
        { ...mockXtreamSource, id: '2', name: 'Second' },
      ]
      render(
        <SourceSettings
          sources={sources}
          onSelectSource={onSelectSource}
          testId="sources"
        />
      )

      fireEvent.click(screen.getByTestId('sources-source-1'))
      expect(onSelectSource).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: '1' })
      )

      fireEvent.click(screen.getByTestId('sources-source-2'))
      expect(onSelectSource).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: '2' })
      )
    })
  })

  describe('without testId', () => {
    it('should render without testId prop', () => {
      render(<SourceSettings sources={mockSources} />)

      expect(screen.getByText('IPTV Sources')).toBeInTheDocument()
      expect(screen.getByText('My Xtream Provider')).toBeInTheDocument()
    })

    it('should not render test IDs when not provided', () => {
      const { container } = render(<SourceSettings sources={mockSources} />)

      expect(container.querySelector('[data-testid]')).toBeNull()
    })
  })
})
