import { create } from 'zustand'
import type { Airline } from '@/types'
import { apiClient } from '@/lib/api'

interface AirlineState {
  airlines: Airline[]
  loading: boolean
  fetchAirlines: () => Promise<void>
  createAirline: (airline: Omit<Airline, 'id'>) => Promise<void>
  deleteAirline: (code: string) => Promise<void>
}

export const useAirlineStore = create<AirlineState>((set, get) => ({
  airlines: [],
  loading: false,
  
  fetchAirlines: async () => {
    set({ loading: true })
    try {
      const response = await apiClient.get<Airline[]>('/airlines')
      set({ airlines: response.data })
    } catch (error) {
      console.error('Error fetching airlines:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  createAirline: async (airline) => {
    set({ loading: true })
    try {
      const response = await apiClient.post<Airline>('/airlines', airline)
      set({ airlines: [...get().airlines, response.data] })
    } catch (error) {
      console.error('Error creating airline:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },
  
  deleteAirline: async (code) => {
    set({ loading: true })
    try {
      await apiClient.delete(`/airlines/${code}`)
      set({ airlines: get().airlines.filter(airline => airline.code !== code) })
    } catch (error) {
      console.error('Error deleting airline:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  }
})) 