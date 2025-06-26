import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  Users, 
  User, 
  CreditCard,
  ArrowLeft,
  Check
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/auth'
import { useBookingStore } from '@/store/bookings'
import { useFlightStore } from '@/store/flights'
import type { Flight } from '@/types'

export default function BookingPage() {
  const { flightId } = useParams<{ flightId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { createBooking } = useBookingStore()
  const { fetchFlightById } = useFlightStore()

  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passengers = parseInt(searchParams.get('passengers') || '1')
  
  const [formData, setFormData] = useState({
    passengerName: user?.firstName + ' ' + user?.lastName || '',
    passengerEmail: user?.email || '',
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])

  // Fetch flight details
  useEffect(() => {
    const fetchFlight = async () => {
      if (!flightId) return
      
      try {
        setLoading(true)
        const flightData = await fetchFlightById(parseInt(flightId))
        setFlight(flightData)
      } catch (err) {
        setError('Failed to load flight details')
        console.error('Error fetching flight:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFlight()
  }, [flightId, fetchFlightById])

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateTime: string) => {
    return format(new Date(dateTime), 'EEE, MMM d, yyyy')
  }

  const calculateDuration = () => {
    if (!flight) return ''
    const hours = Math.floor(flight.duration / 60)
    const minutes = Math.floor(flight.duration % 60)
    return `${hours}h ${minutes}m`
  }

  const totalPrice = flight ? flight.price * passengers : 0

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBooking = async () => {
    if (!flight || !user) return

    // Basic validation
    if (!formData.passengerName.trim() || !formData.passengerEmail.trim()) {
      setError('Please fill in all required fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.passengerEmail)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setBooking(true)
      setError(null)

      const bookingRequest = {
        flightId: flight.id,
        username: user.username,
        numberOfSeats: passengers
      }

      await createBooking(bookingRequest)
      setBookingSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create booking. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6 w-1/3"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !flight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={() => navigate('/flights')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Flights
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
              <p className="text-gray-600">Your flight has been successfully booked.</p>
              <div className="space-y-2 mt-4">
                <Button onClick={() => navigate('/my-bookings')} className="w-full">
                  View My Bookings
                </Button>
                <Button 
                  onClick={() => navigate('/flights')} 
                  variant="outline" 
                  className="w-full"
                >
                  Book Another Flight
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!flight) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            onClick={() => navigate('/flights')} 
            variant="ghost" 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Flights
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Review & Confirm Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="h-5 w-5 mr-2" />
                  Flight Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Airline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plane className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{flight.airline.name}</p>
                      <p className="text-sm text-gray-600">{flight.airline.code}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Flight {flight.airline.code}-{flight.id}</Badge>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(flight.departureTime)}</div>
                    <div className="text-sm text-gray-600">{formatDate(flight.departureTime)}</div>
                    <div className="font-medium mt-1">{flight.originAirport.code}</div>
                    <div className="text-sm text-gray-500">{flight.originAirport.city}</div>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <div className="text-sm text-gray-500 mb-1">{calculateDuration()}</div>
                    <div className="flex items-center">
                      <div className="h-0.5 w-12 bg-gray-300"></div>
                      <Plane className="h-4 w-4 text-gray-400 mx-1" />
                      <div className="h-0.5 w-12 bg-gray-300"></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Non-stop</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(flight.arrivalTime || flight.departureTime)}</div>
                    <div className="text-sm text-gray-600">{formatDate(flight.arrivalTime || flight.departureTime)}</div>
                    <div className="font-medium mt-1">{flight.destinationAirport.code}</div>
                    <div className="text-sm text-gray-500">{flight.destinationAirport.city}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Passenger Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      name="passengerName"
                      value={formData.passengerName}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      name="passengerEmail"
                      value={formData.passengerEmail}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{passengers} passenger{passengers > 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight</span>
                    <span className="font-medium">{flight.airline.code}-{flight.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route</span>
                    <span className="font-medium">{flight.originAirport.code} → {flight.destinationAirport.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{formatDate(flight.departureTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passengers</span>
                    <span className="font-medium">{passengers}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per ticket</span>
                    <span className="font-medium">${flight.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleBooking}
                  disabled={booking || flight.emptySeats < passengers}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {booking ? 'Processing...' : `Confirm Booking - $${totalPrice.toLocaleString()}`}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By confirming this booking, you agree to our terms and conditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 