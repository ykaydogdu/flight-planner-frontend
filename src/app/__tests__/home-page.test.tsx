import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

// Stub the FlightSearchForm to avoid deep rendering complexities
vi.mock('@/components/forms/flight-search-form', () => ({
  FlightSearchForm: () => <div data-testid="search-form" />,
}))

import HomePage from '../page'

describe('HomePage', () => {
  it('renders hero heading and search form', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: /find your perfect flight/i })).toBeInTheDocument()
    expect(screen.getByTestId('search-form')).toBeInTheDocument()
  })
}) 