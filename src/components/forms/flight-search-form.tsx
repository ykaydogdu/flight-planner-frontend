import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PassengerSelector } from './passenger-selector'
import { useFlightStore } from '@/store/flights'
import type { FlightSearchParams, Airport, Airline } from '@/types'
import { Search, MapPin, Calendar, Plane, Users, ArrowLeftRight, ChevronDown } from 'lucide-react'

const flightSearchSchema = (airports: Airport[], airlines: Airline[], anyDate: boolean) => z.object({
  origin: z.string()
    .min(1, 'Please select an origin airport')
    .refine(val => airports.some(a => a.name === val), 'Please select a valid origin airport from the list.'),
  destination: z.string()
    .min(1, 'Please select a destination airport')
    .refine(val => airports.some(a => a.name === val), 'Please select a valid destination airport from the list.'),
  departureDate: z.string().optional(),
  passengers: z.object({
    economy: z.number().min(0),
    business: z.number().min(0),
    firstClass: z.number().min(0)
  }).refine(
    (data) => data.economy + data.business + data.firstClass >= 1,
    'At least one passenger is required'
  ).refine(
    (data) => data.economy + data.business + data.firstClass <= 9,
    'Maximum 9 passengers allowed'
  ),
  airline: z.string().optional().refine(
    (val) => !val || airlines.some(a => a.name === val),
    'Please select a valid airline or leave empty.'
  )
}).superRefine(
  (data, ctx) => {
    if (data.origin && data.destination && data.origin === data.destination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Origin and destination cannot be the same',
        path: ['destination'],
      })
    }

    if (!anyDate && data.departureDate == "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a departure date or click "Any" to search for flights on any date',
        path: ['departureDate'],
      })
    }
  }
)

type FlightSearchFormData = z.infer<ReturnType<typeof flightSearchSchema>>

// Function to convert degrees to radians
const toRadians = (deg: number): number => deg * (Math.PI / 180);
const getNearestAirportHaversine = async (
  latitude: number,
  longitude: number,
  airports: Airport[]
): Promise<Airport> => {
  if (airports.length === 0) {
    throw new Error("Airport list cannot be empty.");
  }

  const R = 6371; // Radius of Earth in kilometers (use 3958.8 for miles)

  const latRad = toRadians(latitude);
  const lonRad = toRadians(longitude);

  let nearestAirport = airports[0];
  let minDistance = Infinity;

  // Optimized Haversine calculation
  for (const airport of airports) {
    const airportLatRad = toRadians(airport.latitude);
    const airportLonRad = toRadians(airport.longitude);

    const dLat = airportLatRad - latRad;
    const dLon = airportLonRad - lonRad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latRad) * Math.cos(airportLatRad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers

    if (distance < minDistance) {
      minDistance = distance;
      nearestAirport = airport;
    }
  }

  return nearestAirport;
};

export function FlightSearchForm({ variant = 'default' }: { variant?: 'default' | 'search-results' }) {
  const navigate = useNavigate()
  const { searchFlights, fetchAirports, fetchAirlines, airports, airlines, loading } = useFlightStore()
  const [anyDate, setAnyDate] = useState<boolean>(false);
  const [loadingAirport, setLoadingAirport] = useState<boolean>(false);
  const [showPassengers, setShowPassengers] = useState<boolean>(false);
  const passengerTriggerRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FlightSearchFormData>({
    resolver: zodResolver(flightSearchSchema(airports, airlines, anyDate)),
    defaultValues: {
      passengers: {
        economy: 1,
        business: 0,
        firstClass: 0
      },
    },
  })

  const passengers = watch('passengers')
  const totalPassengers = passengers.economy + passengers.business + passengers.firstClass

  useEffect(() => {
    fetchAirports()
    fetchAirlines()
  }, [fetchAirports, fetchAirlines])

  const handleUseNearestAirport = (type: 'origin' | 'destination') => {
    if (navigator.geolocation) {
      setLoadingAirport(true)
      navigator.geolocation.getCurrentPosition(async position => {
        const nearestAirport = await getNearestAirportHaversine(position.coords.latitude, position.coords.longitude, airports)
        setValue(type, nearestAirport.name)
        setLoadingAirport(false)
      })
    } else {
      console.error('Geolocation is not supported by this browser.')
    }
  }

  const onSubmit = async (data: FlightSearchFormData) => {
    try {
      const originAirport = airports.find(a => a.name === data.origin)
      const destinationAirport = airports.find(a => a.name === data.destination)
      const airline = data.airline ? airlines.find(a => a.name === data.airline) : undefined

      if (!originAirport || !destinationAirport) {
        // This should be caught by validation, but as a safeguard
        console.error('Invalid airport name selected')
        return;
      }

      const searchParams: FlightSearchParams = {
        originAirportCode: originAirport.code,
        destinationAirportCode: destinationAirport.code,
        ...(data.departureDate && { departureDate: data.departureDate }),
        ...(airline && { airlineCode: airline.code }),
        ...(data.passengers.economy > 0 && { passengerEconomy: data.passengers.economy }),
        ...(data.passengers.business > 0 && { passengerBusiness: data.passengers.business }),
        ...(data.passengers.firstClass > 0 && { passengerFirstClass: data.passengers.firstClass })
      }

      searchFlights(searchParams)
      navigate('/flights')
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSwapLocations = () => {
    const origin = watch('origin')
    const destination = watch('destination')
    setValue('origin', destination)
    setValue('destination', origin)
  }

  return (variant === 'default' ? (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Origin */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium text-secondary-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  From •
                </label>
                <button
                  type="button"
                  onClick={() => handleUseNearestAirport('origin')}
                  className="text-sm text-primary hover:text-secondary-foreground underline cursor-pointer ml-1"
                  disabled={loadingAirport}
                >
                  {loadingAirport ? 'Loading...' : 'Use nearest airport'}
                </button>
              </div>
              <Input
                {...register('origin')}
                placeholder="Origin airport"
                className={errors.origin ? 'border-red-500' : ''}
                list="airports-from"
              />
              <datalist id="airports-from">
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.name}>
                    {airport.name} ({airport.code}) - {airport.city}/{airport.country}
                  </option>
                ))}
              </datalist>
              {errors.origin && (
                <p className="text-sm text-red-500">{errors.origin.message}</p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex-shrink-0 flex items-center justify-center mt-1 md:mt-6 -ml-6 -mr-6 z-10">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="p-3 rounded-full border border-gray-300 bg-app hover:bg-gray-400 transition-colors shadow-md"
              >
                <ArrowLeftRight className="w-5 h-5 text-secondary-foreground" />
              </button>
            </div>

            {/* Destination */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium text-secondary-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  To •
                </label>
                <button
                  type="button"
                  onClick={() => handleUseNearestAirport('destination')}
                  className="text-sm text-primary hover:text-secondary-foreground underline cursor-pointer ml-1"
                  disabled={loadingAirport}
                >
                  {loadingAirport ? 'Loading...' : 'Use nearest airport'}
                </button>
              </div>
              <Input
                {...register('destination')}
                placeholder="Destination airport"
                className={errors.destination ? 'border-red-500' : ''}
                list="airports-to"
              />
              <datalist id="airports-to">
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.name}>
                    {airport.name} ({airport.code}) - {airport.city}/{airport.country}
                  </option>
                ))}
              </datalist>
              {errors.destination && (
                <p className="text-sm text-red-500">{errors.destination.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Departure Date */}
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium text-secondary-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Departure •
                </label>
                <button
                  type="button"
                  onClick={() => setAnyDate(!anyDate)}
                  className="text-sm text-primary hover:text-primary-foreground underline cursor-pointer ml-1"
                >
                  {anyDate ? 'Select Date' : 'Any'}
                </button>
              </div>
              <Input
                type="date"
                {...register('departureDate')}
                min={new Date().toISOString().split("T")[0]}
                className={errors.departureDate ? 'border-red-500' : ''}
                disabled={anyDate}
                data-testid="departure-date-input"
              />
              {errors.departureDate && (
                <p className="text-sm text-red-500">{errors.departureDate.message}</p>
              )}
            </div>

            {/* Passengers */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-secondary-foreground flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Passengers
              </label>
              <div className="relative" ref={passengerTriggerRef}>
                <div
                  className={`flex items-center justify-between cursor-pointer ${errors.passengers ? 'border-red-500' : ''}`}
                  onClick={() => setShowPassengers(!showPassengers)}
                >
                  <Input
                    value={`${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}`}
                    readOnly
                    className={`cursor-pointer pr-10 ${errors.passengers ? 'border-red-500' : ''}`}
                  />
                  <ChevronDown 
                    className={`absolute right-3 h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      showPassengers ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
                <PassengerSelector
                  value={passengers}
                  onChange={(selection) => setValue('passengers', selection)}
                  error={errors.passengers?.message}
                  isOpen={showPassengers}
                  onClose={() => setShowPassengers(false)}
                  containerRef={passengerTriggerRef}
                />
              </div>
            </div>

            {/* Airline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-foreground flex items-center">
                <Plane className="h-4 w-4 mr-1" />
                Airline
              </label>
              <Input
                {...register('airline')}
                placeholder="Any"
                className={errors.airline ? 'border-red-500' : ''}
                list="airline"
              />
              <datalist id="airline">
                {airlines.map((airline) => (
                  <option
                    key={airline.code}
                    value={airline.name}
                  >
                    {airline.code}
                  </option>
                ))}
              </datalist>
              {errors.airline && (
                <p className="text-sm text-red-500">{errors.airline.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto px-8 py-3 text-lg"
            disabled={loading}
          >
            <Search className="h-5 w-5 mr-2" />
            {loading ? 'Searching...' : 'Search Flights'}
          </Button>
        </form>
      </CardContent>
    </Card>
  ) : (
    <Card className="w-full bg-slate-800 mb-4 p-0">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Search Form Row */}
          <div className="flex items-center gap-0.5">
            {/* Departure Location */}
            <div className="flex-1 bg-white rounded-l-xl border-r border-gray-200">
              <div className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  From
                </label>
                <div className="relative">
                  <input
                    {...register('origin')}
                    type="text"
                    className={`w-full border-none bg-transparent text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 p-0 ${errors.origin ? 'text-red-500' : ''}`}
                    placeholder="Origin Airport"
                    list="airports-from-compact"
                  />
                  <MapPin className="absolute right-0 top-0 w-4 h-4 text-gray-400 mr-4" />
                </div>
                {errors.origin && (
                  <p className="text-xs text-red-500 mt-1">{errors.origin.message}</p>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="relative z-10 -mx-6">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="p-3 rounded-full border-2 border-secondary-foreground bg-app hover:bg-gray-400 transition-colors shadow-md"
              >
                <ArrowLeftRight className="w-5 h-5 text-secondary-foreground" />
              </button>
            </div>

            {/* Arrival Location */}
            <div className="flex-1 bg-white border-r border-gray-200">
              <div className="p-4 ml-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  To
                </label>
                <div className="relative">
                  <input
                    {...register('destination')}
                    type="text"
                    className={`w-full border-none bg-transparent text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 p-0 ${errors.destination ? 'text-red-500' : ''}`}
                    placeholder="Destination Airport"
                    list="airports-to-compact"
                  />
                  <MapPin className="absolute right-0 top-0 w-4 h-4 text-gray-400" />
                </div>
                {errors.destination && (
                  <p className="text-xs text-red-500 mt-1">{errors.destination.message}</p>
                )}
              </div>
            </div>

            {/* Departure Date */}
            <div className="flex-1 bg-white border-r border-gray-200">
              <div className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Depart •
                </label>
                <button
                  type="button"
                  onClick={() => setAnyDate(!anyDate)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline ml-1"
                >
                  {anyDate ? 'Select Date' : 'Any'}
                </button>
                <div className="relative">
                  <input
                    {...register('departureDate')}
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    disabled={anyDate}
                    className={`w-full border-none bg-transparent text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 p-0 ${errors.departureDate ? 'text-red-500' : ''}`}
                    placeholder="Departure Date"
                  />
                </div>
                {errors.departureDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.departureDate.message}</p>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="flex-1 bg-white relative">
              <div className="p-4" ref={passengerTriggerRef}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Passengers
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full text-left border-none bg-transparent text-gray-900 font-medium focus:outline-none focus:ring-0 p-0"
                    onClick={() => setShowPassengers(!showPassengers)}
                  >
                    {totalPassengers} passengers
                  </button>
                  <Users className="absolute right-0 top-0 w-4 h-4 text-gray-400" />
                </div>
                {errors.passengers && (
                  <p className="text-xs text-red-500 mt-1">{errors.passengers.message}</p>
                )}
              </div>
              <PassengerSelector
                value={passengers}
                onChange={(selection) => setValue('passengers', selection)}
                error={errors.passengers?.message}
                isOpen={showPassengers}
                onClose={() => setShowPassengers(false)}
                containerRef={passengerTriggerRef}
              />
            </div>

            {/* Airline */}
            <div className="flex-1 bg-white rounded-r-xl relative">
              <div className="p-4" ref={passengerTriggerRef}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Airline
                </label>
                <input
                  {...register('airline')}
                  placeholder="Any"
                  className={`w-full border-none bg-transparent text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-0 p-0 ${errors.airline ? 'text-red-500' : ''}`}
                  list="airline"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="ml-4">
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-6 rounded-xl font-medium transition-colors text-lg"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Datalists for airport suggestions */}
        <datalist id="airports-from-compact">
          {airports.map((airport) => (
            <option key={airport.code} value={airport.name}>
              {airport.name} ({airport.code}) - {airport.city}/{airport.country}
            </option>
          ))}
        </datalist>
        <datalist id="airports-to-compact">
          {airports.map((airport) => (
            <option key={airport.code} value={airport.name}>
              {airport.name} ({airport.code}) - {airport.city}/{airport.country}
            </option>
          ))}
        </datalist>
      </CardContent>
    </Card>
  ))
} 