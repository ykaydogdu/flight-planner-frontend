import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { FlightSearchForm } from '../flight-search-form'
import { useFlightStore } from '@/store/flights'
import userEvent from '@testing-library/user-event'

// Mock the flight store
vi.mock('@/store/flights', () => ({
  useFlightStore: vi.fn(),
}))

// Single mock for react-router-dom used across all tests in this file
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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

  it('calls searchFlights with passenger selection when form is submitted', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    // Fill in the required fields
    const originInput = screen.getByPlaceholderText('Origin airport')
    const destinationInput = screen.getByPlaceholderText('Destination airport')
    const anyDateInput = screen.getByText('Any')
    
    await userEvent.type(originInput, 'John F. Kennedy International Airport')
    await userEvent.type(destinationInput, 'Los Angeles International Airport')
    await userEvent.click(anyDateInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /search flights/i })
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockFlightStore.searchFlights).toHaveBeenCalledWith({
        originAirportCode: 'JFK',
        destinationAirportCode: 'LAX',
        passengerEconomy: 1,
      })
    })
  })

  it('renders all form fields correctly', () => {
    renderWithRouter(<FlightSearchForm />)
    
    expect(screen.getByPlaceholderText('Origin airport')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Destination airport')).toBeInTheDocument()
    expect(screen.getByTestId('departure-date-input')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1 passenger')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Any')).toBeInTheDocument() // Airline field
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    renderWithRouter(<FlightSearchForm />)
    
    const submitButton = screen.getByRole('button', { name: /search flights/i })
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please select an origin airport')).toBeInTheDocument()
      expect(screen.getByText('Please select a destination airport')).toBeInTheDocument()
    })
  })
}) 