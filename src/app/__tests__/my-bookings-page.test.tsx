import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import type { Booking, FlightClassType } from '@/types'

vi.mock('@/components/booking/booking-card', () => ({
  BookingCard: () => <div data-testid="booking-card" />,
}))

const bookingsMock: Booking[] = [
  {
    id: 1,
    passengers: [{
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      flightClass: 'ECONOMY' as FlightClassType,
      priceAtBooking: 100,
    }],
    bookingDate: new Date().toISOString(),
    airline: { code: 'AA', name: 'Alpha Air' },
    originAirport: { code: 'AAA', name: 'Alpha', city: '', country: '', latitude: 0, longitude: 0 },
    destinationAirport: { code: 'BBB', name: 'Beta', city: '', country: '', latitude: 1, longitude: 1 },
    departureTime: new Date().toISOString(),
    duration: 120,
    arrivalTime: new Date().toISOString(),
    status: 'ACTIVE', 
  },
]

vi.mock('@/store/bookings', () => ({
  useBookingStore: () => ({
    bookings: bookingsMock,
    loading: false,
    fetchBookings: vi.fn(),
  }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import MyBookingsPage from '../my-bookings/page'

describe('MyBookingsPage', () => {
  it('renders list of bookings', () => {
    render(<MyBookingsPage />)

    expect(screen.getByText(/my bookings/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('booking-card').length).toBeGreaterThan(0)
  })
}) 