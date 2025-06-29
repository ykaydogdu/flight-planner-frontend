export interface User {
  username: string
  firstName: string
  lastName: string
  email: string
  role: 'ROLE_USER' | 'ROLE_AIRLINE_STAFF' | 'ROLE_ADMIN'
  airline?: Airline | null
}

export interface AuthRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Airport {
  code: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
}

export interface Airline {
  code: string
  name: string
  staffCount: number
}

export interface AirlineInfo {
  code: string
  name: string
}

export interface Flight {
  id: number
  price: number
  seatCount: number
  emptySeats: number
  departureTime: string
  duration: number
  arrivalTime: string // departureTime + duration adjusted for timezone (handled by backend)
  airline: AirlineInfo
  originAirport: Airport
  destinationAirport: Airport
}

export interface FlightSearchParams {
  airlineCode?: string
  originAirportCode: string
  destinationAirportCode: string
  departureDate?: string
}

export interface Booking {
  id: number
  flightId: number
  price: number
  numberOfSeats: number
  airline: AirlineInfo
  originAirport: Airport
  destinationAirport: Airport
  departureTime: string
  duration: number
  arrivalTime: string
  status: 'CONFIRMED' | 'CANCELLED'
}

export interface BookingRequest {
  flightId: number
  username: string
  numberOfSeats: number
} 