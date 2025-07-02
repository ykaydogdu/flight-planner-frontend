import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { Flight, Booking, Airport, User } from '@/types'
import { FlightManagement } from '../flight-management'

// Stub heavy map based AirportPicker
vi.mock('@/components/ui/airport-picker', () => ({
  AirportPicker: () => <div data-testid="airport-picker" />,
}))

// Stub shadcn Select primitives to simple HTML wrappers
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <select>{children}</select>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

// Stub alert-dialog primitives
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}))

// Airports fixture
const airportsMock: Airport[] = [
  { code: 'XXX', name: 'X Airport', city: 'X City', country: 'X Land', latitude: 0, longitude: 0 },
  { code: 'YYY', name: 'Y Airport', city: 'Y City', country: 'Y Land', latitude: 10, longitude: 10 },
]

// Shared mocks so tests can inspect call counts - defined before use
const fetchAirportsMock = vi.fn(() => Promise.resolve())
const searchFlightsMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/airports', () => ({
  useAirportStore: () => ({
    airports: airportsMock,
    fetchAirports: fetchAirportsMock,
  }),
}))

// Flights fixture – one future, one past
const now = Date.now()
const flightsMock: Flight[] = [
  {
    id: 1,
    minPrice: 100,
    seatCount: 100,
    emptySeats: 80,
    departureTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    duration: 120,
    arrivalTime: new Date(now + 26 * 60 * 60 * 1000).toISOString(),
    airline: { code: 'AA', name: 'Alpha Air' },
    originAirport: airportsMock[0],
    destinationAirport: airportsMock[1],
    classes: [
      {
        flightClass: 'ECONOMY',
        price: 100,
        seatCount: 100,
        availableSeats: 80,
      },
    ],
  },
  {
    id: 2,
    minPrice: 200,
    seatCount: 100,
    emptySeats: 50,
    departureTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    duration: 120,
    arrivalTime: new Date(now - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    airline: { code: 'AA', name: 'Alpha Air' },
    originAirport: airportsMock[1],
    destinationAirport: airportsMock[0],
    classes: [
      {
        flightClass: 'ECONOMY',
        price: 200,
        seatCount: 100,
        availableSeats: 50,
      },
    ],
  },
]

const statsResponse = {
  flightStats: [
    { flightId: 1, bookingCount: 1, revenue: 100, passengerCount: 1, bookings: [] },
    { flightId: 2, bookingCount: 2, revenue: 400, passengerCount: 2, bookings: [] },
  ],
  overallBookingCount: 3,
  overallPassengerCount: 3,
  overallRevenue: 500,
}

const bookingsMock: Booking[] = [
  {
    id: 10,
    airline: { code: 'AA', name: 'Alpha Air' },
    originAirport: airportsMock[0],
    destinationAirport: airportsMock[1],
    departureTime: flightsMock[0].departureTime,
    duration: 120,
    arrivalTime: flightsMock[0].arrivalTime,
    bookingDate: new Date().toISOString(),
    status: 'ACTIVE',
    passengers: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        flightClass: 'ECONOMY',
        priceAtBooking: 100,
      },
    ],
  },
]

// More flight-related mocks
const fetchFlightStatsMock = vi.fn(() => Promise.resolve(statsResponse))
const createFlightMock = vi.fn(() => Promise.resolve())
const updateFlightMock = vi.fn(() => Promise.resolve())
const deleteFlightMock = vi.fn(() => Promise.resolve())
const fetchBookingsForFlightMock = vi.fn(() => Promise.resolve(bookingsMock))

vi.mock('@/store/flights', () => ({
  useFlightStore: () => ({
    flights: flightsMock,
    searchFlights: searchFlightsMock,
    fetchFlightStats: fetchFlightStatsMock,
    createFlight: createFlightMock,
    updateFlight: updateFlightMock,
    deleteFlight: deleteFlightMock,
    fetchBookingsForFlight: fetchBookingsForFlightMock,
  }),
}))

const authState: { user: User } = { user: { username: 'john.doe', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'ROLE_AIRLINE_STAFF', airline: { code: 'AA', name: 'Alpha Air', staffCount: 1 } } }
vi.mock('@/store/auth', () => ({
  useAuthStore: () => authState,
}))

const renderComponent = () => {
  const setOverallStats = vi.fn()
  render(<FlightManagement setOverallStats={setOverallStats} />)
  return { setOverallStats }
}

describe('FlightManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    renderComponent()
    expect(screen.getByText(/flight management/i)).toBeInTheDocument()
  })

  it('fetches airports, flights & stats on mount and renders current flights tab', async () => {
    renderComponent()

    // fetchAirports & searchFlights should be called once
    expect(fetchAirportsMock).toHaveBeenCalledTimes(1)
    expect(searchFlightsMock).toHaveBeenCalledTimes(1)

    // Stats should be fetched with correct airline code
    await waitFor(() => {
      expect(fetchFlightStatsMock).toHaveBeenCalledWith('AA')
    })

    // Current flights button displays count 1 and corresponding flight code is rendered
    expect(await screen.findByText(/current & future flights \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/aa-0001/i)).toBeInTheDocument()
  })

  it('shows past flights when past tab selected', async () => {
    renderComponent()

    // Switch to Past tab
    await userEvent.click(await screen.findByRole('button', { name: /past flights/i }))

    // Past flights list should now include the older flight
    expect(await screen.findByText(/aa-0002/i)).toBeInTheDocument()
  })

  it('opens create flight form when "Schedule New Flight" button clicked', async () => {
    renderComponent()

    await userEvent.click(screen.getByRole('button', { name: /schedule new flight/i }))

    expect(await screen.findByRole('heading', { name: /schedule new flight/i })).toBeInTheDocument()
  })

  it('loads bookings when flight row expanded', async () => {
    renderComponent()

    // Expand first (future) flight row – click on its badge text
    await userEvent.click(await screen.findByText(/aa-0001/i))

    // Bookings should be fetched for the correct flight
    await waitFor(() => {
      expect(fetchBookingsForFlightMock).toHaveBeenCalledWith(1)
    })

    // Passenger details from bookings appear
    expect(await screen.findByText(/john doe/i)).toBeInTheDocument()
  })
}) 