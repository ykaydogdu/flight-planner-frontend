import { create } from 'zustand'
import type { User } from '@/types'
import { apiClient } from '@/lib/api'

interface UserState {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
  assignRole: (username: string, role: string) => Promise<void>
  assignAirline: (username: string, airlineCode: string) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    loading: false,
    
    fetchUsers: async () => {
        set({ loading: true })
        try {
            const response = await apiClient.get<User[]>('/users')
            set({ users: response.data })
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            set({ loading: false })
        }
    },
    
    assignRole: async (username: string, role: string) => {
        set({ loading: true })
        try {
            await apiClient.patch(`/users/${username}/assign-role`, null, {
                params: { role }
            })
            // Update local state
            const users = get().users.map(user => 
                user.username === username 
                    ? { ...user, role: role as User['role'] }
                    : user
            )
            set({ users })
        } catch (error) {
            console.error('Error assigning role:', error)
            throw error
        } finally {
            set({ loading: false })
        }
    },
    
    assignAirline: async (username: string, airlineCode: string) => {
        set({ loading: true })
        try {
            await apiClient.patch(`/users/${username}/assign-airline`, null, {
                params: { airlineCode }
            })
            // Refresh users to get updated airline info
            await get().fetchUsers()
        } catch (error) {
            console.error('Error assigning airline:', error)
            throw error
        } finally {
            set({ loading: false })
        }
    }
}))