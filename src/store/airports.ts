import { create } from 'zustand'
import type { Airport } from '@/types'
import { apiClient } from '@/lib/api'

interface AirportState {
  airports: Airport[]
  loading: boolean
  fetchAirports: () => Promise<void>
  createAirport: (airport: Omit<Airport, 'id'>) => Promise<void>
  deleteAirport: (code: string) => Promise<void>
}

export const useAirportStore = create<AirportState>((set, get) => ({
  airports: [],
  loading: false,
  
  fetchAirports: async () => {
    set({ loading: true })
    try {
      const response = await apiClient.get<Airport[]>('/airports')
      set({ airports: response.data })
    } catch (error) {
      console.error('Error fetching airports:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  createAirport: async (airport) => {
    set({ loading: true })
    try {
      const response = await apiClient.post<Airport>('/airports', airport)
      set({ airports: [...get().airports, response.data] })
    } catch (error) {
      console.error('Error creating airport:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },
  
  deleteAirport: async (code) => {
    set({ loading: true })
    try {
      await apiClient.delete(`/airports/${code}`)
      set({ airports: get().airports.filter(airport => airport.code !== code) })
    } catch (error) {
      console.error('Error deleting airport:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  }
})) 