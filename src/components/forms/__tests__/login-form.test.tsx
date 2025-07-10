import { render, screen, waitFor } from '@testing-library/react'
import { LoginForm } from '../login-form'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'

// Mock the auth store so we can observe the login call
const loginMock = vi.fn(() => Promise.resolve())

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    login: loginMock,
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

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

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

    await userEvent.type(screen.getByPlaceholderText(/username/i), 'john')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginMock).toHaveBeenCalledWith({ username: 'john', password: 'secret' })
  })

  it('shows error message when login fails', async () => {
    loginMock.mockRejectedValueOnce(new Error('Login failed. Please check your credentials.'))

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByPlaceholderText(/username/i), 'john')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/login failed/i)).toBeInTheDocument()
    expect(loginMock).toHaveBeenCalledWith({ username: 'john', password: 'secret' })
  })

  it('navigates to home page when login is successful', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByPlaceholderText(/username/i), 'john')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginMock).toHaveBeenCalledWith({ username: 'john', password: 'secret' })

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/')
    })
  })
}) 