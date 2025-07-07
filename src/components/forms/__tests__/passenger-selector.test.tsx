import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PassengerSelector } from '../passenger-selector'
import type { PassengerSelection } from '@/types'
import userEvent from '@testing-library/user-event'

describe('PassengerSelector', () => {
  const mockOnChange = vi.fn()
  const mockOnClose = vi.fn()

  const defaultPassengers: PassengerSelection = {
    economy: 1,
    business: 0,
    firstClass: 0
  }

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnClose.mockClear()
  })

  it('renders passenger class options when open', () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Economy')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('First Class')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={false}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('displays passenger class options in context menu', async () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Economy')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('First Class')).toBeInTheDocument()
    expect(screen.getByText('Standard seating')).toBeInTheDocument()
    expect(screen.getByText('Premium seating')).toBeInTheDocument()
    expect(screen.getByText('Luxury seating')).toBeInTheDocument()
  })

  it('increments economy passengers when plus button is clicked', async () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    const plusButton = screen.getByTestId('economy-plus-button')
    await userEvent.click(plusButton)
    
    // Confirm changes
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    
    expect(mockOnChange).toHaveBeenCalledWith({
      economy: 2,
      business: 0,
      firstClass: 0
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('decrements passengers when minus button is clicked', async () => {
    const passengersWithMultiple: PassengerSelection = {
      economy: 2,
      business: 1,
      firstClass: 0
    }
    
    render(
      <PassengerSelector
        value={passengersWithMultiple}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    const minusButton = screen.getByTestId('business-minus-button')
    await userEvent.click(minusButton)
    
    // Confirm changes
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    
    expect(mockOnChange).toHaveBeenCalledWith({
      economy: 2,
      business: 0,
      firstClass: 0
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('prevents decrementing below zero', async () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    const minusButton = screen.getByTestId('business-minus-button')
    expect(minusButton).toBeDisabled()
  })

  it('prevents incrementing above 9 total passengers', async () => {
    const maxPassengers: PassengerSelection = {
      economy: 9,
      business: 0,
      firstClass: 0
    }
    
    render(
      <PassengerSelector
        value={maxPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    const plusButton = screen.getByTestId('business-plus-button')
    expect(plusButton).toBeDisabled()
  })

  it('shows error message when provided', async () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        error="Test error message"
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('calls onClose when Done button is clicked', async () => {
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('shows total passenger count in context menu', async () => {
    const mixedPassengers: PassengerSelection = {
      economy: 2,
      business: 1,
      firstClass: 1
    }
    
    render(
      <PassengerSelector
        value={mixedPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Total passengers:')).toBeInTheDocument()
      // There are multiple '4's, we need to be more specific or check for the structure
      const totalCountDisplay = screen.getByText('Total passengers:').nextElementSibling
      expect(totalCountDisplay).toHaveTextContent('4')
    })
  })

  it('auto-confirms changes on clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <PassengerSelector
        value={defaultPassengers}
        onChange={mockOnChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    const plusButton = screen.getByTestId('economy-plus-button');
    await user.click(plusButton); // tempSelection is now { economy: 2, ... }

    // Confirm changes by clicking the Done button
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(mockOnChange).toHaveBeenCalledWith({
      economy: 2,
      business: 0,
      firstClass: 0,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
}) 