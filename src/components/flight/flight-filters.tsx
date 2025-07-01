import { useState, useEffect } from 'react'
import type { Flight, Airline } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Filter, 
  X, 
  DollarSign, 
  Clock, 
  Plane,
} from 'lucide-react'

interface FlightFiltersProps {
  flights: Flight[]
  onFilterChange: (filteredFlights: Flight[]) => void
}

interface FilterState {
  priceRange: [number, number]
  airlines: string[]
  departureTimeRange: [number, number] // hours in 24h format
  maxDuration: number // in hours
}

export function FlightFilters({ flights, onFilterChange }: FlightFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    airlines: [],
    departureTimeRange: [0, 24],
    maxDuration: 24
  })

  const [tempFilters, setTempFilters] = useState<FilterState>(filters)

  // Get unique airlines from flights
  const availableAirlines = flights.reduce((acc: Airline[], flight) => {
    if (!acc.find(airline => airline.code === flight.airline.code)) {
      acc.push(flight.airline as Airline)
    }
    return acc
  }, [])

  // Calculate price range from flights
  const priceRange = flights.length > 0 
    ? [Math.min(...flights.map(f => f.minPrice)), Math.max(...flights.map(f => f.minPrice))]
    : [0, 1000]

  // Calculate max duration from flights
  const maxFlightDuration = flights.length > 0 
    ? Math.max(...flights.map(f => {
        const departure = new Date(f.departureTime).getTime()
        const arrival = new Date(f.arrivalTime || f.departureTime).getTime()
        return Math.ceil((arrival - departure) / (1000 * 60 * 60)) // hours
      }))
    : 12

  useEffect(() => {
    const filtered = flights.filter(flight => {
      // Price filter
      if (flight.minPrice < filters.priceRange[0] || flight.minPrice > filters.priceRange[1]) {
        return false
      }

      // Airline filter
      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline.code)) {
        return false
      }

      // Departure time filter
      const departureHour = new Date(flight.departureTime).getHours()
      if (departureHour < filters.departureTimeRange[0] || departureHour > filters.departureTimeRange[1]) {
        return false
      }
        // Duration filter
        const durationHours = flight.duration / 60
      return durationHours <= filters.maxDuration;
    })

    onFilterChange(filtered)
  }, [filters, flights, onFilterChange])

  const handleAirlineToggle = (airlineCode: string) => {
    setTempFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(airlineCode)
        ? prev.airlines.filter(code => code !== airlineCode)
        : [...prev.airlines, airlineCode]
    }))
  }

  const applyFilters = () => {
    setFilters(tempFilters)
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      priceRange: [priceRange[0], priceRange[1]],
      airlines: [],
      departureTimeRange: [0, 24],
      maxDuration: maxFlightDuration
    }
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
  }

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Price Range
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.priceRange[0]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                  }))}
                  className="w-20 text-sm"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.priceRange[1]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], parseInt(e.target.value) || 10000]
                  }))}
                  className="w-20 text-sm"
                />
              </div>
              <div className="text-xs text-gray-600">
                Range: ${priceRange[0]} - ${priceRange[1]}
              </div>
            </div>
          </div>

          {/* Airlines */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Plane className="h-4 w-4 mr-2" />
              Airlines
            </h4>
            <div className="space-y-2">
              {availableAirlines.map(airline => (
                <label key={airline.code} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempFilters.airlines.includes(airline.code)}
                    onChange={() => handleAirlineToggle(airline.code)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{airline.name}</span>
                  <span className="text-xs text-gray-500">({airline.code})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Departure Time */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Departure Time
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="0"
                  value={tempFilters.departureTimeRange[0]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    departureTimeRange: [parseInt(e.target.value) || 0, prev.departureTimeRange[1]]
                  }))}
                  className="w-16 text-sm"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="24"
                  value={tempFilters.departureTimeRange[1]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    departureTimeRange: [prev.departureTimeRange[0], parseInt(e.target.value) || 24]
                  }))}
                  className="w-16 text-sm"
                />
              </div>
              <div className="text-xs text-gray-600">
                {formatTime(tempFilters.departureTimeRange[0])} - {formatTime(tempFilters.departureTimeRange[1])}
              </div>
            </div>
          </div>

          {/* Flight Duration */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Max Duration
            </h4>
            <div className="space-y-3">
              <Input
                type="number"
                min="1"
                max={maxFlightDuration}
                placeholder="12"
                value={tempFilters.maxDuration}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  maxDuration: parseInt(e.target.value) || 12
                }))}
                className="w-20 text-sm"
              />
              <div className="text-xs text-gray-600">
                Up to {formatDuration(tempFilters.maxDuration)}
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Filters</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempFilters(prev => ({ ...prev, priceRange: [priceRange[0], Math.floor(priceRange[1] * 0.7)] }))}
                className="w-full text-left justify-start text-sm"
              >
                Budget Flights (Up to ${Math.floor(priceRange[1] * 0.7)})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempFilters(prev => ({ ...prev, departureTimeRange: [6, 12] }))}
                className="w-full text-left justify-start text-sm"
              >
                Morning Departures (6:00-12:00)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempFilters(prev => ({ ...prev, maxDuration: 4 }))}
                className="w-full text-left justify-start text-sm"
              >
                Short Flights (Under 4h)
              </Button>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button 
              onClick={applyFilters} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 