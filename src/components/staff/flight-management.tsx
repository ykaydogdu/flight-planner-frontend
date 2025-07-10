import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AirportPicker } from '@/components/ui/airport-picker'
import { useAirportStore } from '@/store/airports'
import { useFlightStore, type BookingInfo, type FlightFormData } from '@/store/flights'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Flight, Passenger, Airport } from '@/types'
import {
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Trash,
  Plus,
  MapPin,
} from 'lucide-react'

interface FlightWithBookings extends Flight {
  bookings?: BookingInfo[]
  bookingsFetched?: boolean
  bookingCount?: number
  passengerCount?: number
  revenue?: number
  emptySeats: number
}

export interface OverallStats {
  activeFlights: number
  overallBookingCount: number
  overallPassengerCount: number
  overallRevenue: number
}

const flightClassSchema = z.object({
  flightClass: z.enum(['ECONOMY', 'BUSINESS', 'FIRST_CLASS']),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  seatCount: z.number().min(1, 'Seat count must be at least 1'),
});

const flightSchema = z.object({
  departureTime: z.string().min(1, 'Departure time is required'),
  originAirportCode: z.string().min(3, 'Origin airport is required'),
  destinationAirportCode: z.string().min(3, 'Destination airport is required'),
  flightClasses: z.array(flightClassSchema).min(1, 'At least one flight class is required.'),
});

export function FlightManagement({ setOverallStats }: { setOverallStats: (stats: OverallStats) => void }) {
  const { user } = useAuthStore()
  const { airports, fetchAirports } = useAirportStore()
  const { 
    staffFlights, 
    fetchFlightsForStaff, 
    fetchFlightStats, 
    createFlight, 
    updateFlight, 
    deleteFlight, 
    fetchBookingsForFlight 
  } = useFlightStore()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FlightWithBookings | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showOriginMap, setShowOriginMap] = useState(false)
  const [showDestinationMap, setShowDestinationMap] = useState(false)
  const [selectedOriginAirport, setSelectedOriginAirport] = useState<Airport | null>(null)
  const [selectedDestinationAirport, setSelectedDestinationAirport] = useState<Airport | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current')
  const [expandedFlights, setExpandedFlights] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingBookings, setLoadingBookings] = useState<Set<number>>(new Set())
  const [flightsWithBookings, setFlightsWithBookings] = useState<FlightWithBookings[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
    watch
  } = useForm<FlightFormData>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      departureTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      flightClasses: [],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'flightClasses',
  })

  const watchedClasses = watch('flightClasses')

  useEffect(() => {
    fetchAirports()
  }, [fetchAirports])

  // 1) Get flights once
  useEffect(() => {
    if (user?.airline?.code) {
      fetchFlightsForStaff(user.airline.code)
    }
  }, [fetchFlightsForStaff, user?.airline?.code])

  // 2) Whenever flights list updates, fetch & merge stats
  useEffect(() => {
    if (!user?.airline?.code || staffFlights.length === 0) return
    async function loadStats() {
      setLoading(true)
      const data = await fetchFlightStats(user?.airline?.code || '')
      
      // Merge flight data with booking stats while preserving any previously fetched booking details
      setFlightsWithBookings((prevFlights) => {
        const merged = staffFlights.map((flight) => {
          const prev = prevFlights.find((f) => f.id === flight.id)
          const flightStats = data.flightStats.find((stat) => stat.flightId === flight.id)

          return {
            ...flight,
            // Preserve already-fetched bookings so we don't request them again on re-expansion
            bookings: prev?.bookings || [],
            bookingsFetched: prev?.bookingsFetched || false,
            bookingCount: flightStats?.bookingCount || 0,
            revenue: flightStats?.revenue || 0,
            passengerCount: flightStats?.passengerCount || 0,
          }
        })

        // Update overall stats before returning
        setOverallStats({
          activeFlights: merged.length,
          overallBookingCount: data.overallBookingCount,
          overallRevenue: data.overallRevenue,
          overallPassengerCount: data.overallPassengerCount,
        })

        return merged
      })
    }
    loadStats().finally(() => {
      setLoading(false)
    })
  }, [staffFlights, user?.airline?.code, setOverallStats, fetchFlightStats])

  const onSubmit = async (data: FlightFormData) => {
    if (!user?.airline?.code) return

    try {
      setCreating(true)
      const flightData = {
        ...data,
        airlineCode: user.airline.code
      }

      if (editing) {
        await updateFlight(editing.id, flightData)
      } else {
        await createFlight(flightData)
      }

      await fetchFlightsForStaff(user.airline.code)
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

  const handleEdit = (flight: FlightWithBookings) => {
    setEditing(flight)
    setShowCreateForm(true)
    const departureTime = new Date(flight.departureTime).toISOString().slice(0, 16)
    reset({
      departureTime,
      originAirportCode: flight.originAirport.code,
      destinationAirportCode: flight.destinationAirport.code,
      flightClasses: flight.classes.map(c => ({
        flightClass: c.flightClass,
        price: c.price,
        seatCount: c.seatCount
      }))
    })
    setSelectedOriginAirport(flight.originAirport)
    setSelectedDestinationAirport(flight.destinationAirport)
  }

  const handleDelete = async (flightId: number) => {
    try {
      await deleteFlight(flightId)
      await fetchFlightsForStaff(user?.airline?.code || '')
    } catch (error) {
      console.error('Error deleting flight:', error)
      alert('Failed to delete flight. Please try again.')
    }
  }

  const handleAirportSelect = (airport: Airport) => {
    if (showOriginMap) {
      if (selectedDestinationAirport?.code === airport.code) {
        alert("Origin and destination airport cannot be the same.");
        return;
      }
      setSelectedOriginAirport(airport);
      setValue('originAirportCode', airport.code);
      setShowOriginMap(false);
    } else if (showDestinationMap) {
      if (selectedOriginAirport?.code === airport.code) {
        alert("Origin and destination airport cannot be the same.");
        return;
      }
      setSelectedDestinationAirport(airport);
      setValue('destinationAirportCode', airport.code);
      setShowDestinationMap(false);
    }
  }

  const toggleFlightExpansion = async (flightId: number) => {
    const newExpanded = new Set(expandedFlights)
    const isCurrentlyExpanded = newExpanded.has(flightId)

    if (isCurrentlyExpanded) {
      newExpanded.delete(flightId)
    } else {
      newExpanded.add(flightId)
      const flight = flightsWithBookings.find((f) => f.id === flightId)
      if (flight && !flight.bookingsFetched) {
        setLoadingBookings((prev) => new Set(prev).add(flightId))
        try {
          const bookingsData = await fetchBookingsForFlight(flightId)

          const bookings: BookingInfo[] = bookingsData.map(b => {
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

          setFlightsWithBookings((prevFlights) =>
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

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const isFlightInPast = (departureTime: string) => {
    return new Date(departureTime) < new Date()
  }

  const filteredFlights = flightsWithBookings.filter(flight =>
    flight.originAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.originAirport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.destinationAirport.city.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  })

  const currentFlights = filteredFlights.filter(flight => !isFlightInPast(flight.departureTime))
  const pastFlights = filteredFlights.filter(flight => isFlightInPast(flight.departureTime))

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              ✈️ Flight Management & Bookings
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
                  <AirportPicker
                    airports={airports}
                    onSelect={handleAirportSelect}
                    onCancel={() => {
                      setShowOriginMap(false)
                      setShowDestinationMap(false)
                    }}
                    selectedOrigin={selectedOriginAirport}
                    selectedDestination={selectedDestinationAirport}
                  />
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Origin Airport */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-secondary-foreground flex items-center">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {/* Flight Classes */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium flex items-center justify-between">
                      Flight Classes
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ flightClass: 'ECONOMY', price: 100, seatCount: 100 })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Class
                      </Button>
                    </h4>
                    {fields.map((field, index) => {
                      const availableClasses = ['ECONOMY', 'BUSINESS', 'FIRST_CLASS'].filter(
                        (c) =>
                          !watchedClasses.some(
                            (wc, wcIndex) => wc.flightClass === c && wcIndex !== index
                          )
                      )
                      return (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md">
                          <div className="col-span-4 space-y-1">
                            <label className="text-xs font-medium text-gray-600">Class</label>
                            <Select
                              defaultValue={field.flightClass}
                              onValueChange={(value) => setValue(`flightClasses.${index}.flightClass`, value as 'ECONOMY' | 'BUSINESS' | 'FIRST_CLASS')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableClasses.map(c => (
                                  <SelectItem key={c} value={c}>
                                    {c.charAt(0) + c.slice(1).toLowerCase().replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-xs font-medium text-gray-600">Price ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`flightClasses.${index}.price`, { valueAsNumber: true })}
                              className={errors.flightClasses?.[index]?.price ? 'border-red-500' : ''}
                              placeholder="Price"
                            />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-xs font-medium text-gray-600">Seats</label>
                            <Input
                              type="number"
                              min="1"
                              {...register(`flightClasses.${index}.seatCount`, { valueAsNumber: true })}
                              className={errors.flightClasses?.[index]?.seatCount ? 'border-red-500' : ''}
                              placeholder="Seats"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end items-end h-full">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {errors.flightClasses && !errors.flightClasses.root && (
                      <p className="text-sm text-red-500">{errors.flightClasses.message}</p>
                    )}
                    {errors.flightClasses?.root && (
                      <p className="text-sm text-red-500">{errors.flightClasses.root.message}</p>
                    )}
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

          {/* Flight Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-secondary rounded-lg p-1">
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
            {loading ? (
              <div className="text-center py-8">Loading flights...</div>
            ) : (activeTab === 'current' ? currentFlights.length === 0 : pastFlights.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                {activeTab === 'current' ? 'No current or future flights found' : 'No past flights found'}
              </div>
            ) : (
              <div className="space-y-3">
                {(activeTab === 'current' ? currentFlights : pastFlights).map((flight) => {
                  const isExpanded = expandedFlights.has(flight.id)
                  const isPastFlight = isFlightInPast(flight.departureTime)

                  return (
                    <div key={flight.id} className="border-app rounded-lg overflow-hidden">
                      <div
                        className={`p-4 hover:bg-secondary cursor-pointer ${isPastFlight ? 'bg-secondary opacity-75' : 'bg-app'}`}
                        onClick={() => toggleFlightExpansion(flight.id)}
                      >
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono h-10">
                            {flight.airline.code}-{flight.id.toString().padStart(4, '0')}
                          </Badge>
                          <div className="w-px h-6 bg-secondary-foreground mx-2" />

                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2 w-30">
                                <div className="flex flex-col items-center">
                                  <Badge variant="secondary" className="font-mono">
                                    {flight.originAirport.code}
                                  </Badge>
                                  <span className="text-xs text-secondary-foreground">{flight.originAirport.city}</span>
                                </div>
                                <span>→</span>
                                <div className="flex flex-col items-center">
                                  <Badge variant="secondary" className="font-mono">
                                    {flight.destinationAirport.code}
                                  </Badge>
                                  <span className="text-xs text-secondary-foreground">{flight.destinationAirport.city}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-secondary-foreground w-45">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(flight.departureTime)}
                              </div>

                              <div className="flex items-center gap-1 text-sm font-medium w-20">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(flight.minPrice)}
                              </div>

                              <div className="text-sm text-secondary-foreground">
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

                              {/* Management Buttons */}
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {isPastFlight ? (
                                  <Badge variant="secondary" className="text-tertiary-foreground">
                                    Completed
                                  </Badge>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(flight)
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Trash className="h-3 w-3" />
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
                        <div className="border-t bg-secondary p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Booking Details</h4>
                            <div className="flex gap-4 text-sm">
                              <span className="text-secondary-foreground">
                                Total Bookings: <span className="font-medium">{flight.bookingCount}</span>
                              </span>
                              <span className="text-secondary-foreground">
                                Booked Seats: <span className="font-medium">{flight.passengerCount}</span>
                              </span>
                              <span className="text-secondary-foreground">
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
                            <div className="text-center py-4 text-tertiary-foreground">
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