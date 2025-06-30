import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const authState: { user: { role: string; airline?: { code: string; name: string; staffCount: number } } } = {
  user: {
    role: 'ROLE_AIRLINE_STAFF',
    airline: { code: 'AA', name: 'Alpha Air', staffCount: 0 },
  },
}

vi.mock('@/store/auth', () => ({
  useAuthStore: () => authState,
}))

vi.mock('@/components/staff/flight-management', () => ({
  FlightManagement: () => <div data-testid="flight-management" />,
}))

vi.mock('@/components/staff/flight-bookings-view', () => ({
  FlightBookingsView: () => <div data-testid="flight-bookings-view" />,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import StaffDashboardPage from '../staff-dashboard/page'

describe('StaffDashboardPage', () => {
  it('renders dashboard for staff user', () => {
    authState.user.role = 'ROLE_AIRLINE_STAFF'
    render(<StaffDashboardPage />)

    expect(screen.getByRole('heading', { name: /staff dashboard/i })).toBeInTheDocument()
    expect(screen.getByTestId('flight-management')).toBeInTheDocument()
  })

  it('shows access denied for non-staff user', () => {
    authState.user.role = 'ROLE_USER'
    render(<StaffDashboardPage />)

    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })
}) 