import type { Booking } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plane, Calendar, Clock, User, Hash, AlertTriangle, Download, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { useBookingStore } from '@/store/bookings'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface BookingCardProps {
  booking: Booking
}

export function BookingCard({ booking }: BookingCardProps) {
  const { cancelBooking } = useBookingStore()

  const handleCancel = async () => {
    try {
      await cancelBooking(booking.id)
      // Optionally show a success toast
    } catch (error) {
      console.error('Error cancelling booking:', error)
      // Optionally show an error toast
    }
  }

  const isCancelled = booking.status === 'CANCELLED'

  return (
    <Card className={`transition-all ${isCancelled ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {booking.flight.originAirport.city} → {booking.flight.destinationAirport.city}
            </p>
            <CardTitle className="text-2xl font-bold">
              {booking.flight.airline.name}
            </CardTitle>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <Badge variant={isCancelled ? 'destructive' : 'default'}>
              {booking.status}
            </Badge>
            <p className="text-sm text-gray-600 flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              {booking.bookingReference}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center">
              <Plane className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{`${booking.flight.originAirport.code} → ${booking.flight.destinationAirport.code}`}</p>
                <p className="text-sm text-gray-500">{`${booking.flight.originAirport.name} to ${booking.flight.destinationAirport.name}`}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{format(new Date(booking.flight.departureTime), 'EEE, MMM d, yyyy')}</p>
                <p className="text-sm text-gray-500">Departure Date</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{format(new Date(booking.flight.departureTime), 'h:mm a')}</p>
                <p className="text-sm text-gray-500">Departure Time</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{booking.passengerName}</p>
                <p className="text-sm text-gray-500">{booking.passengerEmail}</p>
              </div>
            </div>
             <div className="flex items-center">
                <p className="text-sm text-gray-500">Booked on {format(new Date(booking.bookingDate), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          {!isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Are you sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently cancel your booking for flight {booking.flight.airline.name} from {booking.flight.originAirport.code} to {booking.flight.destinationAirport.code}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Back</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    Yes, Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 