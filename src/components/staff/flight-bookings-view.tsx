import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import type { Flight } from '@/types'
import { 
  DollarSign, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Clock
} from 'lucide-react'

interface FlightWithBookings extends Flight {
  bookings?: BookingInfo[]
  totalBookings?: number
  totalRevenue?: number
  bookedSeats?: number
}

interface BookingInfo {
  id: number
  passengerName: string
  passengerEmail: string
  numberOfSeats: number
  bookingDate: string
  status: string
}

export function FlightBookingsView() {
  const { user } = useAuthStore()
  const [flights, setFlights] = useState<FlightWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFlights, setExpandedFlights] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const fetchFlightsWithBookings = useCallback(async () => {
    if (!user?.airline?.code) return

    try {
      setLoading(true)
      const flightsResponse = await apiClient.get<Flight[]>('/flights', {
        params: { airlineCode: user.airline.code }
      })

      // Mock booking data since the endpoint might not exist yet
      const flightsWithBookings = flightsResponse.data.map((flight) => ({
        ...flight,
        bookings: [],
        totalBookings: 0,
        totalRevenue: 0,
        bookedSeats: 0
      }))

      setFlights(flightsWithBookings)
    } catch (error) {
      console.error('Error fetching flights with bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.airline?.code])

  useEffect(() => {
    fetchFlightsWithBookings()
  }, [fetchFlightsWithBookings])

  const toggleFlightExpansion = (flightId: number) => {
    const newExpanded = new Set(expandedFlights)
    if (newExpanded.has(flightId)) {
      newExpanded.delete(flightId)
    } else {
      newExpanded.add(flightId)
    }
    setExpandedFlights(newExpanded)
  }

  const filteredFlights = flights.filter(flight =>
    flight.originAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.originAirport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const totalFlights = flights.length
  const totalBookings = flights.reduce((sum, flight) => sum + (flight.totalBookings || 0), 0)
  const totalRevenue = flights.reduce((sum, flight) => sum + (flight.totalRevenue || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Flight Bookings Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  ✈️
                </div>
                <div>
                  <p className="text-xl font-bold">{totalFlights}</p>
                  <p className="text-sm text-gray-600">Total Flights</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  📋
                </div>
                <div>
                  <p className="text-xl font-bold">{totalBookings}</p>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  💰
                </div>
                <div>
                  <p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search flights by airport code or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Flights List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">Loading flight bookings...</div>
          ) : filteredFlights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No flights found</div>
          ) : (
            <div className="space-y-3">
              {filteredFlights.map((flight) => {
                const isExpanded = expandedFlights.has(flight.id)

                return (
                  <div key={flight.id} className="border rounded-lg overflow-hidden">
                    <div 
                      className="p-4 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleFlightExpansion(flight.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono">
                              {flight.originAirport.code}
                            </Badge>
                            <span>→</span>
                            <Badge variant="secondary" className="font-mono">
                              {flight.destinationAirport.code}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(flight.departureTime)}
                          </div>

                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-4 w-4" />
                            ${flight.price}
                          </div>

                          <div className="text-sm text-gray-600">
                            {flight.emptySeats} seats available
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {flight.totalBookings || 0} bookings
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 mt-2">
                        {flight.originAirport.city} → {flight.destinationAirport.city}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="font-medium mb-3">Booking Details</h4>
                        <div className="text-center py-4 text-gray-500">
                          No bookings for this flight yet
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 