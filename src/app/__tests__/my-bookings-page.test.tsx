import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { Booking, FlightClassType } from '@/types'

vi.mock('@/components/booking/booking-card', () => ({
  BookingCard: () => <div data-testid="booking-card" />,
}))

// --- Dynamic store mocks --------------------------------------------------

const bookingStoreState: {
  bookings: Booking[]
  loading: boolean
  fetchBookings: () => void
} = {
  bookings: [],
  loading: false,
  fetchBookings: vi.fn(),
}

vi.mock('@/store/bookings', () => ({
  useBookingStore: () => bookingStoreState,
}))

let authStoreState = { isAuthenticated: true }
vi.mock('@/store/auth', () => ({
  useAuthStore: () => authStoreState,
}))

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import MyBookingsPage from '../my-bookings/page'

// Helper to reset mutable mocks between tests
const createBooking = (): Booking => ({
  id: 1,
  passengers: [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      flightClass: 'ECONOMY' as FlightClassType,
      priceAtBooking: 100,
    },
  ],
  bookingDate: new Date().toISOString(),
  airline: { code: 'AA', name: 'Alpha Air' },
  originAirport: { code: 'AAA', name: 'Alpha', city: '', country: '', latitude: 0, longitude: 0 },
  destinationAirport: { code: 'BBB', name: 'Beta', city: '', country: '', latitude: 1, longitude: 1 },
  departureTime: new Date().toISOString(),
  duration: 120,
  arrivalTime: new Date().toISOString(),
  status: 'ACTIVE',
})

describe('MyBookingsPage', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    bookingStoreState.fetchBookings = vi.fn()
    authStoreState = { isAuthenticated: true }
  })

  it('renders list of bookings', () => {
    bookingStoreState.bookings = [createBooking()]
    bookingStoreState.loading = false

    render(<MyBookingsPage />)

    expect(screen.getByText(/my bookings/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('booking-card').length).toBeGreaterThan(0)
    expect(bookingStoreState.fetchBookings).toHaveBeenCalled()
  })

  it('shows loading skeletons when loading is true', () => {
    bookingStoreState.bookings = []
    bookingStoreState.loading = true

    render(<MyBookingsPage />)

    expect(screen.getByText(/my bookings/i)).toBeInTheDocument()
    // Expect three skeleton cards (animate-pulse)
    const pulseElements = document.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBe(3)
  })

  it('shows empty state and navigates to home when button clicked', async () => {
    bookingStoreState.bookings = []
    bookingStoreState.loading = false

    render(<MyBookingsPage />)

    expect(screen.getByText(/no bookings found/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /search flights/i }))

    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('redirects to login when user is not authenticated', () => {
    authStoreState = { isAuthenticated: false }

    render(<MyBookingsPage />)

    expect(navigateMock).toHaveBeenCalledWith('/login')
  })
}) 