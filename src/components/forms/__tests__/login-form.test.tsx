import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../login-form'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock the auth store so we can observe the login call
const loginMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    login: loginMock,
  }),
}))

// Mock react-router navigate so the component can render without errors
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('LoginForm', () => {
  it('renders form inputs', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates that username and password are required', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('submits credentials and calls login function', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'john' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({ username: 'john', password: 'secret' })
    })
  })
}) 