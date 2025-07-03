import { render, screen } from '@testing-library/react'
import { Header } from '../header'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import type { AuthState } from '@/store/auth'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/context/ThemeContext'

const logoutMock = vi.fn()

// Mutable store state referenced inside mocked hook
let storeState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  fetchUser: vi.fn(),
}

vi.mock('@/store/auth', () => ({
    useAuthStore: () => storeState,
}))

function renderWithRoute(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<Header />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('Header', () => {
  it('does not render on login page', () => {
    storeState = { user: null, token: null, isAuthenticated: false, logout: logoutMock, login: vi.fn(), register: vi.fn(), fetchUser: vi.fn() }
    renderWithRoute('/login')
    expect(screen.queryByText(/flightbooker/i)).not.toBeInTheDocument()
  })

  it('renders login/signup buttons when unauthenticated', () => {
    storeState = { user: null, token: null, isAuthenticated: false, logout: logoutMock, login: vi.fn(), register: vi.fn(), fetchUser: vi.fn() }
    renderWithRoute('/')
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders role-based links and logout when authenticated', async () => {
    storeState = {
      user: { username: 'admin', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'ROLE_ADMIN' },
      token: '123',
      isAuthenticated: true,
      logout: logoutMock,
      login: vi.fn(),
      register: vi.fn(),
      fetchUser: vi.fn(),
    }
    renderWithRoute('/')

    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument()
    expect(screen.queryByText(/staff dashboard/i)).not.toBeInTheDocument()

    // Click logout
    await userEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(logoutMock).toHaveBeenCalled()
  })
}) 