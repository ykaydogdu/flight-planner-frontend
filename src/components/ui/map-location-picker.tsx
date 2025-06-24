import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from './button'

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapLocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number) => void
  onCancel: () => void
  initialCenter?: [number, number]
  className?: string
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      onLocationSelect(lat, lng)
    },
  })

  return position === null ? null : <Marker position={position} />
}

export function MapLocationPicker({ 
  onLocationSelect, 
  onCancel, 
  initialCenter = [41.0082, 28.9784],
  className = "" 
}: MapLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [city, setCity] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
  
    try {
      setLoading(true)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=geocodejson&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            'User-Agent': 'FlightPlanner/0.1 (y.kaan.aydogdu@gmail.com)',
            'Accept-Language': 'en-US,en;q=0.9,tr-TR;q=0.8,tr;q=0.7',
          },
        }
      ).then(response => {
        setLoading(false)
        return response.json()
      })
      const data = response.features[0].properties.geocoding
      const cityFetched = data.type === 'city' ? data.name : data.state || 'Unknown'
      const countryFetched = data.country || 'Unknown'
      
      setCity(cityFetched)
      setCountry(countryFetched)
    } catch (error) {
      console.error('Error fetching location info:', error)
    }
  }  

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-gray-600 mb-2">
        Click on the map to select the airport location
      </div>
      
      <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={initialCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>

      {selectedLocation && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm font-medium text-green-800">Location Selected:</div>
          <div className="text-sm text-green-700">
            Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
          </div>
          <div className="text-sm text-green-700">
            City: {city}
          </div>
          <div className="text-sm text-green-700">
            Country: {country}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleConfirm}
          disabled={!selectedLocation || loading}
        >
          {loading ? 'Loading...' : 'Confirm Location'}
        </Button>
      </div>
    </div>
  )
} 