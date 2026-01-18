import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBackHandler } from './useBackHandler'
import { VIDAA_KEY_CODES } from './SpatialNavigationProvider'
import { KeyEventManager } from './KeyEventManager'

describe('useBackHandler', () => {
  const createKeyboardEvent = (keyCode: number): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(event, 'keyCode', { value: keyCode })
    return event
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Clean up KeyEventManager between tests
    KeyEventManager.destroy()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    KeyEventManager.destroy()
  })

  it('should initialize with showExitDialog as false', () => {
    const { result } = renderHook(() => useBackHandler())
    expect(result.current.showExitDialog).toBe(false)
  })

  it('should show exit dialog when VIDAA back button is pressed at root', () => {
    const { result } = renderHook(() => useBackHandler())

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })

    expect(result.current.showExitDialog).toBe(true)
  })

  it('should show exit dialog when backspace is pressed at root (fallback)', () => {
    const { result } = renderHook(() => useBackHandler())

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK_ALT))
    })

    expect(result.current.showExitDialog).toBe(true)
  })

  it('should not show exit dialog for other key presses', () => {
    const { result } = renderHook(() => useBackHandler())

    act(() => {
      window.dispatchEvent(createKeyboardEvent(13)) // Enter key
    })

    expect(result.current.showExitDialog).toBe(false)
  })

  it('should call onBack callback and not show dialog if onBack returns true', () => {
    const onBack = vi.fn().mockReturnValue(true)
    const { result } = renderHook(() => useBackHandler({ onBack }))

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(result.current.showExitDialog).toBe(false)
  })

  it('should show exit dialog if onBack returns false', () => {
    const onBack = vi.fn().mockReturnValue(false)
    const { result } = renderHook(() => useBackHandler({ onBack }))

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(result.current.showExitDialog).toBe(true)
  })

  it('should cancel exit dialog when cancelExit is called', () => {
    const { result } = renderHook(() => useBackHandler())

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })
    expect(result.current.showExitDialog).toBe(true)

    act(() => {
      result.current.cancelExit()
    })
    expect(result.current.showExitDialog).toBe(false)
  })

  it('should cancel exit dialog when back is pressed while dialog is open', () => {
    const { result } = renderHook(() => useBackHandler())

    // Open dialog
    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })
    expect(result.current.showExitDialog).toBe(true)

    // Press back again to cancel
    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })
    expect(result.current.showExitDialog).toBe(false)
  })

  it('should not show exit dialog when showExitConfirmation is false', () => {
    const windowCloseSpy = vi.spyOn(window, 'close').mockImplementation(() => {})
    const { result } = renderHook(() => useBackHandler({ showExitConfirmation: false }))

    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })

    expect(result.current.showExitDialog).toBe(false)
    expect(windowCloseSpy).toHaveBeenCalled()
  })

  it('should call window.close when confirmExit is called without platform APIs', () => {
    const windowCloseSpy = vi.spyOn(window, 'close').mockImplementation(() => {})
    const { result } = renderHook(() => useBackHandler())

    act(() => {
      result.current.confirmExit()
    })

    expect(windowCloseSpy).toHaveBeenCalled()
  })

  it('should close exit dialog when confirmExit is called', () => {
    vi.spyOn(window, 'close').mockImplementation(() => {})
    const { result } = renderHook(() => useBackHandler())

    // Open dialog
    act(() => {
      window.dispatchEvent(createKeyboardEvent(VIDAA_KEY_CODES.BACK))
    })
    expect(result.current.showExitDialog).toBe(true)

    // Confirm exit
    act(() => {
      result.current.confirmExit()
    })
    expect(result.current.showExitDialog).toBe(false)
  })

  it('should unregister from KeyEventManager on unmount', () => {
    const { unmount } = renderHook(() => useBackHandler({ handlerId: 'test-back-handler' }))

    // Handler should be registered
    expect(KeyEventManager.getRegisteredHandlers()).toContain('test-back-handler')

    unmount()

    // Handler should be unregistered
    expect(KeyEventManager.getRegisteredHandlers()).not.toContain('test-back-handler')
  })

  it('should prevent default and stop propagation on back button press', () => {
    renderHook(() => useBackHandler())

    const event = createKeyboardEvent(VIDAA_KEY_CODES.BACK)
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(stopPropagationSpy).toHaveBeenCalled()
  })

  it('should use tizen API when available', () => {
    const mockExit = vi.fn()
    const mockGetCurrentApplication = vi.fn().mockReturnValue({ exit: mockExit })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).tizen = {
      application: {
        getCurrentApplication: mockGetCurrentApplication,
      },
    }

    const { result } = renderHook(() => useBackHandler())

    act(() => {
      result.current.confirmExit()
    })

    expect(mockGetCurrentApplication).toHaveBeenCalled()
    expect(mockExit).toHaveBeenCalled()

    // Cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).tizen
  })

  it('should use webOS API when available and tizen is not', () => {
    const mockPlatformBack = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).webOS = {
      platformBack: mockPlatformBack,
    }

    const { result } = renderHook(() => useBackHandler())

    act(() => {
      result.current.confirmExit()
    })

    expect(mockPlatformBack).toHaveBeenCalled()

    // Cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webOS
  })
})
