import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonList } from './Skeleton'

describe('Skeleton', () => {
  it('should render with default props', () => {
    render(<Skeleton testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  })

  it('should apply width as string', () => {
    render(<Skeleton width="200px" testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '200px' })
  })

  it('should apply width as number (pixels)', () => {
    render(<Skeleton width={150} testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '150px' })
  })

  it('should apply height as string', () => {
    render(<Skeleton height="50px" testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ height: '50px' })
  })

  it('should apply height as number (pixels)', () => {
    render(<Skeleton height={100} testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ height: '100px' })
  })

  it('should apply default height for text variant', () => {
    render(<Skeleton variant="text" testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ height: '1em' })
  })

  it('should apply rounded class for text variant', () => {
    render(<Skeleton variant="text" testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded')
  })

  it('should apply rounded-full class for circular variant', () => {
    render(<Skeleton variant="circular" testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full')
  })

  it('should apply rounded-lg class for rounded variant', () => {
    render(<Skeleton variant="rounded" testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-lg')
  })

  it('should not apply border radius for rectangular variant', () => {
    render(<Skeleton variant="rectangular" testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).not.toHaveClass('rounded')
    expect(skeleton).not.toHaveClass('rounded-lg')
    expect(skeleton).not.toHaveClass('rounded-full')
  })

  it('should apply pulse animation by default', () => {
    render(<Skeleton testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse')
  })

  it('should apply wave animation class', () => {
    render(<Skeleton animation="wave" testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton-wave')
  })

  it('should not apply animation class when animation is none', () => {
    render(<Skeleton animation="none" testId="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).not.toHaveClass('animate-pulse')
    expect(skeleton).not.toHaveClass('skeleton-wave')
  })

  it('should apply additional className', () => {
    render(<Skeleton className="custom-class" testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('custom-class')
  })

  it('should apply bg-tv-border class', () => {
    render(<Skeleton testId="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('bg-tv-border')
  })

  it('should render multiple skeletons when count > 1', () => {
    render(<Skeleton count={3} testId="skeleton" />)

    expect(screen.getByTestId('skeleton-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-2')).toBeInTheDocument()
  })

  it('should apply gap to container when count > 1', () => {
    render(<Skeleton count={2} gap="1rem" testId="skeleton" />)

    const container = screen.getByTestId('skeleton')
    expect(container).toHaveStyle({ gap: '1rem' })
  })

  it('should apply gap as pixels when number is provided', () => {
    render(<Skeleton count={2} gap={16} testId="skeleton" />)

    const container = screen.getByTestId('skeleton')
    expect(container).toHaveStyle({ gap: '16px' })
  })
})

describe('SkeletonCard', () => {
  it('should render with default props', () => {
    render(<SkeletonCard testId="skeleton-card" />)

    const card = screen.getByTestId('skeleton-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('aria-hidden', 'true')
  })

  it('should render text lines by default', () => {
    render(<SkeletonCard testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card-text-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-card-text-1')).toBeInTheDocument()
  })

  it('should not render text lines when showText is false', () => {
    render(<SkeletonCard showText={false} testId="skeleton-card" />)

    expect(screen.queryByTestId('skeleton-card-text-0')).not.toBeInTheDocument()
  })

  it('should render correct number of text lines', () => {
    render(<SkeletonCard textLines={3} testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card-text-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-card-text-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-card-text-2')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton-card-text-3')).not.toBeInTheDocument()
  })

  it('should apply additional className', () => {
    render(<SkeletonCard className="custom-class" testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card')).toHaveClass('custom-class')
  })

  it('should render with square aspect ratio', () => {
    render(<SkeletonCard aspectRatio="square" testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument()
  })

  it('should render with video aspect ratio', () => {
    render(<SkeletonCard aspectRatio="video" testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument()
  })

  it('should render with poster aspect ratio', () => {
    render(<SkeletonCard aspectRatio="poster" testId="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument()
  })
})

describe('SkeletonList', () => {
  it('should render with default props', () => {
    render(<SkeletonList testId="skeleton-list" />)

    const list = screen.getByTestId('skeleton-list')
    expect(list).toBeInTheDocument()
    expect(list).toHaveAttribute('aria-hidden', 'true')
  })

  it('should render 5 items by default', () => {
    render(<SkeletonList testId="skeleton-list" />)

    expect(screen.getByTestId('skeleton-list-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-2')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-3')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-4')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton-list-item-5')).not.toBeInTheDocument()
  })

  it('should render correct number of items', () => {
    render(<SkeletonList count={3} testId="skeleton-list" />)

    expect(screen.getByTestId('skeleton-list-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-list-item-2')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton-list-item-3')).not.toBeInTheDocument()
  })

  it('should apply gap as string', () => {
    render(<SkeletonList gap="1rem" testId="skeleton-list" />)

    const list = screen.getByTestId('skeleton-list')
    expect(list).toHaveStyle({ gap: '1rem' })
  })

  it('should apply gap as pixels when number is provided', () => {
    render(<SkeletonList gap={20} testId="skeleton-list" />)

    const list = screen.getByTestId('skeleton-list')
    expect(list).toHaveStyle({ gap: '20px' })
  })

  it('should apply additional className', () => {
    render(<SkeletonList className="custom-class" testId="skeleton-list" />)

    expect(screen.getByTestId('skeleton-list')).toHaveClass('custom-class')
  })

  it('should render items with rounded variant', () => {
    render(<SkeletonList count={1} testId="skeleton-list" />)

    expect(screen.getByTestId('skeleton-list-item-0')).toHaveClass('rounded-lg')
  })
})
