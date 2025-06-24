import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '@/store/user'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUserStore()

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-4">
        {users.map((user) => (
          <div key={user.id} className="p-2 border rounded-md">
            <h2 className="text-lg font-bold">{user.username}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
