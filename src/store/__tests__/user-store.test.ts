import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { User } from '@/types'

const usersMock: User[] = [
  {
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'ROLE_USER',
    airline: null,
  },
]

// --- Tests ---------------------------------------------------------------- 

describe('useUserStore', () => {
  let getMock: ReturnType<typeof vi.fn>
  let patchMock: ReturnType<typeof vi.fn>
  let useUserStore: typeof import('@/store/user').useUserStore

  beforeEach(async () => {
    vi.resetModules()

    getMock = vi.fn()
    patchMock = vi.fn()

    vi.doMock('@/lib/api', () => ({
      apiClient: {
        get: getMock,
        patch: patchMock,
      },
    }))

    useUserStore = (await import('@/store/user')).useUserStore

    // Reset store
    useUserStore.setState({
      ...useUserStore.getState(),
      users: [],
      loading: false,
    }, true)

    vi.clearAllMocks()
  })

  it('fetchUsers populates users and toggles loading', async () => {
    getMock.mockResolvedValueOnce({ data: usersMock })

    const { fetchUsers } = useUserStore.getState()
    const promise = fetchUsers()
    expect(useUserStore.getState().loading).toBe(true)

    await promise

    expect(getMock).toHaveBeenCalledWith('/users')
    expect(useUserStore.getState().users).toEqual(usersMock)
    expect(useUserStore.getState().loading).toBe(false)
  })

  it('assignRole patches user role and updates store', async () => {
    // set initial users
    useUserStore.setState({ users: usersMock })

    patchMock.mockResolvedValueOnce({})

    const { assignRole } = useUserStore.getState()
    await assignRole('john', 'ROLE_ADMIN')

    expect(patchMock).toHaveBeenCalledWith('/users/john/assign-role', null, {
      params: { role: 'ROLE_ADMIN' },
    })

    expect(useUserStore.getState().users[0].role).toBe('ROLE_ADMIN')
  })

  it('assignAirline triggers fetchUsers after patch', async () => {
    patchMock.mockResolvedValueOnce({})
    const refreshMock = vi.fn()
    useUserStore.setState({ fetchUsers: refreshMock })

    const { assignAirline } = useUserStore.getState()
    await assignAirline('john', 'AA')

    expect(patchMock).toHaveBeenCalledWith('/users/john/assign-airline', null, {
      params: { airlineCode: 'AA' },
    })
    expect(refreshMock).toHaveBeenCalled()
  })
}) 