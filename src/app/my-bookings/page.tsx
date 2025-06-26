import { useEffect } from 'react'
import { useBookingStore } from '@/store/bookings'
import { BookingCard } from '@/components/booking/booking-card'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const { bookings, loading, fetchBookings } = useBookingStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      fetchBookings()
    }
  }, [isAuthenticated, fetchBookings, navigate])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            My Bookings
          </h1>
          <Ticket className="h-10 w-10 text-blue-600" />
        </div>

        {bookings.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No bookings found</h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t booked any flights yet. When you do, they will appear here.
              </p>
              <Button onClick={() => navigate('/')}>
                Search Flights
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 