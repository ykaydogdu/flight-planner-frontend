import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useAirlineStore', () => {
  let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  let deleteMock: ReturnType<typeof vi.fn>
  let useAirlineStore: typeof import('@/store/airlines').useAirlineStore
  let airlinesMock: import('@/types').Airline[]

  beforeEach(async () => {
    vi.resetModules()
    
    // Define mocks fresh
    getMock = vi.fn()
    postMock = vi.fn()
    deleteMock = vi.fn()

    // Mock before importing dependent modules
    vi.doMock('@/lib/api', () => ({
      apiClient: {
        get: getMock,
        post: postMock,
        delete: deleteMock,
      },
    }))

    // Dynamically import after mocking
    useAirlineStore = (await import('@/store/airlines')).useAirlineStore
    airlinesMock = [{ code: 'AA', name: 'Alpha', staffCount: 10 }]

    // Reset store
    useAirlineStore.setState({
      ...useAirlineStore.getState(),
      airlines: [],
      loading: false,
    }, true)

    vi.clearAllMocks()
  })

  it('fetchAirlines populates state', async () => {
    getMock.mockResolvedValueOnce({ data: airlinesMock })

    const { fetchAirlines } = useAirlineStore.getState()
    await fetchAirlines()

    expect(getMock).toHaveBeenCalledWith('/airlines')
    expect(useAirlineStore.getState().airlines).toEqual(airlinesMock)
  })

  it('createAirline posts data and appends to state', async () => {
    postMock.mockResolvedValueOnce({ data: airlinesMock[0] })

    const { createAirline } = useAirlineStore.getState()
    await createAirline({ code: 'AA', name: 'Alpha', staffCount: 10 })

    expect(postMock).toHaveBeenCalledWith('/airlines', { code: 'AA', name: 'Alpha', staffCount: 10 })
    expect(useAirlineStore.getState().airlines).toContainEqual(airlinesMock[0])
  })

  it('deleteAirline removes airline from state', async () => {
    // pre-populate state
    useAirlineStore.setState({ airlines: airlinesMock })

    deleteMock.mockResolvedValueOnce({})

    const { deleteAirline } = useAirlineStore.getState()
    await deleteAirline('AA')

    expect(deleteMock).toHaveBeenCalledWith('/airlines/AA')
    expect(useAirlineStore.getState().airlines.length).toBe(0)
  })
}) 