import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Airport } from '@/types'
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap()
    useEffect(() => {
        map.setView(center, zoom)
    }, [center, zoom, map])
    return null;
}

export function AirportVisualiser({ airports, selectedAirport, handleSelectAirport }: { airports: Airport[], selectedAirport: Airport | null, handleSelectAirport: (airport: Airport) => void }) {
    const [center, setCenter] = useState<[number, number]>([41.0082, 28.9784])
    const [zoom, setZoom] = useState<number>(2)
    const [selectedMarker, setSelectedMarker] = useState<L.Marker | null>(null)
    const markerRefs = useRef<Record<string, L.Marker>>({});

    useEffect(() => {
        if (selectedAirport) {
            setCenter([selectedAirport.latitude, selectedAirport.longitude]);
            setZoom(8);

            const markerInstance = markerRefs.current[selectedAirport.code];
            if (markerInstance) {
                setSelectedMarker(markerInstance)
                markerInstance.openPopup();
            }
        } else {
            setCenter([41.0082, 28.9784]);
            setZoom(2);
            setSelectedMarker(null)
            if (selectedMarker) {
                selectedMarker.closePopup();
            }
        }
    }, [airports, selectedAirport, handleSelectAirport, selectedMarker]);

    return (
        <MapContainer style={{ height: '300px', width: '100%' }} center={[41.0082, 28.9784]} zoom={2} doubleClickZoom={false}>
            <ChangeView center={center} zoom={zoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {airports.map((airport) => (
                <Marker ref={(el: L.Marker | null) => {
                    if (el) {
                        markerRefs.current[airport.code] = el;
                    }
                }} key={airport.code} position={[airport.latitude, airport.longitude]} icon={airport.code === selectedAirport?.code ? redIcon : blueIcon} eventHandlers={{
                    click: () => {
                        handleSelectAirport(airport)
                    }
                }}>
                    <Popup>
                        <div>
                            <h2>{airport.name} ({airport.code})</h2>
                            <p>{airport.city}, {airport.country}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}