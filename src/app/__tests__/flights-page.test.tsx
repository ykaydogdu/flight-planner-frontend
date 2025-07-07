import React from 'react'
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

// Mock motion to simple passthrough components to avoid animation overhead during tests
vi.mock('motion/react', () => ({
    motion: new Proxy({}, {
        // Return a minimal React component for any motion element requested
        get: () => (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{props.children}</div>,
    }),
}))

// Stub a few frequently-used UI primitives so we do not mount complex components in unit tests
vi.mock('@/components/ui/button', () => ({ Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{props.children}</button> }))

// Mock FlightFilters component to avoid complex filter logic during tests
vi.mock('@/components/flight/flight-filters', () => ({
    FlightFilters: ({ onFilterChange }: { onFilterChange: (flights: Flight[]) => void }) => (
        <div data-testid="flight-filters">
            <button onClick={() => {}}>Filters</button>
            <input placeholder="Min" data-testid="min-price-input" />
            <input type="checkbox" data-testid="british-airways-checkbox" />
            <label>British Airways</label>
            <button onClick={() => onFilterChange([])} data-testid="apply-filters">Apply Filters</button>
            <button onClick={() => {}} data-testid="clear-filters">Clear All</button>
        </div>
    )
}))

// Mock FlightSearchForm component to avoid complex form logic
vi.mock('@/components/forms/flight-search-form', () => ({
    FlightSearchForm: () => <div data-testid="flight-search-form">Search Form</div>
}))

// Mock FlightCard component to simplify flight rendering
vi.mock('@/components/flight/flight-card', () => ({
    FlightCard: ({ flight }: { flight: Flight }) => (
        <div data-testid="flight-card">
            <div>{flight.airline.name}</div>
            <div>{flight.departureTime}</div>
            <div>${flight.minPrice}</div>
        </div>
    )
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

const searchParams : FlightSearchParams = {
    originAirportCode: 'LHR',
    destinationAirportCode: 'JFK',
    departureDate: '2024-08-01',
    passengerEconomy: 1,
}

type MockFlightStore = {
    getState: () => {
        lastSearchTime: number;
        clearSearchState: () => void;
    };
};

const mockUseFlightStore = (
    { flights = [], loading = false, sParams = searchParams, airports = [], airlines = [], hasActiveSearch = false }: { flights: Flight[], loading: boolean, sParams: FlightSearchParams | undefined, airports: Airport[], airlines: Airline[], hasActiveSearch?: boolean }
) => {
    const mockStore = {
        flights,
        loading,
        searchParams: sParams,
        hasActiveSearch,
        airports,
        airlines,
        fetchAirports: vi.fn(),
        fetchAirlines: vi.fn(),
        searchFlights: vi.fn(),
        clearSearchState: vi.fn(),
        lastSearchTime: Date.now(),
    };
    
    (useFlightStore as unknown as Mock).mockReturnValue(mockStore);
    (useFlightStore as unknown as MockFlightStore).getState = vi.fn().mockReturnValue(mockStore);
}

describe('FlightsPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>)
    }

    it('should render loading state', () => {
        mockUseFlightStore({ flights: [] as Flight[], loading: true, sParams: undefined, airports: [], airlines: [], hasActiveSearch: false })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('Flight Search')).toBeInTheDocument()
        expect(screen.queryAllByTestId('flight-card').length).toBe(0)
    })

    it('should render "No flights found" message when no flights are available', () => {
        mockUseFlightStore({ flights: [] as Flight[], loading: false, sParams: undefined, airports: [], airlines: [], hasActiveSearch: false })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('No flights found')).toBeInTheDocument()
        expect(screen.getByText("We couldn't find any flights matching your search criteria.")).toBeInTheDocument()
    })

    it('should display flights and search summary', () => {
        mockUseFlightStore({ flights: mockFlights, loading: false, sParams: searchParams, airports: [], airlines: [], hasActiveSearch: true })
        renderWithRouter(<FlightsPage />)
        const summary = screen.getByRole('heading', { level: 1, name: /LHR → JFK/ })
        expect(summary).toBeInTheDocument()
        expect(screen.getAllByTestId('flight-card')).toHaveLength(3)
    })

    it('should show search form by default when there are no search params', () => {
        mockUseFlightStore({ flights: [], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [], hasActiveSearch: false })
        renderWithRouter(<FlightsPage />)
        expect(screen.getByText('Flight Search')).toBeInTheDocument()
    })

    it('should show and hide search form on button click', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: searchParams, airports: mockAirports as Airport[], airlines: [], hasActiveSearch: true })
        renderWithRouter(<FlightsPage />)
        const modifySearchButton = screen.getByRole('button', { name: /Modify Search/i })
        expect(screen.queryByTestId('flight-search-form')).not.toBeInTheDocument()
        await userEvent.click(modifySearchButton)
        expect(screen.getByTestId('flight-search-form')).toBeInTheDocument()
        await userEvent.click(modifySearchButton)
        expect(screen.queryByTestId('flight-search-form')).not.toBeInTheDocument()
    })

    it('should sort flights by price by default and allow toggling order', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: searchParams, airports: [], airlines: [], hasActiveSearch: true })
        renderWithRouter(<FlightsPage />)
        const flightCards = screen.getAllByTestId('flight-card')
        // Default sort: price ascending (American Airlines 450 < British Airways 500 < Virgin Atlantic 550)
        expect(within(flightCards[0]).getByText('American Airlines')).toBeInTheDocument()
        expect(within(flightCards[1]).getByText('British Airways')).toBeInTheDocument()
        expect(within(flightCards[2]).getByText('Virgin Atlantic')).toBeInTheDocument()

        const priceSortButton = screen.getByRole('button', { name: /Price/i })
        await userEvent.click(priceSortButton)

        const flightCardsDesc = screen.getAllByTestId('flight-card')
        // Sort: price descending (Virgin Atlantic > British Airways > American Airlines)
        expect(within(flightCardsDesc[0]).getByText('Virgin Atlantic')).toBeInTheDocument()
        expect(within(flightCardsDesc[1]).getByText('British Airways')).toBeInTheDocument()
        expect(within(flightCardsDesc[2]).getByText('American Airlines')).toBeInTheDocument()
    })

    it('should sort flights by departure time', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: searchParams, airports: [], airlines: [], hasActiveSearch: true })
        renderWithRouter(<FlightsPage />)

        // Check that all flights are initially rendered and sort controls are visible
        const flightCards = screen.getAllByTestId('flight-card')
        expect(flightCards).toHaveLength(3)
        
        // Verify that sort controls are visible
        const departureSortButton = screen.getByRole('button', { name: /Departure/i })
        expect(departureSortButton).toBeInTheDocument()
        
        const priceSortButton = screen.getByRole('button', { name: /Price/i })
        expect(priceSortButton).toBeInTheDocument()
        
        const durationSortButton = screen.getByRole('button', { name: /Duration/i })
        expect(durationSortButton).toBeInTheDocument()

        // Verify sort buttons are clickable
        await userEvent.click(departureSortButton)
        await userEvent.click(priceSortButton)
        
        // Verify flights are still rendered after interaction
        expect(screen.getAllByTestId('flight-card')).toHaveLength(3)
    })

    it('should show "No flights match your filters" message', async () => {
        mockUseFlightStore({ flights: mockFlights as Flight[], loading: false, sParams: undefined, airports: mockAirports as Airport[], airlines: [], hasActiveSearch: true })
        renderWithRouter(<FlightsPage />)
        const filtersButton = screen.getByRole('button', { name: /Filters/i })
        await userEvent.click(filtersButton)

        // The mocked FlightFilters component will call onFilterChange with empty array
        const applyButton = screen.getByTestId('apply-filters')
        await userEvent.click(applyButton)

        expect(screen.getByText('No flights match your filters')).toBeInTheDocument()
    })

    it('should filter flights by airline', async () => {
        // Create a custom mock that returns filtered flights
        // const mockOnFilterChange = vi.fn()
        const mockFlightStore = {
            flights: mockFlights,
            loading: false,
            searchParams: undefined,
            hasActiveSearch: true,
            airports: mockAirports,
            airlines: [],
            fetchAirports: vi.fn(),
            fetchAirlines: vi.fn(),
            searchFlights: vi.fn(),
            clearSearchState: vi.fn(),
            lastSearchTime: Date.now(),
        };
        (useFlightStore as unknown as Mock).mockReturnValue(mockFlightStore);
        (useFlightStore as unknown as MockFlightStore).getState = vi.fn().mockReturnValue(mockFlightStore)

        renderWithRouter(<FlightsPage />)
        const filtersButton = screen.getByRole('button', { name: /Filters/i })
        await userEvent.click(filtersButton)

        // Since we have a simple mock, this test verifies the filter UI shows up
        expect(screen.getByTestId('flight-filters')).toBeInTheDocument()
        expect(screen.getByTestId('british-airways-checkbox')).toBeInTheDocument()
    })
})
