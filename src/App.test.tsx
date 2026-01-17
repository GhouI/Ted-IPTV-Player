import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Ted IPTV Player')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<App />)
    expect(
      screen.getByText('Open-source IPTV player for Hisense/VIDAA')
    ).toBeInTheDocument()
  })

  it('applies Tailwind classes to the main container', () => {
    render(<App />)
    const container = screen.getByText('Ted IPTV Player').closest('div')
    expect(container).toHaveClass('flex', 'min-h-screen', 'flex-col', 'items-center', 'justify-center')
  })

  it('applies TV-specific background and text classes', () => {
    render(<App />)
    const container = screen.getByText('Ted IPTV Player').closest('div')
    expect(container).toHaveClass('bg-tv-bg', 'text-tv-text')
  })

  it('applies TV font size class to description', () => {
    render(<App />)
    const description = screen.getByText('Open-source IPTV player for Hisense/VIDAA')
    expect(description).toHaveClass('text-tv-lg', 'text-tv-text-muted')
  })
})
