import { render, screen, fireEvent } from '@testing-library/react'
import { FlightCard } from '../flight-card'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Flight } from '@/types'

// Mock navigate
const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

describe('FlightCard', () => {
  const mockFlight: Flight = {
    id: 1,
    minPrice: 200,
    seatCount: 180,
    emptySeats: 25,
    departureTime: new Date('2025-01-01T10:00:00Z').toISOString(),
    duration: 120, // minutes
    arrivalTime: new Date('2025-01-01T12:00:00Z').toISOString(),
    airline: {
      code: 'EX',
      name: 'Example Airline',
    },
    originAirport: {
      code: 'AAA',
      name: 'Alpha Airport',
      city: 'Alpha City',
      country: 'A-Land',
      latitude: 0,
      longitude: 0,
    },
    destinationAirport: {
      code: 'BBB',
      name: 'Beta Airport',
      city: 'Beta City',
      country: 'B-Land',
      latitude: 0,
      longitude: 0,
    },
    classes: [],
  }

  it('renders airline name and price per passenger', () => {
    render(
      <MemoryRouter>
        <FlightCard flight={mockFlight} economyPassengers={1} businessPassengers={0} firstClassPassengers={0} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/example airline/i)).toBeInTheDocument()
    expect(screen.getByText('$200 per person')).toBeInTheDocument()
  })

  it('shows expandable details when card is clicked', () => {
    render(
      <MemoryRouter>
        <FlightCard flight={mockFlight} economyPassengers={1} businessPassengers={0} firstClassPassengers={0} />
      </MemoryRouter>,
    )

    // Details should not be visible initially
    expect(screen.queryByText(/flight number/i)).not.toBeInTheDocument()

    // Click card to expand
    fireEvent.click(screen.getByText(/example airline/i))

    expect(screen.getByText(/flight number/i)).toBeInTheDocument()
  })

  it('navigates to booking page when "Select Flight" button is clicked', () => {
    render(
      <MemoryRouter>
        <FlightCard flight={mockFlight} economyPassengers={1} businessPassengers={0} firstClassPassengers={0} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /select flight/i }))

    expect(navigateMock).toHaveBeenCalledWith('/booking/1?passengers=1')
  })
}) 