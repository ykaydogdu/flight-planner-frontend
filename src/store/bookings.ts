import { create } from 'zustand'
import type { Booking } from '@/types'
import { apiClient } from '@/lib/api'

interface BookingState {
  bookings: Booking[]
  loading: boolean
  fetchBookings: () => Promise<void>
  cancelBooking: (bookingId: number) => Promise<void>
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,

  fetchBookings: async () => {
    set({ loading: true })
    try {
      const response = await apiClient.get<Booking[]>('/bookings/my-bookings')
      set({ bookings: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Failed to fetch bookings', error)
      throw error
    }
  },

  cancelBooking: async (bookingId: number) => {
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`)
      // Refresh bookings after cancellation
      await get().fetchBookings()
    } catch (error) {
      console.error('Failed to cancel booking', error)
      throw error
    }
  },
})) 