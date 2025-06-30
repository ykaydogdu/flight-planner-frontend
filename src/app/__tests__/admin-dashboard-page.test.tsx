import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

// Mutable auth mock so we can switch roles between tests
const authState: { user: { role: string } } = { user: { role: 'ROLE_ADMIN' } }

// Auth store mock
vi.mock('@/store/auth', () => ({
  useAuthStore: () => authState,
}))

// Stub dependent stores (minimal)
vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    users: [],
    fetchUsers: vi.fn(),
  }),
}))

vi.mock('@/store/airlines', () => ({
  useAirlineStore: () => ({
    airlines: [],
    fetchAirlines: vi.fn(),
  }),
}))

vi.mock('@/store/airports', () => ({
  useAirportStore: () => ({
    airports: [],
    fetchAirports: vi.fn(),
  }),
}))

// Stub heavy child components so we only test page logic
vi.mock('@/components/admin/user-management', () => ({
  UserManagement: () => <div data-testid="user-management" />,
}))
vi.mock('@/components/admin/airline-management', () => ({
  AirlineManagement: () => <div data-testid="airline-management" />,
}))
vi.mock('@/components/admin/airport-management', () => ({
  AirportManagement: () => <div data-testid="airport-management" />,
}))

// Mock react-router navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import AdminDashboardPage from '../admin-dashboard/page'

describe('AdminDashboardPage', () => {
  it('renders dashboard for admin user', () => {
    authState.user.role = 'ROLE_ADMIN'
    render(<AdminDashboardPage />)

    expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument()
    expect(screen.getByTestId('user-management')).toBeInTheDocument()
  })

  it('shows access denied for non-admin user', () => {
    authState.user.role = 'ROLE_USER'
    render(<AdminDashboardPage />)

    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })
}) 