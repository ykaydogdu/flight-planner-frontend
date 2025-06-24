import { create } from 'zustand'
import type { User } from '@/types'
import { apiClient } from '@/lib/api'

interface UserState {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    loading: false,
    fetchUsers: async () => {
        set({ loading: true })
        try {
            const response = await apiClient.get<User[]>('/users/')
            set({ users: response.data })
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            set({ loading: false })
        }
    }
}))