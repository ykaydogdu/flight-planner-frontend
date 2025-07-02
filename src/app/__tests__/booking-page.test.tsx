import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

const mockNavigate = vi.fn()
let mockFlightId   = '1'
let mockQueryString =
  'passengerEconomy=1&passengerBusiness=0&passengerFirstClass=0'

vi.mock('react-router-dom', async () => {
  const actual: typeof import('react-router-dom') =
    await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate   : () => mockNavigate,
    useParams     : () => ({ flightId: mockFlightId }),
    useSearchParams: () => [new URLSearchParams(mockQueryString), vi.fn()],
  }
})

vi.mock('@/components/ui/button', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{props.children}</button>
  ),
}))
vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}))
vi.mock('@/components/ui/badge', () => ({
  Badge: (props: { children: React.ReactNode }) => <span>{props.children}</span>,
}))
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))
vi.mock('@/store/bookings', () => ({
  useBookingStore: vi.fn(),
}))
vi.mock('@/store/flights', () => ({
  useFlightStore: vi.fn(),
}))

import BookingPage from '../booking/page'
import type { Airport, Flight, User } from '@/types'
import { useAuthStore }   from '@/store/auth'
import { useBookingStore }from '@/store/bookings'
import { useFlightStore } from '@/store/flights'


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ flightId: mockFlightId }),
    useSearchParams: () => [new URLSearchParams(mockQueryString), vi.fn()],
  }
})

const mockAirports: Airport[] = [
  {
    code: 'LHR',
    name: 'Heathrow',
    city: 'London',
    country: 'UK',
    latitude: 51.4700,
    longitude: -0.4543,
  },
  {
    code: 'JFK',
    name: 'JFK',
    city: 'New York',
    country: 'USA',
    latitude: 40.6413,
    longitude: -73.7781,
  },
]

const baseFlight: Flight = {
  id: 1,
  airline: { code: 'BA', name: 'British Airways' },
  originAirport: mockAirports[0],
  destinationAirport: mockAirports[1],
  departureTime: '2024-08-01T10:00:00Z',
  arrivalTime: '2024-08-01T14:00:00Z',
  minPrice: 400,
  emptySeats: 100,
  duration: 240,
  seatCount: 200,
  classes: [
    { flightClass: 'ECONOMY', seatCount: 100, availableSeats: 90, price: 400 },
    { flightClass: 'BUSINESS', seatCount: 60, availableSeats: 50, price: 800 },
    { flightClass: 'FIRST_CLASS', seatCount: 40, availableSeats: 30, price: 1500 },
  ],
}

interface SetupOptions {
  isAuthenticated?: boolean
  flight?: Flight | null
  createBookingImpl?: () => Promise<unknown>
  userOverride?: User
}

function setup({
  isAuthenticated = true,
  flight = baseFlight,
  createBookingImpl = () => Promise.resolve({}),
  userOverride = {
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'ROLE_USER',
  },
}: SetupOptions = {}) {
  const user = isAuthenticated
    ? {
        ...userOverride,
      }
    : null

  // Mock Auth store behaviour
  ;(useAuthStore as unknown as Mock).mockReturnValue({
    user,
    token: isAuthenticated ? 'abc' : null,
    isAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    fetchUser: vi.fn(),
  })

  // Mock Booking store behaviour
  const createBooking = vi.fn(createBookingImpl)
  ;(useBookingStore as unknown as Mock).mockReturnValue({
    createBooking,
  })

  // Mock Flight store behaviour
  ;(useFlightStore as unknown as Mock).mockReturnValue({
    fetchFlightById: vi.fn().mockResolvedValue(flight),
  })

  render(<BookingPage />)

  return { createBooking }
}

// Tests ----------------------------------------------------------------------

describe('BookingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockNavigate.mockReset()
    mockFlightId = '1'
    mockQueryString = 'passengerEconomy=1&passengerBusiness=0&passengerFirstClass=0'
  })

  it('redirects unauthenticated users to login', () => {
    setup({ isAuthenticated: false })
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows loading state then flight details', async () => {
    const customFlight: Flight = { ...baseFlight, airline: { code: 'AA', name: 'American Airlines' } }
    setup({ flight: customFlight })

    // Initially skeleton (flight details heading absent)
    expect(screen.queryByText(/Review & Confirm Booking/i)).not.toBeInTheDocument()

    // Wait for heading to appear indicating data loaded
    const heading = await screen.findByRole('heading', { name: /Review & Confirm Booking/i })
    expect(heading).toBeInTheDocument()

    // Airline name visible
    expect(await screen.findByText('American Airlines')).toBeInTheDocument()
  })

  it('prefills first passenger form with logged in user data', async () => {
    mockQueryString = 'passengerEconomy=2&passengerBusiness=1&passengerFirstClass=0'
    setup()

    // Wait for passenger inputs to appear
    const firstNameInputs = await screen.findAllByPlaceholderText('Enter first name')
    const lastNameInputs = screen.getAllByPlaceholderText('Enter last name')
    const emailInputs = screen.getAllByPlaceholderText('Enter email address')

    expect(firstNameInputs[0]).toHaveValue('John')
    expect(lastNameInputs[0]).toHaveValue('Doe')
    expect(emailInputs[0]).toHaveValue('john@example.com')

    // Ensure total passengers = 3 (2 economy 1 business)
    expect(firstNameInputs).toHaveLength(3)
    expect(lastNameInputs).toHaveLength(3)
    expect(emailInputs).toHaveLength(3)
  })

  it('validates passenger info before booking', async () => {
    mockQueryString = 'passengerEconomy=2&passengerBusiness=0&passengerFirstClass=0'
    const { createBooking } = setup()

    // Only first passenger pre-filled; second remains empty
    const confirmBtn = await screen.findByRole('button', { name: /Confirm Booking/i })
    await userEvent.click(confirmBtn)

    // Shows validation error and createBooking not invoked
    expect(await screen.findByText(/Please fill in all required fields/i)).toBeInTheDocument()
    expect(createBooking).not.toHaveBeenCalled()
  })

  it('disables confirm button when not enough seats', async () => {
    mockQueryString = 'passengerEconomy=2&passengerBusiness=2&passengerFirstClass=0' // total 4
    const tightFlight = { ...baseFlight, emptySeats: 3 } // Only 3 seats
    setup({ flight: tightFlight })

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Booking/i })
    expect(confirmBtn).toBeDisabled()
  })

  it('submits booking and shows success message', async () => {
    mockQueryString = 'passengerEconomy=1&passengerBusiness=0&passengerFirstClass=0'
    const { createBooking } = setup()

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Booking/i })
    await userEvent.click(confirmBtn)
    
    expect(createBooking).toHaveBeenCalledWith({
      flightId: 1,
      username: 'john',
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        flightClass: 'ECONOMY',
        priceAtBooking: 400,
      }],
    })

    // Success card appears
    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument()
  })
})