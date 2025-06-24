import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Airport } from '@/types'
import { useEffect, useState } from 'react';
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

export function AirportVisualiser({ airports }: { airports: Airport[] }) {
    const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
    const [center, setCenter] = useState<[number, number]>([41.0082, 28.9784])
    const [zoom, setZoom] = useState<number>(2)
    const [markers, setMarkers] = useState<React.ReactNode[]>([])

    useEffect(() => {
        setMarkers(airports.map((airport) => (
            <Marker key={airport.code} position={[airport.latitude, airport.longitude]} icon={airport.code === selectedAirport?.code ? redIcon : blueIcon} eventHandlers={{
                click: () => {
                    if (selectedAirport?.code === airport.code) {
                        setSelectedAirport(null);
                        setCenter([41.0082, 28.9784]);
                        setZoom(2);
                    } else {
                    setSelectedAirport(airport);
                        setCenter([airport.latitude, airport.longitude]);
                        setZoom(8);
                    }
                }
            }}>
                <Popup>
                    <div>
                        <h2>{airport.name} ({airport.code})</h2>
                        <p>{airport.city}, {airport.country}</p>
                    </div>
                </Popup>
            </Marker>
        )));
    }, [airports, selectedAirport]);

    return (
        <MapContainer style={{ height: '300px', width: '100%' }} center={[41.0082, 28.9784]} zoom={2}>
            <ChangeView center={center} zoom={zoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers}
        </MapContainer>
    )
}