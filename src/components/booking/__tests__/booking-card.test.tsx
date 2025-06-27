import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingCard } from '../booking-card'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Booking } from '@/types'

const cancelBookingMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/bookings', () => ({
  useBookingStore: () => ({
    cancelBooking: cancelBookingMock,
  }),
}))

describe('BookingCard', () => {
  const mockBooking: Booking = {
    id: 123,
    flightId: 1,
    price: 200,
    numberOfSeats: 2,
    airline: {
      code: 'EX',
      name: 'Example Air',
    },
    originAirport: {
      code: 'AAA',
      name: 'Alpha Airport',
      city: 'Alpha',
      country: 'A-Land',
      latitude: 0,
      longitude: 0,
    },
    destinationAirport: {
      code: 'BBB',
      name: 'Beta Airport',
      city: 'Beta',
      country: 'B-Land',
      latitude: 0,
      longitude: 0,
    },
    departureTime: new Date('2025-01-01T10:00:00Z').toISOString(),
    duration: 120,
    arrivalTime: new Date('2025-01-01T12:00:00Z').toISOString(),
    status: 'CONFIRMED',
  }

  it('renders booking information', () => {
    render(
      <MemoryRouter>
        <BookingCard booking={mockBooking} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/example air/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel booking/i)).toBeInTheDocument()
  })

  it('calls cancelBooking when confirmation is accepted', async () => {
    render(
      <MemoryRouter>
        <BookingCard booking={mockBooking} />
      </MemoryRouter>,
    )

    // open alert dialog
    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }))

    // confirm inside dialog – the button text is "Yes, Cancel Booking"
    const confirmButton = await screen.findByRole('button', { name: /yes, cancel booking/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(cancelBookingMock).toHaveBeenCalledWith(123)
    })
  })
}) 