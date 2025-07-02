import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { Booking } from '@/types'



const bookingsMock: Booking[] = [
  {
    id: 1,
    bookingDate: new Date().toISOString(),
    status: 'ACTIVE',
    airline: { code: 'AA', name: 'Alpha' },
    originAirport: { code: 'AAA', name: 'Alpha', city: '', country: '', latitude: 0, longitude: 0 },
    destinationAirport: { code: 'BBB', name: 'Beta', city: '', country: '', latitude: 0, longitude: 0 },
    departureTime: new Date().toISOString(),
    duration: 120,
    arrivalTime: new Date().toISOString(),
    passengers: [],
  },
]

describe('useBookingStore', () => {
  let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  let useBookingStore: typeof import('@/store/bookings').useBookingStore

  beforeEach(async () => {
    vi.resetModules()

    getMock = vi.fn()
    postMock = vi.fn()

    vi.doMock('@/lib/api', () => ({
      apiClient: {
        get: getMock,
        post: postMock,
      },
    }))

    useBookingStore = (await import('@/store/bookings')).useBookingStore

    // Reset store
    useBookingStore.setState({
      ...useBookingStore.getState(),
      bookings: [],
      loading: false,
    }, true)

    vi.clearAllMocks()
  })

  it('fetchBookings populates bookings and handles loading', async () => {
    getMock.mockResolvedValueOnce({ data: bookingsMock })

    const { fetchBookings } = useBookingStore.getState()
    const promise = fetchBookings()

    // loading should be true immediately after call
    expect(useBookingStore.getState().loading).toBe(true)

    await promise

    const state = useBookingStore.getState()
    expect(getMock).toHaveBeenCalledWith('/bookings/my-bookings')
    expect(state.bookings).toEqual(bookingsMock)
    expect(state.loading).toBe(false)
  })

  it('cancelBooking triggers API call and refreshes bookings', async () => {
    // pre-fill fetchBookings implementation for this test
    const refreshMock = vi.fn()
    useBookingStore.setState({ fetchBookings: refreshMock })

    postMock.mockResolvedValueOnce({})

    const { cancelBooking } = useBookingStore.getState()
    await cancelBooking(1)

    expect(postMock).toHaveBeenCalledWith('/bookings/1/cancel')
    expect(refreshMock).toHaveBeenCalled()
  })

  it('createBooking posts booking and returns data', async () => {
    const newBooking: Booking = { ...bookingsMock[0], id: 2 }
    postMock.mockResolvedValueOnce({ data: newBooking })

    const { createBooking } = useBookingStore.getState()

    const result = await createBooking({ flightId: 1, username: 'john', passengers: [] })

    expect(postMock).toHaveBeenCalledWith('/bookings/create', { flightId: 1, username: 'john', passengers: [] })
    expect(result).toEqual(newBooking)
  })
}) 