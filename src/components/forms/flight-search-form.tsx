'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useFlightStore } from '@/store/flights'
import type { FlightSearchParams } from '@/types'
import { Search, MapPin, Calendar, Users, Plane } from 'lucide-react'

const flightSearchSchema = z.object({
  origin: z.string().min(3, 'Please select an origin airport'),
  destination: z.string().min(3, 'Please select a destination airport'),
  departureDate: z.string(),
  passengers: z.number().min(1).max(9),
  airline: z.string()
})

type FlightSearchFormData = z.infer<typeof flightSearchSchema>

export function FlightSearchForm() {
  const navigate = useNavigate()
  const { searchFlights, fetchAirports, fetchAirlines, airports, airlines, loading } = useFlightStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FlightSearchFormData>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      passengers: 1,
      departureDate: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    fetchAirports()
    fetchAirlines()
  }, [fetchAirports, fetchAirlines])

  const onSubmit = async (data: FlightSearchFormData) => {
    try {
      const searchParams: FlightSearchParams = {
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        passengers: data.passengers,
        airline: data.airline,
      }

      await searchFlights(searchParams)
      navigate('/flights')
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                From
              </label>
              <Input
                {...register('origin')}
                placeholder="Origin airport"
                className={errors.origin ? 'border-red-500' : ''}
                list="airports-from"
              />
              <datalist id="airports-from">
                {airports.map((airport) => (
                  <option
                    key={airport.code}
                    value={airport.name}
                  >
                    {airport.name} ({airport.code}) - {airport.city}/{airport.country}
                  </option>
                ))}
              </datalist>
              {errors.origin && (
                <p className="text-sm text-red-500">{errors.origin.message}</p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                To
              </label>
              <Input
                {...register('destination')}
                placeholder="Destination airport"
                className={errors.destination ? 'border-red-500' : ''}
                list="airports-to"
              />
              <datalist id="airports-to">
                {airports.map((airport) => (
                  <option
                    key={airport.code}
                    value={airport.name}
                  >
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
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Departure
              </label>
              <Input
                type="date"
                {...register('departureDate')}
                min={new Date().toLocaleDateString("tr-TR", { year: 'numeric', month: '2-digit', day: '2-digit' })}
                className={errors.departureDate ? 'border-red-500' : ''}
              />
              {errors.departureDate && (
                <p className="text-sm text-red-500">{errors.departureDate.message}</p>
              )}
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Passengers
              </label>
              <Input
                type="number"
                min="1"
                max="9"
                {...register('passengers', { valueAsNumber: true })}
                className={errors.passengers ? 'border-red-500' : ''}
              />
              {errors.passengers && (
                <p className="text-sm text-red-500">{errors.passengers.message}</p>
              )}
            </div>

            {/* Airline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Plane className="h-4 w-4 mr-1" />
                Airline
              </label>
              <Input
                {...register('airline')}
                placeholder="Airline"
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
  )
} 