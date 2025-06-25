import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlightManagement } from '@/components/staff/flight-management'
import { FlightBookingsView } from '@/components/staff/flight-bookings-view'
import backgroundImage from '@/assets/background.jpeg'

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'flights' | 'bookings'>('flights')

  useEffect(() => {
    if (user?.role !== 'ROLE_AIRLINE_STAFF') {
      navigate('/')
    }
  }, [user, navigate])

  if (user?.role !== 'ROLE_AIRLINE_STAFF') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need airline staff privileges to access this page.</p>
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
        <div className="mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-gray-600">
            Manage flights for {user.airline?.name} ({user.airline?.code})
          </p>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    ✈️
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-gray-600">Active Flights</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    📊
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 text-secondary-foreground">
            <Button
              variant={activeTab === 'flights' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('flights')}
              className="flex-1"
            >
              ✈️ Flight Management
            </Button>
            <Button
              variant={activeTab === 'bookings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('bookings')}
              className="flex-1"
            >
              📊 Flight Bookings
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'flights' && <FlightManagement />}
        {activeTab === 'bookings' && <FlightBookingsView />}
      </div>
    </div>
  )
} 