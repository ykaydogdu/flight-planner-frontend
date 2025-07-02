import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Test fixtures --------------------------------------------------------

import type { Airport } from '@/types'

const airportMock: Airport = {
  code: 'AAA',
  name: 'Alpha',
  city: 'Alpha',
  country: 'A-Land',
  latitude: 0,
  longitude: 0,
}

// --- Tests ----------------------------------------------------------------

describe('useAirportStore', () => {
  let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  let deleteMock: ReturnType<typeof vi.fn>
  let useAirportStore: typeof import('@/store/airports').useAirportStore

  beforeEach(async () => {
    vi.resetModules()

    getMock = vi.fn()
    postMock = vi.fn()
    deleteMock = vi.fn()

    vi.doMock('@/lib/api', () => ({
      apiClient: {
        get: getMock,
        post: postMock,
        delete: deleteMock,
      },
    }))

    useAirportStore = (await import('@/store/airports')).useAirportStore

    // Reset store
    useAirportStore.setState({
      ...useAirportStore.getState(),
      airports: [],
      loading: false,
    }, true)

    vi.clearAllMocks()
  })

  it('fetchAirports populates state', async () => {
    getMock.mockResolvedValueOnce({ data: [airportMock] })

    const { fetchAirports } = useAirportStore.getState()
    await fetchAirports()

    expect(getMock).toHaveBeenCalledWith('/airports')
    expect(useAirportStore.getState().airports).toEqual([airportMock])
  })

  it('createAirport sends post and adds new airport', async () => {
    postMock.mockResolvedValueOnce({ data: airportMock })

    const { createAirport } = useAirportStore.getState()
    await createAirport({ code: 'AAA', name: 'Alpha', city: 'Alpha', country: 'A-Land', latitude: 0, longitude: 0 })

    expect(postMock).toHaveBeenCalledWith('/airports', { code: 'AAA', name: 'Alpha', city: 'Alpha', country: 'A-Land', latitude: 0, longitude: 0 })
    expect(useAirportStore.getState().airports).toContainEqual(airportMock)
  })

  it('deleteAirport removes airport from state', async () => {
    useAirportStore.setState({ airports: [airportMock] })
    deleteMock.mockResolvedValueOnce({})

    const { deleteAirport } = useAirportStore.getState()
    await deleteAirport('AAA')

    expect(deleteMock).toHaveBeenCalledWith('/airports/AAA')
    expect(useAirportStore.getState().airports.length).toBe(0)
  })
}) 