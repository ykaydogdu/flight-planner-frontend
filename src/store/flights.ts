import { create } from 'zustand'
import type { Flight, FlightSearchParams, Airport, Airline, Booking } from '@/types'
import { apiClient } from '@/lib/api'

export interface BookingInfo {
  id: number
  passengerName: string
  passengerEmail: string
  numberOfSeats: number
  bookingDate: string
  status: string
  flightClass?: string
  totalPrice?: number
}

export interface FlightStats {
  flightId: number
  bookingCount: number
  revenue: number
  passengerCount: number
  bookings: BookingInfo[]
}

export interface StatsResponse {
  flightStats: FlightStats[]
  overallBookingCount: number
  overallPassengerCount: number
  overallRevenue: number
}

export interface FlightFormData {
  departureTime: string
  originAirportCode: string
  destinationAirportCode: string
  flightClasses: Array<{
    flightClass: 'ECONOMY' | 'BUSINESS' | 'FIRST_CLASS'
    price: number
    seatCount: number
  }>
}

export interface FlightRequestData extends FlightFormData {
  airlineCode: string
}

interface FlightState {
  flights: Flight[]
  airports: Airport[]
  airlines: Airline[]
  loading: boolean
  searchParams: Partial<FlightSearchParams> | null
  searchFlights: (params: Partial<FlightSearchParams>) => Promise<void>
  fetchFlightById: (flightId: number) => Promise<Flight>
  fetchFlightStats: (airlineCode: string) => Promise<StatsResponse>
  createFlight: (flightData: FlightRequestData) => Promise<void>
  updateFlight: (flightId: number, flightData: FlightRequestData) => Promise<void>
  deleteFlight: (flightId: number) => Promise<void>
  fetchBookingsForFlight: (flightId: number) => Promise<Booking[]>
  fetchAirports: () => Promise<void>
  fetchAirlines: () => Promise<void>
  clearFlights: () => void
}

export const useFlightStore = create<FlightState>((set) => ({
  flights: [],
  airports: [],
  airlines: [],
  loading: false,
  searchParams: null,

  searchFlights: async (params: Partial<FlightSearchParams>) => {
    set({ loading: true, searchParams: params })
    try {
      const response = await apiClient.get<Flight[]>('/flights', {
        params: params,
      })
      set({ flights: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchFlightById: async (flightId: number) => {
    try {
      const response = await apiClient.get<Flight>(`/flights/${flightId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch flight by ID', error)
      throw error
    }
  },

  fetchFlightStats: async (airlineCode: string) => {
    try {
      const response = await apiClient.get<StatsResponse>('/flights/stats', {
        params: { airlineCode }
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch flight stats', error)
      throw error
    }
  },

  createFlight: async (flightData: FlightRequestData) => {
    try {
      await apiClient.post('/flights', flightData)
    } catch (error) {
      console.error('Failed to create flight', error)
      throw error
    }
  },

  updateFlight: async (flightId: number, flightData: FlightRequestData) => {
    try {
      await apiClient.put(`/flights/${flightId}`, flightData)
    } catch (error) {
      console.error('Failed to update flight', error)
      throw error
    }
  },

  deleteFlight: async (flightId: number) => {
    try {
      await apiClient.delete(`/flights/${flightId}`)
    } catch (error) {
      console.error('Failed to delete flight', error)
      throw error
    }
  },

  fetchBookingsForFlight: async (flightId: number) => {
    try {
      const response = await apiClient.get<Booking[]>('/bookings', {
        params: { flightId }
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch bookings for flight', error)
      throw error
    }
  },

  fetchAirports: async () => {
    const response = await apiClient.get<Airport[]>('/airports')
    set({ airports: response.data })
  },

  fetchAirlines: async () => {
    const response = await apiClient.get<Airline[]>('/airlines')
    set({ airlines: response.data })
  },

  clearFlights: () => {
    set({ flights: [], searchParams: null })
  },
})) 