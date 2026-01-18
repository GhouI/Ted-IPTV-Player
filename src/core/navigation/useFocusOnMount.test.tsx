import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, renderHook } from '@testing-library/react'
import { useFocusOnMount, useFocusRestoration } from './useFocusOnMount'
import * as spatialNav from '@noriginmedia/norigin-spatial-navigation'

// Mock the spatial navigation setFocus
vi.mock('@noriginmedia/norigin-spatial-navigation', async () => {
  const actual = await vi.importActual('@noriginmedia/norigin-spatial-navigation')
  return {
    ...actual,
    setFocus: vi.fn(),
  }
})

describe('useFocusOnMount', () => {
  const mockSetFocus = vi.mocked(spatialNav.setFocus)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function TestComponent({ focusKey, isReady = true, delay = 0, onlyOnMount = true }: {
    focusKey: string
    isReady?: boolean
    delay?: number
    onlyOnMount?: boolean
  }) {
    useFocusOnMount({ focusKey, isReady, delay, onlyOnMount })
    return <div data-testid="test">Test</div>
  }

  it('should set focus when ready', () => {
    render(<TestComponent focusKey="TEST_FOCUS" />)

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).toHaveBeenCalledWith('TEST_FOCUS')
  })

  it('should not set focus when not ready', () => {
    render(<TestComponent focusKey="TEST_FOCUS" isReady={false} />)

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).not.toHaveBeenCalled()
  })

  it('should delay setting focus when delay is specified', () => {
    render(<TestComponent focusKey="TEST_FOCUS" delay={100} />)

    // Before delay
    expect(mockSetFocus).not.toHaveBeenCalled()

    // After delay
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(mockSetFocus).toHaveBeenCalledWith('TEST_FOCUS')
  })

  it('should only focus once when onlyOnMount is true', () => {
    const { rerender } = render(
      <TestComponent focusKey="TEST_FOCUS" onlyOnMount={true} />
    )

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).toHaveBeenCalledTimes(1)

    // Rerender
    rerender(<TestComponent focusKey="TEST_FOCUS" onlyOnMount={true} />)

    act(() => {
      vi.runAllTimers()
    })

    // Should still be 1 since onlyOnMount is true
    expect(mockSetFocus).toHaveBeenCalledTimes(1)
  })

  it('should focus again when onlyOnMount is false and isReady changes', () => {
    const { rerender } = render(
      <TestComponent focusKey="TEST_FOCUS" isReady={false} onlyOnMount={false} />
    )

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).not.toHaveBeenCalled()

    // Make ready
    rerender(
      <TestComponent focusKey="TEST_FOCUS" isReady={true} onlyOnMount={false} />
    )

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).toHaveBeenCalledWith('TEST_FOCUS')
  })

  it('should set focus when isReady becomes true', () => {
    const { rerender } = render(
      <TestComponent focusKey="TEST_FOCUS" isReady={false} />
    )

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).not.toHaveBeenCalled()

    // Make ready
    rerender(<TestComponent focusKey="TEST_FOCUS" isReady={true} />)

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).toHaveBeenCalledWith('TEST_FOCUS')
  })
})

describe('useFocusRestoration', () => {
  const mockSetFocus = vi.mocked(spatialNav.setFocus)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Use renderHook for cleaner testing of the hook
  it('should save and restore focus', () => {
    // Create a focusable element with data-focus-key
    const focusedElement = document.createElement('button')
    focusedElement.setAttribute('data-focus-key', 'SAVED_FOCUS')
    document.body.appendChild(focusedElement)
    focusedElement.focus()

    const { result } = renderHook(() => useFocusRestoration())

    // Save focus
    act(() => {
      result.current.saveFocus()
    })

    // Restore focus
    act(() => {
      result.current.restoreFocus()
    })

    // Wait for the setTimeout
    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(mockSetFocus).toHaveBeenCalledWith('SAVED_FOCUS')

    // Cleanup
    document.body.removeChild(focusedElement)
  })

  it('should not restore focus if no focus was saved', () => {
    const { result } = renderHook(() => useFocusRestoration())

    // Try to restore without saving (no element has data-focus-key)
    act(() => {
      result.current.restoreFocus()
    })

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).not.toHaveBeenCalled()
  })

  it('should handle element without data-focus-key', () => {
    // Create an element without data-focus-key
    const focusedElement = document.createElement('button')
    document.body.appendChild(focusedElement)
    focusedElement.focus()

    const { result } = renderHook(() => useFocusRestoration())

    // Save focus (will be null since no data-focus-key)
    act(() => {
      result.current.saveFocus()
    })

    // Restore focus (should not call setFocus since lastFocusKey is null)
    act(() => {
      result.current.restoreFocus()
    })

    act(() => {
      vi.runAllTimers()
    })

    expect(mockSetFocus).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(focusedElement)
  })
})
