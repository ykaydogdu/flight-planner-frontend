import type { Booking } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plane, Calendar, Clock, User, Hash, AlertTriangle, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useBookingStore } from '@/store/bookings'
import { useState } from 'react'
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
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0)

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
  const passengers = booking.passengers || []
  const showPagination = passengers.length > 2
  const currentPassenger = passengers[currentPassengerIndex]

  const nextPassenger = () => {
    setCurrentPassengerIndex((prev) => (prev + 1) % passengers.length)
  }

  const prevPassenger = () => {
    setCurrentPassengerIndex((prev) => (prev - 1 + passengers.length) % passengers.length)
  }

  return (
    <Card className={`transition-all ${isCancelled ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {booking.originAirport.city} → {booking.destinationAirport.city}
            </p>
            <CardTitle className="text-2xl font-bold">
              {booking.airline.name}
            </CardTitle>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <Badge variant={isCancelled ? 'destructive' : 'default'}>
              {booking.status}
            </Badge>
            <p className="text-sm text-gray-600 flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              {booking.id}
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
                <p className="font-semibold">{`${booking.originAirport.code} → ${booking.destinationAirport.code}`}</p>
                <p className="text-sm text-gray-500">{`${booking.originAirport.name} to ${booking.destinationAirport.name}`}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{format(new Date(booking.departureTime), 'EEE, MMM d, yyyy')}</p>
                <p className="text-sm text-gray-500">Departure Date</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-semibold">{format(new Date(booking.departureTime), 'h:mm a')}</p>
                <p className="text-sm text-gray-500">Departure Time</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                {passengers.length > 0 ? (
                  <div>
                    {showPagination ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">Passenger {currentPassengerIndex + 1} of {passengers.length}</p>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={prevPassenger}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={nextPassenger}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{currentPassenger.firstName} {currentPassenger.lastName} ({currentPassenger.flightClass})</p>
                          <p className="text-sm text-gray-500">{currentPassenger.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {passengers.map((passenger, index) => (
                          <div key={index} className="border-l-2 border-blue-200 pl-3">
                            <p className="font-medium">{passenger.firstName} {passenger.lastName} ({passenger.flightClass})</p>
                            <p className="text-sm text-gray-500">{passenger.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No passenger information available</p>
                )}
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
                    This action cannot be undone. This will permanently cancel your booking for flight with {booking.airline.name} from {booking.originAirport.name} to {booking.destinationAirport.name}.
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