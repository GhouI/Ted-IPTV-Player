import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { HomePage } from './HomePage'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

describe('HomePage', () => {
  const defaultProps = {
    onNavigateLiveTV: vi.fn(),
    onNavigateVOD: vi.fn(),
    onNavigateSeries: vi.fn(),
    onNavigateEPG: vi.fn(),
    onNavigateSettings: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders page title', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByText('Ted IPTV Player')).toBeInTheDocument()
    })

    it('renders page subtitle', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByText('Select an option to get started')).toBeInTheDocument()
    })

    it('renders navigation hint in footer', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByText('Use arrow keys to navigate, OK to select')).toBeInTheDocument()
    })

    it('applies testId', () => {
      render(<HomePage {...defaultProps} testId="home-page" />)
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  describe('menu items', () => {
    it('renders Live TV menu card', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-live-tv')).toBeInTheDocument()
      expect(screen.getByText('Live TV')).toBeInTheDocument()
      expect(screen.getByText('Watch live channels')).toBeInTheDocument()
    })

    it('renders Movies (VOD) menu card', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-vod')).toBeInTheDocument()
      expect(screen.getByText('Movies')).toBeInTheDocument()
      expect(screen.getByText('Browse movies')).toBeInTheDocument()
    })

    it('renders Series menu card', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-series')).toBeInTheDocument()
      expect(screen.getByText('Series')).toBeInTheDocument()
      expect(screen.getByText('Watch TV series')).toBeInTheDocument()
    })

    it('renders TV Guide (EPG) menu card', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-epg')).toBeInTheDocument()
      expect(screen.getByText('TV Guide')).toBeInTheDocument()
      expect(screen.getByText('Program schedule')).toBeInTheDocument()
    })

    it('renders Settings menu card', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-settings')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Configure app')).toBeInTheDocument()
    })

    it('renders all 5 menu cards', () => {
      render(<HomePage {...defaultProps} />)
      expect(screen.getByTestId('menu-live-tv')).toBeInTheDocument()
      expect(screen.getByTestId('menu-vod')).toBeInTheDocument()
      expect(screen.getByTestId('menu-series')).toBeInTheDocument()
      expect(screen.getByTestId('menu-epg')).toBeInTheDocument()
      expect(screen.getByTestId('menu-settings')).toBeInTheDocument()
    })
  })

  describe('navigation callbacks', () => {
    it('calls onNavigateLiveTV when Live TV is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage {...defaultProps} />)

      await user.click(screen.getByTestId('menu-live-tv'))
      expect(defaultProps.onNavigateLiveTV).toHaveBeenCalledTimes(1)
    })

    it('calls onNavigateVOD when Movies is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage {...defaultProps} />)

      await user.click(screen.getByTestId('menu-vod'))
      expect(defaultProps.onNavigateVOD).toHaveBeenCalledTimes(1)
    })

    it('calls onNavigateSeries when Series is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage {...defaultProps} />)

      await user.click(screen.getByTestId('menu-series'))
      expect(defaultProps.onNavigateSeries).toHaveBeenCalledTimes(1)
    })

    it('calls onNavigateEPG when TV Guide is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage {...defaultProps} />)

      await user.click(screen.getByTestId('menu-epg'))
      expect(defaultProps.onNavigateEPG).toHaveBeenCalledTimes(1)
    })

    it('calls onNavigateSettings when Settings is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage {...defaultProps} />)

      await user.click(screen.getByTestId('menu-settings'))
      expect(defaultProps.onNavigateSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('navigation callbacks with undefined handlers', () => {
    it('handles missing onNavigateLiveTV gracefully', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // Should not throw
      await user.click(screen.getByTestId('menu-live-tv'))
    })

    it('handles missing onNavigateVOD gracefully', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await user.click(screen.getByTestId('menu-vod'))
    })

    it('handles missing onNavigateSeries gracefully', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await user.click(screen.getByTestId('menu-series'))
    })

    it('handles missing onNavigateEPG gracefully', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await user.click(screen.getByTestId('menu-epg'))
    })

    it('handles missing onNavigateSettings gracefully', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await user.click(screen.getByTestId('menu-settings'))
    })
  })

  describe('accessibility', () => {
    it('has navigation landmark with label', () => {
      render(<HomePage {...defaultProps} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Main menu')
    })

    it('menu cards have button role', () => {
      render(<HomePage {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('renders header element', () => {
      render(<HomePage {...defaultProps} />)
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('renders footer element', () => {
      render(<HomePage {...defaultProps} />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })
  })

  describe('icons', () => {
    it('renders SVG icons in menu cards', () => {
      render(<HomePage {...defaultProps} />)

      // Each menu card should contain an SVG icon
      const liveTvCard = screen.getByTestId('menu-live-tv')
      const vodCard = screen.getByTestId('menu-vod')
      const seriesCard = screen.getByTestId('menu-series')
      const epgCard = screen.getByTestId('menu-epg')
      const settingsCard = screen.getByTestId('menu-settings')

      expect(liveTvCard.querySelector('svg')).toBeInTheDocument()
      expect(vodCard.querySelector('svg')).toBeInTheDocument()
      expect(seriesCard.querySelector('svg')).toBeInTheDocument()
      expect(epgCard.querySelector('svg')).toBeInTheDocument()
      expect(settingsCard.querySelector('svg')).toBeInTheDocument()
    })

    it('icons have aria-hidden attribute', () => {
      render(<HomePage {...defaultProps} />)

      const svgs = document.querySelectorAll('svg')
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('layout', () => {
    it('has grid layout for menu items', () => {
      render(<HomePage {...defaultProps} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('grid', 'grid-cols-5')
    })

    it('is centered on the page', () => {
      render(<HomePage {...defaultProps} testId="home-page" />)
      const container = screen.getByTestId('home-page')
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen')
    })
  })
})
