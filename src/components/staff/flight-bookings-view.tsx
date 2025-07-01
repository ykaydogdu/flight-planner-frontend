import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'
import type { Booking, Flight, Passenger } from '@/types'
import {
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'

interface FlightWithBookings extends Flight {
  bookings?: BookingInfo[]
  bookingsFetched?: boolean
  bookingCount?: number
  passengerCount?: number
  revenue?: number
}

interface BookingInfo {
  id: number
  passengerName: string
  passengerEmail: string
  numberOfSeats: number
  bookingDate: string
  status: string
  flightClass?: string
  totalPrice?: number
}

interface FlightStats {
  flightId: number
  bookingCount: number
  revenue: number
  passengerCount: number
  bookings: BookingInfo[]
}

interface StatsResponse {
  flightStats: FlightStats[]
  overallBookingCount: number
  overallPassengerCount: number
  overallRevenue: number
}

interface OverallStats {
  activeFlights: number
  overallBookingCount: number
  overallPassengerCount: number
  overallRevenue: number
}

export function FlightBookingsView({ setOverallStats }: { setOverallStats: (stats: OverallStats) => void }) {
  const { user } = useAuthStore()
  const [flights, setFlights] = useState<FlightWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFlights, setExpandedFlights] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingBookings, setLoadingBookings] = useState<Set<number>>(new Set())

  const fetchFlightsWithBookings = useCallback(async () => {
    if (!user?.airline?.code) return

    try {
      setLoading(true)

      // Fetch flights
      const flightsResponse = await apiClient.get<Flight[]>('/flights', {
        params: { airlineCode: user.airline.code }
      })

      // Fetch booking stats
      const statsResponse = await apiClient.get<StatsResponse>('/flights/stats', {
        params: { airlineCode: user.airline.code }
      })

      // Merge flight data with booking stats
      const flightsWithBookings = flightsResponse.data.map((flight) => {
        const flightStats = statsResponse.data.flightStats.find(stat => stat.flightId === flight.id)
        return {
          ...flight,
          bookings: [],
          bookingsFetched: false,
          bookingCount: flightStats?.bookingCount || 0,
          revenue: flightStats?.revenue || 0,
          passengerCount: flightStats?.passengerCount || 0,
        }
      })

      console.log(statsResponse.data.flightStats)
      console.log(flightsWithBookings)

      setFlights(flightsWithBookings)
      setOverallStats({
        activeFlights: flightsResponse.data.length,
        overallBookingCount: statsResponse.data.overallBookingCount,
        overallRevenue: statsResponse.data.overallRevenue,
        overallPassengerCount: statsResponse.data.overallPassengerCount
      })


    } catch (error) {
      console.error('Error fetching flights with bookings:', error)
      // Fallback to flights without booking data
      try {
        const flightsResponse = await apiClient.get<Flight[]>('/flights', {
          params: { airlineCode: user.airline.code }
        })

        setFlights(flightsResponse.data.map(f => ({ ...f, bookings: [], bookingsFetched: false })))
      } catch (fallbackError) {
        console.error('Error fetching flights:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.airline?.code, setOverallStats])

  useEffect(() => {
    fetchFlightsWithBookings()
  }, [fetchFlightsWithBookings])

  const toggleFlightExpansion = async (flightId: number) => {
    const newExpanded = new Set(expandedFlights)
    const isCurrentlyExpanded = newExpanded.has(flightId)

    if (isCurrentlyExpanded) {
      newExpanded.delete(flightId)
    } else {
      newExpanded.add(flightId)
      const flight = flights.find((f) => f.id === flightId)
      if (flight && !flight.bookingsFetched) {
        setLoadingBookings((prev) => new Set(prev).add(flightId))
        try {
          const response = await apiClient.get<Booking[]>(`/bookings`, {
            params: { flightId },
          })

          const bookings: BookingInfo[] = response.data.map(b => {
            const mainPassenger = b.passengers?.[0] || {}
            const totalPrice = b.passengers?.reduce((sum: number, p: Passenger) => sum + p.priceAtBooking, 0)

            return {
              id: b.id,
              passengerName: `${mainPassenger.firstName || ''} ${mainPassenger.lastName || ''}`.trim(),
              passengerEmail: mainPassenger.email || '',
              numberOfSeats: b.passengers?.length || 0,
              bookingDate: b.bookingDate,
              status: 'CONFIRMED',
              flightClass: mainPassenger.flightClass,
              totalPrice: totalPrice,
            }
          })

          setFlights((prevFlights) =>
            prevFlights.map((f) =>
              f.id === flightId
                ? { ...f, bookings: bookings, bookingsFetched: true }
                : f
            )
          )
        } catch (error) {
          console.error(`Error fetching bookings for flight ${flightId}:`, error)
        } finally {
          setLoadingBookings((prev) => {
            const newLoading = new Set(prev)
            newLoading.delete(flightId)
            return newLoading
          })
        }
      }
    }
    setExpandedFlights(newExpanded)
  }

  const filteredFlights = flights.filter(flight =>
    flight.originAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.originAirport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.city.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  })

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Flight Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Flight Bookings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>

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
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono h-10">
                            {flight.airline.code}-{flight.id.toString().padStart(4, '0')}
                          </Badge>
                          <div className="w-px h-6 bg-gray-300 mx-2" />

                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2 w-30">
                                <div className="flex flex-col items-center">
                                  <Badge variant="secondary" className="font-mono">
                                    {flight.originAirport.code}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{flight.originAirport.city}</span>
                                </div>
                                <span>→</span>
                                <div className="flex flex-col items-center">
                                  <Badge variant="secondary" className="font-mono">
                                    {flight.destinationAirport.code}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{flight.destinationAirport.city}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-gray-600 w-45">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(flight.departureTime)}
                              </div>

                              <div className="flex items-center gap-1 text-sm font-medium w-20">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(flight.minPrice)}
                              </div>

                              <div className="text-sm text-gray-600">
                                {flight.emptySeats} seats available
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {flight.bookingCount || 0} booking{flight.bookingCount && flight.bookingCount > 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="outline" className="text-green-600">
                                {formatCurrency(flight.revenue || 0)}
                              </Badge>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>

                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Booking Details</h4>
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-600">
                                Total Bookings: <span className="font-medium">{flight.bookingCount}</span>
                              </span>
                              <span className="text-gray-600">
                                Booked Seats: <span className="font-medium">{flight.passengerCount}</span>
                              </span>
                              <span className="text-gray-600">
                                Revenue: <span className="font-medium">{formatCurrency(flight.revenue || 0)}</span>
                              </span>
                            </div>
                          </div>

                          {loadingBookings.has(flight.id) ? (
                            <div className="text-center py-4 text-gray-500">
                              Loading bookings...
                            </div>
                          ) : flight.bookings && flight.bookings.length > 0 ? (
                            <div className="space-y-3">
                              {flight.bookings.map((booking) => (
                                <div key={booking.id} className="bg-white p-3 rounded border">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <p className="font-medium">{booking.passengerName}</p>
                                        <p className="text-sm text-gray-600">{booking.passengerEmail}</p>
                                      </div>
                                      <Badge variant="outline">
                                        {booking.numberOfSeats} seat{booking.numberOfSeats > 1 ? 's' : ''}
                                      </Badge>
                                      {booking.flightClass && (
                                        <Badge variant="secondary">
                                          {booking.flightClass}
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}
                                        className={booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                                      >
                                        {booking.status}
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      {booking.totalPrice && (
                                        <p className="font-medium">{formatCurrency(booking.totalPrice)}</p>
                                      )}
                                      <p className="text-sm text-gray-600">
                                        {formatDateTime(booking.bookingDate)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No bookings for this flight yet
                            </div>
                          )}
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
    </div>
  )
} 