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

export type FlightClassType = 'ECONOMY' | 'BUSINESS' | 'FIRST_CLASS'

export interface FlightClass {
  flightClass: FlightClassType
  seatCount: number
  availableSeats: number
  price: number
}

export interface Flight {
  id: number
  minPrice: number
  seatCount: number
  emptySeats: number
  departureTime: string
  duration: number
  arrivalTime: string // departureTime + duration adjusted for timezone (handled by backend)
  airline: AirlineInfo
  originAirport: Airport
  destinationAirport: Airport
  classes: FlightClass[]
}

export interface FlightSearchParams {
  airlineCode?: string
  originAirportCode: string
  destinationAirportCode: string
  departureDate?: string
  passengerEconomy?: number
  passengerBusiness?: number
  passengerFirstClass?: number
  includePast?: boolean
}

export interface Booking {
  id: number
  airline: AirlineInfo
  originAirport: Airport
  destinationAirport: Airport
  departureTime: string
  duration: number
  arrivalTime: string
  passengers: Passenger[]
  bookingDate: string
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED'
}

export interface BookingRequest {
  flightId: number
  username: string
  passengers: Passenger[]
}

export interface Passenger {
  firstName: string
  lastName: string
  email: string
  flightClass: FlightClassType
  priceAtBooking: number
}

export interface PassengerSelection {
  economy: number
  business: number
  firstClass: number
}