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
import { motion } from 'motion/react'

export default function FlightsPage() {
  const navigate = useNavigate()
  const { flights, loading, searchParams, hasActiveSearch, clearSearchState } = useFlightStore()
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSearchForm, setShowSearchForm] = useState(false)
  const [sortBy, setSortBy] = useState<'price' | 'departure' | 'duration'>('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // On component mount, verify if the last search is older than 2 minutes.
  // If so, reset the search state so that the user starts with a clean slate.
  useEffect(() => {
    const { lastSearchTime } = useFlightStore.getState()
    const TWO_MINUTES = 2 * 60 * 1000

    if (lastSearchTime && Date.now() - lastSearchTime > TWO_MINUTES) {
      clearSearchState()
      setShowSearchForm(true)
    }
    // If there is no active search at all we still want to show the search form
    if (!hasActiveSearch) {
      setShowSearchForm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  useEffect(() => {
    const sorted = [...flights]
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice)
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
    if (!hasActiveSearch || !searchParams) return ''
    return `${searchParams.originAirportCode} → ${searchParams.destinationAirportCode} • 
    ${(searchParams.departureDate !== undefined) ? new Date(searchParams.departureDate).toLocaleDateString() : 'Any'}
    ${searchParams.airlineCode ? `• ${searchParams.airlineCode}` : ''}
    ${searchParams.passengerEconomy ? `• ${searchParams.passengerEconomy} economy` : ''}
    ${searchParams.passengerBusiness ? `• ${searchParams.passengerBusiness} business` : ''}
    ${searchParams.passengerFirstClass ? `• ${searchParams.passengerFirstClass} first class` : ''}
    `
  }


  if (loading) {
    return (
      <div className="relative min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {hasActiveSearch ? 'Search Results' : 'Flight Search'}
                </h1>
                <h1 className="text-2xl font-bold text-gray-900">{formatSearchSummary()}</h1>
              </div>
            </div>
          </div>

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
    <div className="relative min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                {hasActiveSearch ? 'Search Results' : 'Flight Search'}
                </h1>
              <h1 className="text-2xl font-bold text-foreground">{formatSearchSummary()}</h1>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchForm(!showSearchForm)}
                className="flex items-center"
                disabled={!hasActiveSearch}
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
        </div>

        {/* Search Form Section */}
        {(showSearchForm || (!hasActiveSearch && !loading)) && (
          <motion.div
            key="search-form"
            layout
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FlightSearchForm variant="search-results" />
          </motion.div>
        )}

        {flights.length > 0 && hasActiveSearch && (
          <motion.div
            key="filters"
            layout
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm mb-6">
              <p className="text-sm text-secondary-foreground">
                {filteredFlights.length} of {flights.length} flights found
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-secondary-foreground">Sort by:</span>
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
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {showFilters && (
            <div className="lg:w-80 sticky top-20 self-start">
              <FlightFilters flights={flights} onFilterChange={handleFilterChange} />
            </div>
          )}

          <div className="flex-1">
            {filteredFlights.length === 0 && flights.length === 0 && !loading && (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No flights found</h3>
                  <p className="text-secondary-foreground mb-4">
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
                  <h3 className="text-lg font-medium text-foreground mb-2">No flights match your filters</h3>
                  <p className="text-secondary-foreground mb-4">Try adjusting your filter criteria to see more results.</p>
                  <Button variant="outline" onClick={() => setShowFilters(true)}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Adjust Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            <motion.div
              key="flights"
              layout
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {filteredFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    economyPassengers={searchParams?.passengerEconomy || 0}
                    businessPassengers={searchParams?.passengerBusiness || 0}
                    firstClassPassengers={searchParams?.passengerFirstClass || 0}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
