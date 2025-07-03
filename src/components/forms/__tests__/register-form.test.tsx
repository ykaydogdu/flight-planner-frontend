import { render, screen, waitFor } from '@testing-library/react'
import { RegisterForm } from '../register-form'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'

const registerUserMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    register: registerUserMock,
  }),
}))

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('RegisterForm', () => {
  it("shows error when passwords don't match", async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByPlaceholderText(/choose a username/i), 'john')
    await userEvent.type(screen.getByPlaceholderText(/enter your first name/i), 'John')
    await userEvent.type(screen.getByPlaceholderText(/enter your last name/i), 'Doe')
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'john@example.com')
    await userEvent.type(screen.getByPlaceholderText('Create a password'), 'secret')
    await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'different')

    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument()
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it("shows error when invalid input is provided", async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByPlaceholderText(/choose a username/i), 'jo')
    await userEvent.type(screen.getByPlaceholderText(/enter your first name/i), 'J')
    await userEvent.type(screen.getByPlaceholderText(/enter your last name/i), 'Doe')
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'example.com')
    await userEvent.type(screen.getByPlaceholderText('Create a password'), '123')
    await userEvent.type(screen.getByPlaceholderText('Confirm your password'), '123')

    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/username must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/first name must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it('submits registration data and calls register function', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )
    
    await userEvent.type(screen.getByPlaceholderText(/choose a username/i), 'john')
    await userEvent.type(screen.getByPlaceholderText(/enter your first name/i), 'John')
    await userEvent.type(screen.getByPlaceholderText(/enter your last name/i), 'Doe')
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'john@example.com')
    await userEvent.type(screen.getByPlaceholderText('Create a password'), 'secret')
    await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'secret')
    
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    
    expect(registerUserMock).toHaveBeenCalledWith({
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'secret',
    })
    
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    }, { timeout: 2100 })
  })
})  