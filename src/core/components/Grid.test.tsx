import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from './Grid'
import { FocusableCard } from './FocusableCard'
import { SpatialNavigationProvider } from '../navigation/SpatialNavigationProvider'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SpatialNavigationProvider>{ui}</SpatialNavigationProvider>)
}

describe('Grid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children content', () => {
    renderWithProvider(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should have role="grid"', () => {
    renderWithProvider(
      <Grid testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('should apply testId as data-testid', () => {
    renderWithProvider(
      <Grid testId="my-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('my-grid')).toBeInTheDocument()
  })

  it('should apply additional className', () => {
    renderWithProvider(
      <Grid className="custom-class" testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('custom-class')
  })

  it('should apply default 4 columns class', () => {
    renderWithProvider(
      <Grid testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid-cols-4')
  })

  it('should apply 2 columns class', () => {
    renderWithProvider(
      <Grid columns={2} testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid-cols-2')
  })

  it('should apply 3 columns class', () => {
    renderWithProvider(
      <Grid columns={3} testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid-cols-3')
  })

  it('should apply 5 columns class', () => {
    renderWithProvider(
      <Grid columns={5} testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid-cols-5')
  })

  it('should apply 6 columns class', () => {
    renderWithProvider(
      <Grid columns={6} testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid-cols-6')
  })

  it('should apply default md gap class', () => {
    renderWithProvider(
      <Grid testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('gap-4')
  })

  it('should apply sm gap class', () => {
    renderWithProvider(
      <Grid gap="sm" testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('gap-2')
  })

  it('should apply lg gap class', () => {
    renderWithProvider(
      <Grid gap="lg" testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('gap-6')
  })

  it('should have grid base class', () => {
    renderWithProvider(
      <Grid testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    expect(screen.getByTestId('test-grid')).toHaveClass('grid')
  })

  it('should render with FocusableCard children', () => {
    renderWithProvider(
      <Grid testId="test-grid">
        <FocusableCard testId="card-1">
          <span>Card 1</span>
        </FocusableCard>
        <FocusableCard testId="card-2">
          <span>Card 2</span>
        </FocusableCard>
      </Grid>
    )

    expect(screen.getByTestId('card-1')).toBeInTheDocument()
    expect(screen.getByTestId('card-2')).toBeInTheDocument()
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
  })

  it('should render with multiple columns and gap configurations', () => {
    renderWithProvider(
      <Grid columns={3} gap="lg" testId="test-grid">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    )

    const grid = screen.getByTestId('test-grid')
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-3')
    expect(grid).toHaveClass('gap-6')
  })

  it('should combine all classes correctly', () => {
    renderWithProvider(
      <Grid columns={5} gap="sm" className="my-custom-class" testId="test-grid">
        <div>Item</div>
      </Grid>
    )

    const grid = screen.getByTestId('test-grid')
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-5')
    expect(grid).toHaveClass('gap-2')
    expect(grid).toHaveClass('my-custom-class')
  })

  it('should render empty grid without children', () => {
    renderWithProvider(<Grid testId="test-grid">{null}</Grid>)

    expect(screen.getByTestId('test-grid')).toBeInTheDocument()
  })

  it('should work with dynamic children', () => {
    const items = ['A', 'B', 'C', 'D']

    renderWithProvider(
      <Grid testId="test-grid">
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </Grid>
    )

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })
})
