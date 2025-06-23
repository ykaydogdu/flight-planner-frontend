import { create } from 'zustand'
import { Flight, FlightSearchParams, Airport, Airline } from '@/types'
import { apiClient } from '@/lib/api'

interface FlightState {
  flights: Flight[]
  airports: Airport[]
  airlines: Airline[]
  loading: boolean
  searchParams: FlightSearchParams | null
  searchFlights: (params: FlightSearchParams) => Promise<void>
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

  searchFlights: async (params: FlightSearchParams) => {
    set({ loading: true, searchParams: params })
    try {
      const response = await apiClient.get<Flight[]>('/flights/', {
        params: {
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          passengers: params.passengers,
        },
      })
      set({ flights: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchAirports: async () => {
    try {
      const response = await apiClient.get<Airport[]>('/airports/')
      set({ airports: response.data })
    } catch (error) {
      throw error
    }
  },

  fetchAirlines: async () => {
    try {
      const response = await apiClient.get<Airline[]>('/airlines/')
      set({ airlines: response.data })
    } catch (error) {
      throw error
    }
  },

  clearFlights: () => {
    set({ flights: [], searchParams: null })
  },
})) 