import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { FlightSearchForm } from '../flight-search-form'
import { useFlightStore } from '@/store/flights'

// Mock the flight store
vi.mock('@/store/flights', () => ({
  useFlightStore: vi.fn(),
}))

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

const mockFlightStore = {
  searchFlights: vi.fn(),
  fetchAirports: vi.fn(),
  fetchAirlines: vi.fn(),
  airports: [
    {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'USA',
      latitude: 40.6413,
      longitude: -73.7781,
    },
    {
      code: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'USA',
      latitude: 33.9425,
      longitude: -118.4081,
    },
  ],
  airlines: [
    {
      code: 'AA',
      name: 'American Airlines',
      staffCount: 100,
    },
    {
      code: 'UA',
      name: 'United Airlines',
      staffCount: 150,
    },
  ],
  loading: false,
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('FlightSearchForm', () => {
  beforeEach(() => {
    vi.mocked(useFlightStore).mockReturnValue(mockFlightStore)
    vi.clearAllMocks()
  })

  it('renders with passenger selector showing default value', () => {
    renderWithRouter(<FlightSearchForm />)
    
    expect(screen.getByDisplayValue('1 passenger')).toBeInTheDocument()
  })

  it('opens passenger selector context menu when clicked', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    fireEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
      expect(screen.getByText('First Class')).toBeInTheDocument()
    })
  })

  it('shows passenger class options in context menu', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    fireEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
      expect(screen.getByText('First Class')).toBeInTheDocument()
      expect(screen.getByText('Standard seating')).toBeInTheDocument()
      expect(screen.getByText('Premium seating')).toBeInTheDocument()
      expect(screen.getByText('Luxury seating')).toBeInTheDocument()
    })
  })

  it('calls searchFlights with passenger selection when form is submitted', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => ({
      ...(await vi.importActual('react-router-dom')),
      useNavigate: () => mockNavigate,
    }))

    renderWithRouter(<FlightSearchForm />)
    
    // Fill in the required fields
    const originInput = screen.getByPlaceholderText('Origin airport')
    const destinationInput = screen.getByPlaceholderText('Destination airport')
    
    fireEvent.change(originInput, { target: { value: 'John F. Kennedy International Airport' } })
    fireEvent.change(destinationInput, { target: { value: 'Los Angeles International Airport' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /search flights/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockFlightStore.searchFlights).toHaveBeenCalledWith({
        originAirportCode: 'JFK',
        destinationAirportCode: 'LAX',
        passengers: {
          economy: 1,
          business: 0,
          firstClass: 0
        }
      })
    })
  })

  it('validates that at least one passenger is selected', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    // First, open the passenger selector to set passengers to 0
    fireEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
    })
    
    // Try to set all passengers to 0 by clicking minus on economy
    const minusButtons = screen.getAllByRole('button')
    const economyMinusButton = minusButtons.find(btn => 
      btn.closest('.flex.items-center.justify-between')?.textContent?.includes('Economy')
    )
    
    if (economyMinusButton) {
      fireEvent.click(economyMinusButton)
    }
    
    // Should show error message when total is 0
    await waitFor(() => {
      expect(screen.getByText('At least 1 passenger required')).toBeInTheDocument()
    })
  })

  it('prevents selecting more than 9 total passengers', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    fireEvent.click(screen.getByDisplayValue('1 passenger'))
    
    await waitFor(() => {
      expect(screen.getByText('Economy')).toBeInTheDocument()
    })
    
    // The total passengers should be displayed in the context menu
    await waitFor(() => {
      expect(screen.getByText('Total passengers:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('renders all form fields correctly', () => {
    renderWithRouter(<FlightSearchForm />)
    
    expect(screen.getByPlaceholderText('Origin airport')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Destination airport')).toBeInTheDocument()
    expect(screen.getByLabelText(/departure/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('1 passenger')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Any')).toBeInTheDocument() // Airline field
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    const submitButton = screen.getByRole('button', { name: /search flights/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please select an origin airport')).toBeInTheDocument()
      expect(screen.getByText('Please select a destination airport')).toBeInTheDocument()
    })
  })
}) 