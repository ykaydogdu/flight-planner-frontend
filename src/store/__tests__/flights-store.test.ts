import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { Flight, Airport, Airline } from '@/types'

// --- Test fixtures --------------------------------------------------------

const flightsMock: Flight[] = [
  {
    id: 1,
    minPrice: 100,
    seatCount: 100,
    emptySeats: 80,
    departureTime: new Date('2030-01-01T10:00:00Z').toISOString(),
    duration: 60,
    arrivalTime: new Date('2030-01-01T11:00:00Z').toISOString(),
    airline: { code: 'AA', name: 'Alpha' },
    originAirport: {
      code: 'AAA',
      name: 'Alpha',
      city: 'Alpha',
      country: 'A-Land',
      latitude: 0,
      longitude: 0,
    },
    destinationAirport: {
      code: 'BBB',
      name: 'Beta',
      city: 'Beta',
      country: 'B-Land',
      latitude: 0,
      longitude: 0,
    },
    classes: [],
  },
]

const airportsMock: Airport[] = [
  { code: 'AAA', name: 'Alpha', city: 'Alpha', country: 'A', latitude: 0, longitude: 0 },
]

const airlinesMock: Airline[] = [
  { code: 'AA', name: 'Alpha', staffCount: 20 },
]

describe('useFlightStore', () => {
    let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  let putMock: ReturnType<typeof vi.fn>
  let deleteMock: ReturnType<typeof vi.fn>
  let useFlightStore: typeof import('@/store/flights').useFlightStore

  beforeEach(async () => {
    vi.resetModules()

    getMock = vi.fn()
    postMock = vi.fn()
    putMock = vi.fn()
    deleteMock = vi.fn()

    vi.doMock('@/lib/api', () => ({
      apiClient: {
        get: getMock,
        post: postMock,
        put: putMock,
        delete: deleteMock,
      },
    }))

    useFlightStore = (await import('@/store/flights')).useFlightStore

    // Reset store
    useFlightStore.setState({
      ...useFlightStore.getState(),
      flights: [],
      airports: [],
      airlines: [],
      loading: false,
      searchParams: null,
      hasActiveSearch: false,
    }, true)

    vi.clearAllMocks()
  })

  it('searchFlights updates flights and loading flags', async () => {
    getMock.mockResolvedValueOnce({ data: flightsMock })

    const { searchFlights } = useFlightStore.getState()
    const params = { originAirportCode: 'AAA', destinationAirportCode: 'BBB' }

    // Trigger search
    await searchFlights(params)

    const state = useFlightStore.getState()

    expect(getMock).toHaveBeenCalledWith('/flights', { params })
    expect(state.flights).toEqual(flightsMock)
    expect(state.loading).toBe(false)
    expect(state.hasActiveSearch).toBe(true)
  })

  it('fetchAirports populates airports array', async () => {
    getMock.mockResolvedValueOnce({ data: airportsMock })

    const { fetchAirports } = useFlightStore.getState()
    await fetchAirports()

    expect(getMock).toHaveBeenCalledWith('/airports')
    expect(useFlightStore.getState().airports).toEqual(airportsMock)
  })

  it('fetchAirlines populates airlines array', async () => {
    getMock.mockResolvedValueOnce({ data: airlinesMock })

    const { fetchAirlines } = useFlightStore.getState()
    await fetchAirlines()

    expect(getMock).toHaveBeenCalledWith('/airlines')
    expect(useFlightStore.getState().airlines).toEqual(airlinesMock)
  })

  it('clearSearchState resets flights and flags', async () => {
    // pre-fill state
    useFlightStore.setState({ flights: flightsMock, hasActiveSearch: true })

    const { clearSearchState } = useFlightStore.getState()
    clearSearchState()

    const state = useFlightStore.getState()
    expect(state.flights).toEqual([])
    expect(state.hasActiveSearch).toBe(false)
    expect(state.searchParams).toBeNull()
  })
}) 