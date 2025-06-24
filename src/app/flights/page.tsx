import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFlightStore } from '@/store/flights'
import type { Flight } from '@/types'
import { FlightCard } from '@/components/flight/flight-card'
import { FlightFilters } from '@/components/flight/flight-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, SlidersHorizontal, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { FlightSearchForm } from '@/components/forms/flight-search-form'
import backgroundImage from '@/assets/background.jpeg'

export default function FlightsPage() {
  const navigate = useNavigate()
  const { flights, loading, searchParams } = useFlightStore()
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSearchForm, setShowSearchForm] = useState(false)
  const [sortBy, setSortBy] = useState<'price' | 'departure' | 'duration'>('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    // Don't redirect if no search params - show the search form instead
    if (!searchParams && !loading) {
      setShowSearchForm(true)
    }

    const sorted = [...flights]
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price)
        break
      case 'departure':
        sorted.sort((a, b) => {
          const aTime = new Date(a.departureTime).getTime()
          const bTime = new Date(b.departureTime).getTime()
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
        })
        break
      case 'duration':
        sorted.sort((a, b) => {
          const aDuration = new Date(a.arrivalTime || a.departureTime).getTime() - new Date(a.departureTime).getTime()
          const bDuration = new Date(b.arrivalTime || b.departureTime).getTime() - new Date(b.departureTime).getTime()
          return sortOrder === 'asc' ? aDuration - bDuration : bDuration - aDuration
        })
        break
    }

    setFilteredFlights(sorted)
  }, [flights, searchParams, loading, navigate, sortBy, sortOrder])

  const handleFilterChange = (filtered: Flight[]) => {
    setFilteredFlights(filtered)
  }

  const handleSortChange = (newSortBy: 'price' | 'departure' | 'duration') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  const formatSearchSummary = () => {
    if (!searchParams) return ''
    return `${searchParams.origin} → ${searchParams.destination} • ${new Date(searchParams.departureDate).toLocaleDateString()} • ${searchParams.passengers} passenger${searchParams.passengers > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" /> 

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Search Results
              </h1>
              <h1 className="text-2xl font-bold text-gray-900">{formatSearchSummary()}</h1>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchForm(!showSearchForm)}
                className="flex items-center"
              >
                <Search className="h-4 w-4 mr-2" />
                {showSearchForm ? 'Hide Search' : 'Modify Search'}
                {showSearchForm ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {flights.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                {filteredFlights.length} of {flights.length} flights found
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                {(['price', 'departure', 'duration'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={sortBy === type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleSortChange(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} {sortBy === type && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Form Section */}
        {(showSearchForm || (!searchParams && !loading)) && (
          <div className="mb-8">
            <Card className="shadow-lg border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Search className="h-5 w-5 mr-2 text-blue-600" />
                    {searchParams ? 'Modify Your Search' : 'Search Flights'}
                  </h2>
                  {searchParams && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearchForm(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FlightSearchForm />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {showFilters && (
            <div className="lg:w-80">
              <FlightFilters flights={flights} onFilterChange={handleFilterChange} />
            </div>
          )}

          <div className="flex-1">
            {filteredFlights.length === 0 && flights.length === 0 && !loading && (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn&apos;t find any flights matching your search criteria.
                  </p>
                  <Button onClick={() => navigate('/')}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {filteredFlights.length === 0 && flights.length > 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flights match your filters</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filter criteria to see more results.</p>
                  <Button variant="outline" onClick={() => setShowFilters(true)}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Adjust Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {filteredFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  passengers={searchParams?.passengers || 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
