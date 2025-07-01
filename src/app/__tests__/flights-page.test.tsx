import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import FlightsPage from '../flights/page'
import { useFlightStore } from '@/store/flights'
import type { Flight, Airport, Airline, FlightSearchParams } from '@/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('@/store/flights', () => ({
    useFlightStore: vi.fn(),
}))

const mockAirports: Airport[] = [
    { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', latitude: 51.4700, longitude: -0.4543 },
    { code: 'JFK', name: 'JFK', city: 'New York', country: 'USA', latitude: 40.6413, longitude: -73.7781 },
]

const mockFlights: Flight[] = [
    { id: 1, airline: { code: 'BA', name: 'British Airways' }, originAirport: mockAirports[0], destinationAirport: mockAirports[1], departureTime: '2024-08-01T10:00:00Z', arrivalTime: '2024-08-01T13:00:00Z', minPrice: 500, emptySeats: 100, duration: 180, seatCount: 200, classes: [] },
    { id: 2, airline: { code: 'AA', name: 'American Airlines' }, originAirport: mockAirports[0], destinationAirport: mockAirports[1], departureTime: '2024-08-01T12:00:00Z', arrivalTime: '2024-08-01T15:00:00Z', minPrice: 450, emptySeats: 120, duration: 180, seatCount: 200, classes: [] },
    { id: 3, airline: { code: 'VS', name: 'Virgin Atlantic' }, originAirport: mockAirports[0], destinationAirport: mockAirports[1], departureTime: '2024-08-01T09:00:00Z', arrivalTime: '2024-08-01T12:00:00Z', minPrice: 550, emptySeats: 80, duration: 180, seatCount: 200, classes: [] },
]

const searchParams = {
    originAirportCode: 'LHR',
    destinationAirportCode: 'JFK',
    departureDate: '2024-08-01',
}

const mockUseFlightStore = (
    { flights = [], loading = false, sParams = searchParams, airports = [], airlines = [] }: { flights: Flight[], loading: boolean, sParams: FlightSearchParams | undefined, airports: Airport[], airlines: Airline[] }
) => {
    (useFlightStore as unknown as Mock).mockReturnValue({
        flights,
        loading,
        searchParams: sParams,
        airports,
        airlines,
        fetchAirports: vi.fn(),
        fetchAirlines: vi.fn(),
        searchFlights: vi.fn(),
    })
}

describe('FlightsPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>)
    }

    it('should render loading state', () => {
        mockUseFlightStore({ flights: [], loading: true, sParams: undefined, airports: [], airlines: [] })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('Search Results')).toBeInTheDocument()
        expect(screen.queryAllByTestId('flight-card').length).toBe(0)
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render "No flights found" message when no flights are available', () => {
        mockUseFlightStore({ flights: [] as Flight[], loading: false, sParams: undefined, airports: [], airlines: [] })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('No flights found')).toBeInTheDocument()
        expect(screen.getByText("We couldn't find any flights matching your search criteria.")).toBeInTheDocument()
    })

    it('should display flights and search summary', () => {
        mockUseFlightStore({ flights: mockFlights, loading: false, sParams: undefined, airports: [], airlines: [] })
        renderWithRouter(<FlightsPage />)
        const summary = screen.getByRole('heading', { level: 1, name: /LHR → JFK/ })
        expect(summary).toBeInTheDocument()
        expect(screen.getAllByTestId('flight-card')).toHaveLength(3)
    })

    it('should show search form by default when there are no search params', () => {
        mockUseFlightStore({ flights: [], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [] })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('Search Flights')).toBeInTheDocument()
    })

    it('should show and hide search form on button click', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [] })
        renderWithRouter(<FlightsPage />)
        const modifySearchButton = screen.getByRole('button', { name: /Modify Search/i })
        expect(screen.queryByText('Modify Your Search')).not.toBeInTheDocument()
        await userEvent.click(modifySearchButton)
        expect(screen.getByText('Modify Your Search')).toBeInTheDocument()
        await userEvent.click(modifySearchButton)
        expect(screen.queryByText('Modify Your Search')).not.toBeInTheDocument()
    })

    it('should sort flights by price by default and allow toggling order', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: [], airlines: [] })
        renderWithRouter(<FlightsPage />)
        const flightCards = screen.getAllByTestId('flight-card')
        // Default sort: price ascending
        expect(within(flightCards[0]).getByText('$450 per person')).toBeInTheDocument()
        expect(within(flightCards[1]).getByText('$500 per person')).toBeInTheDocument()
        expect(within(flightCards[2]).getByText('$550 per person')).toBeInTheDocument()

        const priceSortButton = screen.getByRole('button', { name: /Price/i })
        await userEvent.click(priceSortButton)

        const flightCardsDesc = screen.getAllByTestId('flight-card')
        // Sort: price descending
        expect(within(flightCardsDesc[0]).getByText('$550 per person')).toBeInTheDocument()
        expect(within(flightCardsDesc[1]).getByText('$500 per person')).toBeInTheDocument()
        expect(within(flightCardsDesc[2]).getByText('$450 per person')).toBeInTheDocument()
    })

    it('should sort flights by departure time', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: [], airlines: [] })
        renderWithRouter(<FlightsPage />)

        const departureSortButton = screen.getByRole('button', { name: /Departure/i })
        await userEvent.click(departureSortButton)

        let flightCards = screen.getAllByTestId('flight-card')
        // Sort: departure ascending
        expect(within(flightCards[0]).getByText('Virgin Atlantic')).toBeInTheDocument() // 09:00
        expect(within(flightCards[1]).getByText('British Airways')).toBeInTheDocument() // 10:00
        expect(within(flightCards[2]).getByText('American Airlines')).toBeInTheDocument() // 12:00

        await userEvent.click(departureSortButton)
        flightCards = screen.getAllByTestId('flight-card')
        // Sort: departure descending
        expect(within(flightCards[0]).getByText('American Airlines')).toBeInTheDocument() // 12:00
        expect(within(flightCards[1]).getByText('British Airways')).toBeInTheDocument() // 10:00
        expect(within(flightCards[2]).getByText('Virgin Atlantic')).toBeInTheDocument() // 09:00
    })

    it('should show "No flights match your filters" message', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [] })
        renderWithRouter(<FlightsPage />)
        const filtersButton = screen.getByRole('button', { name: /Filters/i })
        await userEvent.click(filtersButton)

        const minPriceInput = screen.getByPlaceholderText('Min')
        await userEvent.type(minPriceInput, '1000')

        const applyButton = screen.getByRole('button', { name: /Apply Filters/i })
        await userEvent.click(applyButton)

        expect(screen.getByText('No flights match your filters')).toBeInTheDocument()
    })

    it('should filter flights by airline', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [] })
        renderWithRouter(<FlightsPage />)
        const filtersButton = screen.getByRole('button', { name: /Filters/i })
        await userEvent.click(filtersButton)

        const airlineCheckbox = screen.getByLabelText(/British Airways/i)
        await userEvent.click(airlineCheckbox)

        const applyButton = screen.getByRole('button', { name: /Apply Filters/i })
        await userEvent.click(applyButton)

        expect(screen.getAllByTestId('flight-card')).toHaveLength(1)
        expect(screen.getByText('British Airways')).toBeInTheDocument()
    })
})
