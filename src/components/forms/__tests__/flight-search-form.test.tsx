import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FlightSearchForm } from '../flight-search-form'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Airport, Airline } from '@/types'

const searchFlightsMock = vi.fn(() => Promise.resolve())
const fetchAirportsMock = vi.fn()
const fetchAirlinesMock = vi.fn()

const airportsMock: Airport[] = [
  {
    code: 'AAA',
    name: 'Alpha Airport',
    city: 'Alpha',
    country: 'A-Land',
    latitude: 0,
    longitude: 0,
  },
  {
    code: 'BBB',
    name: 'Beta Airport',
    city: 'Beta',
    country: 'B-Land',
    latitude: 1,
    longitude: 1,
  },
]

const airlinesMock: Airline[] = [
  { code: 'EX', name: 'Example Air', staffCount: 42 },
]

vi.mock('@/store/flights', () => ({
  useFlightStore: () => ({
    searchFlights: searchFlightsMock,
    fetchAirports: fetchAirportsMock,
    fetchAirlines: fetchAirlinesMock,
    airports: airportsMock,
    airlines: airlinesMock,
    loading: false,
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

describe('FlightSearchForm', () => {
  it('shows validation errors for required fields', async () => {
    render(
      <MemoryRouter>
        <FlightSearchForm />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))

    expect(await screen.findByText(/please select an origin airport/i)).toBeInTheDocument()
    expect(await screen.findByText(/please select a destination airport/i)).toBeInTheDocument()
    expect(searchFlightsMock).not.toHaveBeenCalled()
  })

  it('submits valid search data and calls searchFlights', async () => {
    render(
      <MemoryRouter>
        <FlightSearchForm />
      </MemoryRouter>,
    )

    // Fill out fields
    fireEvent.change(screen.getByPlaceholderText(/origin airport/i), { target: { value: 'Alpha Airport' } })
    fireEvent.change(screen.getByPlaceholderText(/destination airport/i), { target: { value: 'Beta Airport' } })

    // Toggle "Any" button so date becomes optional
    fireEvent.click(screen.getByRole('button', { name: /any/i }))

    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))

    await waitFor(() => {
      expect(searchFlightsMock).toHaveBeenCalledWith({
        originAirportCode: 'AAA',
        destinationAirportCode: 'BBB',
      })
    })
  })
}) 