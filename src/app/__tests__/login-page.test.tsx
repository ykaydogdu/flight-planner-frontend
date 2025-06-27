import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/forms/login-form', () => ({
  LoginForm: () => <div data-testid="login-form" />,
}))

import LoginPage from '../login/page'

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })
}) 