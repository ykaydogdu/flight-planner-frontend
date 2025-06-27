import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/forms/register-form', () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}))

import RegisterPage from '../register/page'

describe('RegisterPage', () => {
  it('renders the register form', () => {
    render(<RegisterPage />)
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
  })
}) 