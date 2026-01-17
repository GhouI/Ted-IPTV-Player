import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpatialNavigationProvider, VIDAA_KEY_CODES } from './SpatialNavigationProvider'

// Mock the norigin-spatial-navigation module
vi.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  init: vi.fn(),
  setKeyMap: vi.fn(),
}))

import { init, setKeyMap } from '@noriginmedia/norigin-spatial-navigation'

describe('SpatialNavigationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children correctly', () => {
    render(
      <SpatialNavigationProvider>
        <div data-testid="child">Test Child</div>
      </SpatialNavigationProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('initializes spatial navigation on mount', () => {
    render(
      <SpatialNavigationProvider>
        <div>Content</div>
      </SpatialNavigationProvider>
    )

    expect(init).toHaveBeenCalledWith({
      debug: expect.any(Boolean),
      visualDebug: false,
      distanceCalculationMethod: 'center',
      throttle: 100,
    })
  })

  it('sets up VIDAA key map on mount', () => {
    render(
      <SpatialNavigationProvider>
        <div>Content</div>
      </SpatialNavigationProvider>
    )

    expect(setKeyMap).toHaveBeenCalledWith({
      left: VIDAA_KEY_CODES.LEFT,
      right: VIDAA_KEY_CODES.RIGHT,
      up: VIDAA_KEY_CODES.UP,
      down: VIDAA_KEY_CODES.DOWN,
      enter: VIDAA_KEY_CODES.ENTER,
    })
  })
})

describe('VIDAA_KEY_CODES', () => {
  it('exports correct key codes for VIDAA remote', () => {
    expect(VIDAA_KEY_CODES.LEFT).toBe(37)
    expect(VIDAA_KEY_CODES.RIGHT).toBe(39)
    expect(VIDAA_KEY_CODES.UP).toBe(38)
    expect(VIDAA_KEY_CODES.DOWN).toBe(40)
    expect(VIDAA_KEY_CODES.ENTER).toBe(13)
    expect(VIDAA_KEY_CODES.BACK).toBe(461)
    expect(VIDAA_KEY_CODES.BACK_ALT).toBe(8)
  })
})
