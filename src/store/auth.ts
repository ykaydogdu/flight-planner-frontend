import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthRequest, AuthResponse } from '@/types'
import { apiClient } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: AuthRequest) => Promise<void>
  logout: () => void
  register: (data: { username: string; email: string; password: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials: AuthRequest) => {
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
          const { token, user } = response.data
          
          localStorage.setItem('auth-token', token)
          set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('auth-token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      register: async (data: { username: string; email: string; password: string }) => {
        await apiClient.post('/auth/register', data)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
) 