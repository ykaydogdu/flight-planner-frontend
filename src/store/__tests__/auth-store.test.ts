import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { User, AuthResponse } from '@/types'

const userMock: User = {
  username: 'john',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'ROLE_USER',
  airline: null,
}

const authResponse: AuthResponse = {
  token: 'test-token',
  user: userMock,
}

describe('useAuthStore', () => {
  let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  let useAuthStore: typeof import('@/store/auth').useAuthStore

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

    useAuthStore = (await import('@/store/auth')).useAuthStore

    // Reset store
    useAuthStore.setState({
      ...useAuthStore.getState(),
      user: null,
      token: null,
      isAuthenticated: false,
    }, true)

    vi.clearAllMocks()
  })

  it('login stores user, token and updates auth state', async () => {
    postMock.mockResolvedValueOnce({ data: authResponse })

    const { login } = useAuthStore.getState()
    await login({ username: 'john', password: 'secret' })

    expect(postMock).toHaveBeenCalledWith('/auth/login', { username: 'john', password: 'secret' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(userMock)
    expect(state.token).toBe('test-token')
    // token should be persisted in localStorage
    expect(localStorage.getItem('auth-token')).toBe('test-token')
  })

  it('logout clears user info and token', () => {
    // set some initial state to verify logout
    useAuthStore.setState({ user: userMock, token: 'abc', isAuthenticated: true })
    localStorage.setItem('auth-token', 'abc')

    const { logout } = useAuthStore.getState()
    logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('fetchUser retrieves user when token exists', async () => {
    localStorage.setItem('auth-token', 'some-token')
    getMock.mockResolvedValueOnce({ data: userMock })

    const { fetchUser } = useAuthStore.getState()
    await fetchUser()

    expect(getMock).toHaveBeenCalledWith('/auth/me')
    expect(useAuthStore.getState().user).toEqual(userMock)
  })
}) 