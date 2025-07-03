import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { UserManagement } from '../user-management'
import { vi } from 'vitest'
import type { User, Airline } from '@/types'
import userEvent from '@testing-library/user-event'

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
    airline: { code: 'AA', name: 'Alpha Air', staffCount: 1 },
  },
]

const airlinesMock: Airline[] = [
  { code: 'AA', name: 'Alpha Air', staffCount: 1 },
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
  const Select = ({ children, onValueChange, defaultValue }: { children: React.ReactNode, onValueChange: (value: string) => void, defaultValue: string }) => (
    <select
      role="combobox"
      defaultValue={defaultValue}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="select"
    >
      {children}
    </select>
  )

  const SelectItem = ({ children, value }: { children: React.ReactNode, value: string }) => <option value={value}>{children}</option>
  const Stub = ({ children }: { children: React.ReactNode }) => <>{children}</>

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
    get: () => (props: { children: React.ReactNode }) => <div {...props}>{props.children}</div>,
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
    await userEvent.selectOptions(roleSelect, 'ROLE_ADMIN')

    // Click Assign button that appears
    await userEvent.click(await screen.findByRole('button', { name: /assign/i }))

    // Confirm in dialog
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(assignRoleMock).toHaveBeenCalledWith('john', 'ROLE_ADMIN')
    })
  })

  it('assigns airline to staff user after confirmation', async () => {
    render(<UserManagement />)

    // Airline select is the second combobox (for staff user)
    const airlineSelect = screen.getAllByRole('combobox')[1]
    await userEvent.selectOptions(airlineSelect, 'BB')

    await userEvent.click(await screen.findByRole('button', { name: /assign/i }))

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(assignAirlineMock).toHaveBeenCalledWith('staff', 'BB')
    })
  })
}) 