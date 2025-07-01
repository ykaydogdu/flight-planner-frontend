import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { Flight } from '@/types'

// Create a sample flight
const flightMock: Flight = {
  id: 1,
  minPrice: 150,
  seatCount: 150,
  emptySeats: 150,
  departureTime: new Date().toISOString(),
  duration: 180,
  arrivalTime: new Date().toISOString(),
  airline: { code: 'AA', name: 'Alpha Air' },
  originAirport: { code: 'AAA', name: 'Alpha', city: '', country: '', latitude: 0, longitude: 0 },
  destinationAirport: { code: 'BBB', name: 'Beta', city: '', country: '', latitude: 1, longitude: 1 },
  classes: [],
}

const fetchFlightByIdMock = vi.fn(() => Promise.resolve(flightMock))
const createBookingMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/flights', () => ({
  useFlightStore: () => ({
    fetchFlightById: fetchFlightByIdMock,
  }),
}))

vi.mock('@/store/bookings', () => ({
  useBookingStore: () => ({
    createBooking: createBookingMock,
  }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    user: { username: 'john', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'ROLE_USER' },
    isAuthenticated: true,
  }),
}))

// Mock react-router helpers
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ flightId: '1' }),
    useSearchParams: () => [new URLSearchParams('passengers=1'), vi.fn()],
  }
})

// Stub icons & UI primitives used heavily
vi.mock('lucide-react', () => new Proxy({}, { get: () => () => <span /> }))
vi.mock('@/components/ui/input', () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }))
vi.mock('@/components/ui/button', () => ({ Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{props.children}</button> }))
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }))

import BookingPage from '../booking/page'

describe('BookingPage', () => {
  it('fetches flight details and displays booking page', async () => {
    render(<BookingPage />)

    // Ensure flight fetch is called
    await waitFor(() => {
      expect(fetchFlightByIdMock).toHaveBeenCalledWith(1)
    })

    // After loading, booking header should be visible
    expect(await screen.findByText(/review & confirm booking/i)).toBeInTheDocument()
  })
}) 