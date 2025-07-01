import { render, screen, fireEvent } from '@testing-library/react'
import { FlightFilters } from '../flight-filters'
import { vi } from 'vitest'
import type { Flight } from '@/types'

const onFilterChangeMock = vi.fn()

const flightsMock: Flight[] = [
  {
    id: 1,
    minPrice: 100,
    seatCount: 100, 
    emptySeats: 50,
    departureTime: new Date('2025-01-01T08:00:00Z').toISOString(),
    duration: 60,
    arrivalTime: new Date('2025-01-01T09:00:00Z').toISOString(),
    airline: { code: 'AA', name: 'Alpha Air' },
    originAirport: {
      code: 'AAA',
      name: 'Alpha',
      city: 'Alpha',
      country: 'A-Land',
      latitude: 0,
      longitude: 0,
    },
    destinationAirport: {
      code: 'BBB',
      name: 'Beta',
      city: 'Beta',
      country: 'B-Land',
      latitude: 0,
      longitude: 0,
    },
    classes: [],
  },
  {
    id: 2,
    minPrice: 500,
    seatCount: 100,
    emptySeats: 20,
    departureTime: new Date('2025-01-01T20:00:00Z').toISOString(),
    duration: 300,
    arrivalTime: new Date('2025-01-02T01:00:00Z').toISOString(),
    airline: { code: 'BB', name: 'Beta Air' },
    originAirport: {
      code: 'AAA',
      name: 'Alpha',
      city: 'Alpha',
      country: 'A-Land',
      latitude: 0,
      longitude: 0,
    },
    destinationAirport: {
      code: 'CCC',
      name: 'Gamma',
      city: 'Gamma',
      country: 'C-Land',
      latitude: 0,
      longitude: 0,
    },
    classes: [],
  },
]

describe('FlightFilters', () => {
  it('filters flights by airline when checkbox toggled and Apply Filters clicked', () => {
    render(
      <FlightFilters flights={flightsMock} onFilterChange={onFilterChangeMock} />,
    )

    // Select Beta Air airline checkbox
    const betaCheckbox = screen.getByLabelText(/beta air/i)
    fireEvent.click(betaCheckbox)

    // Apply filters
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }))

    // onFilterChange should be eventually called with only flight id 2
    const expected = flightsMock.filter((f) => f.airline.code === 'BB')

    // Because filtering is synchronous inside useEffect after state update, the last call arg should equal expected
    expect(onFilterChangeMock.mock.calls.pop()?.[0]).toEqual(expected)
  })

  it('clears filters when "Clear All" clicked', () => {
    render(
      <FlightFilters flights={flightsMock} onFilterChange={onFilterChangeMock} />,
    )

    // Adjust price max to lower than second flight price
    fireEvent.change(screen.getAllByPlaceholderText('Max')[0], { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }))

    // Now clear all
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))

    // onFilterChange should eventually include all flights again
    expect(onFilterChangeMock.mock.calls.pop()?.[0]).toEqual(flightsMock)
  })
}) 