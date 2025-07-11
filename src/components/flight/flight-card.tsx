import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Flight } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plane,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react'
import React from 'react'

interface FlightCardProps {
  flight: Flight
  economyPassengers: number
  businessPassengers: number
  firstClassPassengers: number
}

export const FlightCard = React.memo(function FlightCard({ flight, economyPassengers, businessPassengers, firstClassPassengers }: FlightCardProps) {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' })
    })
  }

  const calculateDuration = () => {
    const hours = Math.floor(flight.duration / 60)
    const minutes = Math.floor(flight.duration % 60)

    return `${hours}h ${minutes}m`
  }

  const getAvailabilityColor = () => {
    if (flight.emptySeats > 20) return 'text-green-600'
    if (flight.emptySeats > 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAvailabilityBadge = () => {
    if (flight.emptySeats > 20) return 'bg-green-100 text-green-800'
    if (flight.emptySeats > 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const passengers = economyPassengers + businessPassengers + firstClassPassengers
  const economyPrice = flight.classes.find(c => c.flightClass === 'ECONOMY')?.price || 0
  const businessPrice = flight.classes.find(c => c.flightClass === 'BUSINESS')?.price || 0
  const firstClassPrice = flight.classes.find(c => c.flightClass === 'FIRST_CLASS')?.price || 0
  const totalPrice = flight.classes.reduce((acc, curr) => {
    if (curr.flightClass === 'ECONOMY') {
      return acc + curr.price * economyPassengers
    }
    if (curr.flightClass === 'BUSINESS') {
      return acc + curr.price * businessPassengers
    }
    if (curr.flightClass === 'FIRST_CLASS') {
      return acc + curr.price * firstClassPassengers
    }
    return acc
  }, 0)

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/booking/${flight.id}?passengerEconomy=${economyPassengers}&passengerBusiness=${businessPassengers}&passengerFirstClass=${firstClassPassengers}`)
  }

  return (
    <Card
      data-testid="flight-card"
      className="overflow-hidden hover:shadow-lg dark:shadow-accent transition-shadow duration-200 border border-app bg-card"
      onClick={() => setShowDetails(!showDetails)}
    >
      <CardContent className="p-0">
        {/* Main Flight Info */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Airline and Route */}
            <div className="flex items-center space-x-4 flex-1">
              {/* Airline Logo Placeholder */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-secondary-foreground truncate">
                  {flight.airline.name}
                </h3>
                <p className="text-sm text-secondary-foreground">
                  {flight.airline.code}
                </p>
              </div>
            </div>

            {/* Flight Times and Route */}
            <div className="flex-1 lg:flex-2">
              <div className="flex items-center justify-between lg:justify-center lg:space-x-8">
                {/* Departure */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-foreground">
                    {formatTime(flight.departureTime)}
                  </div>
                  <div className="text-sm text-secondary-foreground">
                    {formatDate(flight.departureTime)}
                  </div>
                  <div className="text-sm font-medium text-secondary-foreground mt-1">
                    {flight.originAirport.code}
                  </div>
                  <div className="text-xs text-secondary-foreground truncate">
                    {flight.originAirport.city}, {flight.originAirport.country}
                  </div>
                </div>

                {/* Flight Duration */}
                <div className="flex flex-col items-center px-4">
                  <div className="text-xs text-secondary-foreground mb-1">
                    {calculateDuration()}
                  </div>
                  <div className="flex items-center">
                    <div className="h-0.5 w-8 bg-gray-300"></div>
                    <Plane className="h-4 w-4 text-gray-400 mx-1" />
                    <div className="h-0.5 w-8 bg-gray-300"></div>
                  </div>
                  <div className="text-xs text-secondary-foreground mt-1">
                    Non-stop
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {formatTime(flight.arrivalTime || flight.departureTime)}
                  </div>
                  <div className="text-sm text-secondary-foreground">
                    {formatDate(flight.arrivalTime || flight.departureTime)}
                  </div>
                  <div className="text-sm font-medium text-secondary-foreground mt-1">
                    {flight.destinationAirport.code}
                  </div>
                  <div className="text-xs text-secondary-foreground truncate">
                    {flight.destinationAirport.city}, {flight.destinationAirport.country}
                  </div>
                </div>
              </div>
            </div>

            {/* Price and Booking */}
            <div className="flex flex-col items-end space-y-3 lg:min-w-48">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${totalPrice.toLocaleString()}
                </div>
                <div className="text-sm text-secondary-foreground">
                  ${totalPrice / passengers} per person
                </div>
                {passengers > 1 && (
                  <div className="text-xs text-gray-500">
                    {passengers} passengers
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className={`text-xs px-2 py-1 rounded-full ${getAvailabilityBadge()}`}>
                  {flight.emptySeats} seats left
                </div>

                <Button
                  onClick={handleBooking}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  disabled={flight.emptySeats < passengers}
                >
                  {flight.emptySeats < passengers ? 'Not Available' : 'Select Flight'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="border-t border-app bg-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Flight Details */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <Plane className="h-4 w-4 mr-2" />
                  Flight Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Flight Number:</span>
                    <span className="text-foreground">{flight.airline.code}-{flight.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Aircraft:</span>
                    <span className="text-foreground">Boeing 737</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Duration:</span>
                    <span className="text-foreground">{calculateDuration()}</span>
                  </div>
                </div>
              </div>

              {/* Departure Info */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Departure
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {flight.originAirport.name}
                    </div>
                    <div className="text-secondary-foreground">
                      {flight.originAirport.city}, {flight.originAirport.country}
                    </div>
                  </div>
                  <div className="flex items-center text-secondary-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(flight.departureTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-secondary-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(flight.departureTime)}
                  </div>
                </div>
              </div>

              {/* Arrival Info */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Arrival
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {flight.destinationAirport.name}
                    </div>
                    <div className="text-secondary-foreground">
                      {flight.destinationAirport.city}, {flight.destinationAirport.country}
                    </div>
                  </div>
                  <div className="flex items-center text-secondary-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(flight.arrivalTime || flight.departureTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-secondary-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(flight.arrivalTime || flight.departureTime)}
                  </div>
                </div>
              </div>

              {/* Pricing & Availability */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pricing
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Economy Class x {economyPassengers}:</span>
                    <span className="text-foreground">${economyPrice * economyPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Business Class x {businessPassengers}:</span>
                    <span className="text-foreground">${businessPrice * businessPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">First Class x {firstClassPassengers}:</span>
                    <span className="text-foreground">${firstClassPrice * firstClassPassengers}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-foreground">Total:</span>
                    <span className="font-bold text-primary">${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center mt-3">
                    <Users className="h-3 w-3 mr-1 text-gray-500" />
                    <span className={`text-sm ${getAvailabilityColor()}`}>
                      {flight.emptySeats} seats available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities or Additional Info */}
            <div className="mt-6 pt-4 border-t border-app">
              <h4 className="font-semibold text-foreground mb-2">Included</h4>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Carry-on bag</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Seat selection</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Refreshments</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">WiFi available</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})