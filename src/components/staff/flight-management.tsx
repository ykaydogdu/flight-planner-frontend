import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapLocationPicker } from '@/components/ui/map-location-picker'
import { apiClient } from '@/lib/api'
import { useAirportStore } from '@/store/airports'
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
import type { Flight, Airport } from '@/types'
import { Plane, Clock, DollarSign, Users, Edit, Trash, Plus, MapPin } from 'lucide-react'
import { useFlightStore } from '@/store/flights'

const flightSchema = z.object({
  departureTime: z.string().min(1, 'Departure time is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  seatCount: z.number().min(1, 'Seat count must be at least 1'),
  originAirportCode: z.string().min(3, 'Origin airport is required'),
  destinationAirportCode: z.string().min(3, 'Destination airport is required')
})

type FlightFormData = z.infer<typeof flightSchema>

interface FlightWithAirports extends Flight {
  emptySeats: number
}

export function FlightManagement() {
  const { user } = useAuthStore()
  const { airports, fetchAirports } = useAirportStore()
  const { flights, searchFlights } = useFlightStore()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FlightWithAirports | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showOriginMap, setShowOriginMap] = useState(false)
  const [showDestinationMap, setShowDestinationMap] = useState(false)
  const [selectedOriginAirport, setSelectedOriginAirport] = useState<Airport | null>(null)
  const [selectedDestinationAirport, setSelectedDestinationAirport] = useState<Airport | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<FlightFormData>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      departureTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      price: 100,
      seatCount: 150
    }
  })

  useEffect(() => {
    setLoading(true)
    searchFlights({
      airlineCode: user?.airline?.code || '',
      originAirportCode: '',
      destinationAirportCode: '',
      departureDate: '' 
    }).finally(() => {
      setLoading(false)
    })
    fetchAirports()
  }, [fetchAirports, searchFlights, user?.airline?.code])

  const onSubmit = async (data: FlightFormData) => {
    if (!user?.airline?.code) return

    try {
      setCreating(true)
      const flightData = {
        ...data,
        airlineCode: user.airline.code
      }

      if (editing) {
        await apiClient.put(`/flights/${editing.id}`, flightData)
      } else {
        await apiClient.post('/flights', flightData)
      }

      await searchFlights({
        airlineCode: user.airline.code,
        originAirportCode: data.originAirportCode,
        destinationAirportCode: data.destinationAirportCode,
        departureDate: data.departureTime
      })
      setShowCreateForm(false)
      setEditing(null)
      reset()
      setSelectedOriginAirport(null)
      setSelectedDestinationAirport(null)
    } catch (error) {
      console.error('Error saving flight:', error)
      alert('Failed to save flight. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (flight: FlightWithAirports) => {
    setEditing(flight)
    setShowCreateForm(true)
    const departureTime = new Date(flight.departureTime).toISOString().slice(0, 16)
    reset({
      departureTime,
      price: flight.price,
      seatCount: flight.seatCount,
      originAirportCode: flight.originAirport.code,
      destinationAirportCode: flight.destinationAirport.code
    })
    setSelectedOriginAirport(flight.originAirport)
    setSelectedDestinationAirport(flight.destinationAirport)
  }

  const handleDelete = async (flightId: number) => {
    try {
      await apiClient.delete(`/flights/${flightId}`)
      await searchFlights({
        airlineCode: user?.airline?.code || '',
        originAirportCode: '',
        destinationAirportCode: '',
        departureDate: ''
      })
    } catch (error) {
      console.error('Error deleting flight:', error)
      alert('Failed to delete flight. Please try again.')
    }
  }

  const handleOriginLocationSelect = (latitude: number, longitude: number) => {
    // Find the nearest airport
    const nearestAirport = airports.reduce((nearest, airport) => {
      const distance = Math.sqrt(
        Math.pow(airport.latitude - latitude, 2) + Math.pow(airport.longitude - longitude, 2)
      )
      return distance < nearest.distance ? { airport, distance } : nearest
    }, { airport: airports[0], distance: Infinity })

    if (nearestAirport.airport) {
      setSelectedOriginAirport(nearestAirport.airport)
      setValue('originAirportCode', nearestAirport.airport.code)
    }
    setShowOriginMap(false)
  }

  const handleDestinationLocationSelect = (latitude: number, longitude: number) => {
    // Find the nearest airport
    const nearestAirport = airports.reduce((nearest, airport) => {
      const distance = Math.sqrt(
        Math.pow(airport.latitude - latitude, 2) + Math.pow(airport.longitude - longitude, 2)
      )
      return distance < nearest.distance ? { airport, distance } : nearest
    }, { airport: airports[0], distance: Infinity })

    if (nearestAirport.airport) {
      setSelectedDestinationAirport(nearestAirport.airport)
      setValue('destinationAirportCode', nearestAirport.airport.code)
    }
    setShowDestinationMap(false)
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const isFlightInPast = (departureTime: string) => {
    return new Date(departureTime) < new Date()
  }

  const currentFlights = flights.filter(flight => !isFlightInPast(flight.departureTime))
  const pastFlights = flights.filter(flight => isFlightInPast(flight.departureTime))

  const cancelForm = () => {
    setShowCreateForm(false)
    setEditing(null)
    setSelectedOriginAirport(null)
    setSelectedDestinationAirport(null)
    setShowOriginMap(false)
    setShowDestinationMap(false)
    reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            ✈️ Flight Management
          </span>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule New Flight
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Create/Edit Flight Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3">
              {editing ? 'Edit Flight' : 'Schedule New Flight'}
            </h3>
            
            {(showOriginMap || showDestinationMap) ? (
              <div className="space-y-4">
                <h4 className="font-medium">
                  Select {showOriginMap ? 'Origin' : 'Destination'} Airport Location
                </h4>
                <MapLocationPicker
                  onLocationSelect={showOriginMap ? handleOriginLocationSelect : handleDestinationLocationSelect}
                  onCancel={() => {
                    setShowOriginMap(false)
                    setShowDestinationMap(false)
                  }}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Airport */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Origin Airport
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowOriginMap(true)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Select on Map
                      </Button>
                      {selectedOriginAirport && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-md">
                          <span className="text-sm font-medium">{selectedOriginAirport.code}</span>
                          <span className="text-sm text-gray-600">
                            {selectedOriginAirport.name}, {selectedOriginAirport.city}
                          </span>
                        </div>
                      )}
                    </div>
                    <input type="hidden" {...register('originAirportCode')} />
                    {errors.originAirportCode && (
                      <p className="text-sm text-red-500">{errors.originAirportCode.message}</p>
                    )}
                  </div>

                  {/* Destination Airport */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Destination Airport
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDestinationMap(true)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Select on Map
                      </Button>
                      {selectedDestinationAirport && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-md">
                          <span className="text-sm font-medium">{selectedDestinationAirport.code}</span>
                          <span className="text-sm text-gray-600">
                            {selectedDestinationAirport.name}, {selectedDestinationAirport.city}
                          </span>
                        </div>
                      )}
                    </div>
                    <input type="hidden" {...register('destinationAirportCode')} />
                    {errors.destinationAirportCode && (
                      <p className="text-sm text-red-500">{errors.destinationAirportCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Departure Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Departure Time
                    </label>
                    <Input
                      type="datetime-local"
                      {...register('departureTime')}
                      className={errors.departureTime ? 'border-red-500' : ''}
                    />
                    {errors.departureTime && (
                      <p className="text-sm text-red-500">{errors.departureTime.message}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Price ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', { valueAsNumber: true })}
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price.message}</p>
                    )}
                  </div>

                  {/* Seat Count */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Total Seats
                    </label>
                    <Input
                      type="number"
                      min="1"
                      {...register('seatCount', { valueAsNumber: true })}
                      className={errors.seatCount ? 'border-red-500' : ''}
                    />
                    {errors.seatCount && (
                      <p className="text-sm text-red-500">{errors.seatCount.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creating || !selectedOriginAirport || !selectedDestinationAirport}
                  >
                    {creating ? 'Saving...' : editing ? 'Update Flight' : 'Schedule Flight'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Flight Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('current')}
              className="flex-1"
            >
              Current & Future Flights ({currentFlights.length})
            </Button>
            <Button
              variant={activeTab === 'past' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('past')}
              className="flex-1"
            >
              Past Flights ({pastFlights.length})
            </Button>
          </div>
        </div>

        {/* Flights List */}
        <div className="space-y-3">
          <h3 className="font-semibold">
            {activeTab === 'current' ? 'Current & Future Flights' : 'Past Flights'} 
            ({activeTab === 'current' ? currentFlights.length : pastFlights.length})
          </h3>

          {loading ? (
            <div className="text-center py-8">Loading flights...</div>
          ) : (activeTab === 'current' ? currentFlights.length === 0 : pastFlights.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'current' ? 'No current or future flights scheduled' : 'No past flights found'}
            </div>
          ) : (
            <div className="grid gap-3">
              {(activeTab === 'current' ? currentFlights : pastFlights).map((flight) => {
                const isPastFlight = isFlightInPast(flight.departureTime)
                                 return (
                  <div key={flight.id} className={`flex items-center justify-between p-4 border rounded-lg ${isPastFlight ? 'bg-gray-50 opacity-75' : ''}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plane className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {flight.originAirport.code}
                          </Badge>
                          <span>→</span>
                          <Badge variant="secondary" className="font-mono">
                            {flight.destinationAirport.code}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(flight.departureTime)}
                        </div>
                        <div className="text-sm font-medium">
                          ${flight.price}
                        </div>
                        <div className="text-sm text-gray-600">
                          {flight.emptySeats} seats available
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {flight.originAirport.city} → {flight.destinationAirport.city}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPastFlight ? (
                      <Badge variant="secondary" className="text-gray-500">
                        Flight Completed
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(flight)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Flight</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this flight? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(flight.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
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