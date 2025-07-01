import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserManagement } from '../user-management'
import { vi } from 'vitest'
import type { User, Airline } from '@/types'

// Silence alerts in tests
window.alert = vi.fn()

// Mocks for store actions
const assignRoleMock = vi.fn(() => Promise.resolve())
const assignAirlineMock = vi.fn(() => Promise.resolve())

const usersMock: User[] = [
  {
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'ROLE_USER',
    airline: null,
  },
  {
    username: 'staff',
    firstName: 'Staff',
    lastName: 'Member',
    email: 'staff@example.com',
    role: 'ROLE_AIRLINE_STAFF',
    airline: { code: 'AA', name: 'Alpha Air', staffCount: 0 },
  },
]

const airlinesMock: Airline[] = [
  { code: 'AA', name: 'Alpha Air', staffCount: 0 },
  { code: 'BB', name: 'Beta Air', staffCount: 0 },
]

// Mock user & airline stores
vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    users: usersMock,
    loading: false,
    assignRole: assignRoleMock,
    assignAirline: assignAirlineMock,
  }),
}))

vi.mock('@/store/airlines', () => ({
  useAirlineStore: () => ({
    airlines: airlinesMock,
  }),
}))

// Stub Select components with basic HTML <select>
vi.mock('@/components/ui/select', () => {
  const Select = ({ children, onValueChange, defaultValue }: any) => (
    <select
      role="combobox"
      defaultValue={defaultValue}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="select"
    >
      {children}
    </select>
  )

  const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>
  const Stub = ({ children }: any) => <>{children}</>

  return {
    Select,
    SelectTrigger: Stub,
    SelectContent: Stub,
    SelectValue: Stub,
    SelectItem,
  }
})

// Mock motion to simple passthrough components
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: () => (props: any) => <div {...props}>{props.children}</div>,
  }),
}))

describe('UserManagement', () => {
  it('renders users list', () => {
    render(<UserManagement />)

    expect(screen.getByText('john')).toBeInTheDocument()
    expect(screen.getByText('staff')).toBeInTheDocument()
  })

  it('assigns new role after confirmation', async () => {
    render(<UserManagement />)

    // Change role for first user (john)
    const roleSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(roleSelect, { target: { value: 'ROLE_ADMIN' } })

    // Click Assign button that appears
    fireEvent.click(await screen.findByRole('button', { name: /assign/i }))

    // Confirm in dialog
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(assignRoleMock).toHaveBeenCalledWith('john', 'ROLE_ADMIN')
    })
  })

  it('assigns airline to staff user after confirmation', async () => {
    render(<UserManagement />)

    // Airline select is the second combobox (for staff user)
    const selects = screen.getAllByRole('combobox')
    const airlineSelect = selects[1]
    fireEvent.change(airlineSelect, { target: { value: 'BB' } })

    fireEvent.click(await screen.findByRole('button', { name: /assign/i }))

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(assignAirlineMock).toHaveBeenCalledWith('staff', 'BB')
    })
  })
}) 