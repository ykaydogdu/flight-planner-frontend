import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PassengerSelector } from '../passenger-selector'
import type { PassengerSelection } from '@/types'
import userEvent from '@testing-library/user-event'

describe('PassengerSelector', () => {
  const mockOnChange = vi.fn()
  
  const defaultPassengers: PassengerSelection = {
    economy: 1,
    business: 0,
    firstClass: 0
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with initial passenger count', () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByDisplayValue('1 passenger')).toBeInTheDocument()
  })

  it('shows plural form for multiple passengers', () => {
    const multiplePassengers: PassengerSelection = {
      economy: 2,
      business: 1,
      firstClass: 0
    }
    
    render(
      <PassengerSelector 
        value={multiplePassengers} 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByDisplayValue('3 passengers')).toBeInTheDocument()
  })

  it('opens context menu when clicked', async () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
      expect(screen.getByText('First Class')).toBeInTheDocument()
    })
  })

  it('displays passenger class options in context menu', async () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
      expect(screen.getByText('First Class')).toBeInTheDocument()
      expect(screen.getByText('Standard seating')).toBeInTheDocument()
      expect(screen.getByText('Premium seating')).toBeInTheDocument()
      expect(screen.getByText('Luxury seating')).toBeInTheDocument()
    })
  })

  it('increments economy passengers when plus button is clicked', async () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      const plusButton = screen.getByTestId('economy-plus-button')
      userEvent.click(plusButton)
    })
    
    // Click outside to confirm changes
    await userEvent.click(document.body)
    
    expect(mockOnChange).toHaveBeenCalledWith({
      economy: 2,
      business: 0,
      firstClass: 0
    })
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
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('3 passengers'))
    
    await waitFor(() => {
      const minusButton = screen.getByTestId('business-minus-button')
      userEvent.click(minusButton)
    })
    
    // Click outside to confirm changes
    await userEvent.click(document.body)
    
    expect(mockOnChange).toHaveBeenCalledWith({
      economy: 2,
      business: 0,
      firstClass: 0
    })
  })

  it('prevents decrementing below zero', async () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      const minusButton = screen.getByTestId('business-minus-button')
      expect(minusButton).toBeDisabled()
    })
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
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('9 passengers'))
    
    await waitFor(() => {
      const plusButton = screen.getByTestId('business-plus-button')
      expect(plusButton).toBeDisabled()
    })
  })

  it('shows error message when provided', () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
        error="Test error message"
      />
    )
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('closes context menu when clicking trigger again', async () => {
    render(
      <PassengerSelector 
        value={defaultPassengers} 
        onChange={mockOnChange} 
      />
    )
    
    // Open context menu
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
    })
    
    // Close context menu by clicking trigger again
    await userEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.queryByText('Standard seating')).not.toBeInTheDocument()
    })
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
      />
    )
    
    await userEvent.click(screen.getByDisplayValue('4 passengers'))
    
    await waitFor(() => {
      expect(screen.getByText('Total passengers:')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })
}) 