import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegisterForm } from '../register-form'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

const registerUserMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    register: registerUserMock,
  }),
}))

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('RegisterForm', () => {
  it("shows error when passwords don't match", async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/choose a username/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'different' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument()
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it('submits registration data and calls register function', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/choose a username/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'secret' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret',
      })
    })
  })
}) 