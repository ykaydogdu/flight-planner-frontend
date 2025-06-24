import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '@/store/user'
import { useAirlineStore } from '@/store/airlines'
import { useAirportStore } from '@/store/airports'
import { UserManagement } from '@/components/admin/user-management'
import { AirlineManagement } from '@/components/admin/airline-management'
import { AirportManagement } from '@/components/admin/airport-management'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import backgroundImage from '@/assets/background.jpeg'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUserStore()
  const { airlines, fetchAirlines } = useAirlineStore()
  const { airports, fetchAirports } = useAirportStore()
  const [activeTab, setActiveTab] = useState<'users' | 'airlines' | 'airports'>('users')

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    // Fetch all data when component mounts
    fetchUsers()
    fetchAirlines()
    fetchAirports()
  }, [fetchUsers, fetchAirlines, fetchAirports])

  // Calculate validation issues
  const validationIssues = users.filter(user => {
    return (user.role === 'ROLE_AIRLINE_STAFF' && !user.airline) || // staff without airline
      (user.role !== 'ROLE_AIRLINE_STAFF' && user.airline) // not staff user with airline
  })

  if (user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${backgroundImage})` }} />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users, airlines, and airports</p>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    👥
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    ✈️
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{airlines.length}</p>
                    <p className="text-sm text-gray-600">Airlines</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    🏢
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{airports.length}</p>
                    <p className="text-sm text-gray-600">Airports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    ⚠️
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{validationIssues.length}</p>
                    <p className="text-sm text-gray-600">Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className="flex-1"
            >
              👥 User Management
              {validationIssues.length > 0 && (
                <Badge variant="destructive" className="ml-2">{validationIssues.length}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'airlines' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('airlines')}
              className="flex-1"
            >
              ✈️ Airlines
            </Button>
            <Button
              variant={activeTab === 'airports' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('airports')}
              className="flex-1"
            >
              🏢 Airports
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'airlines' && <AirlineManagement />}
        {activeTab === 'airports' && <AirportManagement />}
      </div>
    </div>
  )
}
