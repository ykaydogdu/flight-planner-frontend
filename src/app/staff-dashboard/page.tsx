import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FlightManagement } from '@/components/staff/flight-management'
import { FlightBookingsView } from '@/components/staff/flight-bookings-view'
import { DollarSign, Users, Plane } from 'lucide-react'

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'bookings' | 'flights'>('bookings')
  const [overallStats, setOverallStats] = useState({
    activeFlights: 0,
    overallBookingCount: 0,
    overallRevenue: 0,
    overallPassengerCount: 0
  })
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-gray-600">
            Manage flights for {user.airline?.name} ({user.airline?.code})
          </p>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Flights</p>
                    <p className="text-2xl font-bold">{overallStats.activeFlights}</p>
                  </div>
                  <Plane className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{overallStats.overallBookingCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">${overallStats.overallRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                    <p className="text-2xl font-bold">{overallStats.overallPassengerCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 text-secondary-foreground">
              <Button
                variant={activeTab === 'bookings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('bookings')}
                className="flex-1"
              >
                📊 Flight Bookings
              </Button>
              <Button
                variant={activeTab === 'flights' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('flights')}
                className="flex-1"
              >
                ✈️ Flight Management
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'flights' && <FlightManagement />}
          {activeTab === 'bookings' && <FlightBookingsView setOverallStats={setOverallStats} />}
        </div>
      </div>
    </div>
  )
} 