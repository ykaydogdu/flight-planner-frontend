import { useState } from 'react'
import { useAirportStore } from '@/store/airports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapLocationPicker } from '@/components/ui/map-location-picker'
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
import type { Airport } from '@/types'
import { AirportVisualiser } from './airport-visualiser'

export function AirportManagement() {
  const { airports, loading, createAirport, deleteAirport } = useAirportStore()
  const [newAirport, setNewAirport] = useState<Omit<Airport, 'id'>>({
    code: '',
    name: '',
    city: '',
    country: '',
    latitude: 0,
    longitude: 0
  })
  const [creating, setCreating] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showAllAirports, setShowAllAirports] = useState(false)
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // if (!newAirport.code.trim() || !newAirport.name.trim() || !newAirport.city.trim() || !newAirport.country.trim()) {
    if (!newAirport.code.trim() || !newAirport.name.trim()) {
      alert('Please fill in all fields')
      return
    }

    // Show map for location selection
    setShowMap(true)
  }

  const handleLocationSelect = async (latitude: number, longitude: number) => {
    const airportWithLocation = {
      ...newAirport,
      latitude,
      longitude
    }

    setCreating(true)
    try {
      await createAirport(airportWithLocation)
      setNewAirport({ 
        code: '', 
        name: '', 
        city: '', 
        country: '', 
        latitude: 0, 
        longitude: 0 
      })
      setShowMap(false)
      alert('Airport created successfully!')
    } catch (error) {
      console.error('Error creating airport:', error)
      alert('Failed to create airport. Code might already exist.')
    } finally {
      setCreating(false)
    }
  }

  const handleCancelMap = () => {
    setShowMap(false)
  }

  const handleDeleteAirport = async (code: string) => {
    try {
      await deleteAirport(code)
      alert('Airport deleted successfully!')
    } catch (error) {
      console.error('Error deleting airport:', error)
      alert('Failed to delete airport. It might be in use.')
    }
  }

  const handleAirportSelect = (airport: Airport) => {
    if (selectedAirport?.code === airport.code) {
      setSelectedAirport(null)
    } else {
      setSelectedAirport(airport)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏢 Airport Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showMap ? (
          <>
            {/* Create New Airport Form */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-3">Create New Airport</h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    placeholder="Airport Code (e.g., JFK)"
                    value={newAirport.code}
                    onChange={(e) => setNewAirport({ ...newAirport, code: e.target.value.toUpperCase() })}
                    className="w-48"
                    maxLength={3}
                    required
                  />
                  <Input
                    placeholder="Airport Name (e.g., John F. Kennedy International Airport)"
                    value={newAirport.name}
                    onChange={(e) => setNewAirport({ ...newAirport, name: e.target.value })}
                    className="flex-1"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  {/* <Input
                    placeholder="City (e.g., New York)"
                    value={newAirport.city}
                    onChange={(e) => setNewAirport({ ...newAirport, city: e.target.value })}
                    className="flex-1"
                    required
                  />
                  <Input
                    placeholder="Country (e.g., United States)"
                    value={newAirport.country}
                    onChange={(e) => setNewAirport({ ...newAirport, country: e.target.value })}
                    className="flex-1"
                    required
                  /> */}
                  <Button type="submit" disabled={creating}>
                    Next: Select Location
                  </Button>
                </div>
              </form>
            </div>

            <div className="mb-6">
              <AirportVisualiser airports={airports} selectedAirport={selectedAirport} handleSelectAirport={handleAirportSelect} />
            </div>

            {/* Airports List */}
            <div className="space-y-3">
              <h3 className="font-semibold">Existing Airports ({airports.length})</h3>
              
              {loading ? (
                <div className="text-center py-8">Loading airports...</div>
              ) : airports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No airports found</div>
              ) : (
                <div className="grid gap-3">
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setShowAllAirports(!showAllAirports)}
                  >
                    {showAllAirports ? "Show Less" : "Show All"}
                  </Button>
                  {airports.slice(0, showAllAirports ? airports.length : 3).map((airport) => (
                    <div key={airport.code} className="flex items-center justify-between p-3 border rounded-lg" data-testid="airport-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 flex items-center justify-center">
                          <Badge variant="secondary" className="font-mono">
                            {airport.code}
                          </Badge>  
                        </div>
                        <div>
                          <div className="font-medium">{airport.name}</div>
                          <div className="text-sm text-gray-600">
                            {airport.city}, {airport.country}
                              <Button variant="link" size="sm" className="ml-2 text-xs text-blue-600" onClick={() => handleAirportSelect(airport)}>
                                📍 {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
                              </Button>
                          </div>
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Airport</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete airport "{airport.name}" ({airport.code})? 
                              This action cannot be undone and may affect existing flights.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAirport(airport.code)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                Select Location for {newAirport.name} ({newAirport.code})
              </h3>
            </div>
            
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="text-sm text-blue-800 mb-2">
                <strong>Airport Details:</strong>
              </div>
              <div className="text-sm text-blue-700">
                <div><strong>Code:</strong> {newAirport.code}</div>
                <div><strong>Name:</strong> {newAirport.name}</div>
              </div>
            </div>

            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              onCancel={handleCancelMap}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 