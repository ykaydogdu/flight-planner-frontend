import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Airport } from '@/types';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Button } from './button';

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

interface AirportPickerProps {
    airports: Airport[];
    onSelect: (airport: Airport) => void;
    onCancel: () => void;
    selectedOrigin?: Airport | null;
    selectedDestination?: Airport | null;
}

export function AirportPicker({
    airports,
    onSelect,
    onCancel,
    selectedOrigin,
    selectedDestination
}: AirportPickerProps) {
    const [center] = useState<[number, number]>([41.0082, 28.9784]);
    const [zoom] = useState<number>(2);

    const getIcon = (airport: Airport) => {
        if (selectedOrigin && airport.code === selectedOrigin.code) {
            return greenIcon;
        }
        if (selectedDestination && airport.code === selectedDestination.code) {
            return redIcon;
        }
        return blueIcon;
    };

    return (
        <div className="space-y-4">
            <MapContainer style={{ height: '400px', width: '100%' }} center={center} zoom={zoom} doubleClickZoom={false}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {airports.map(airport => (
                    <Marker
                        key={airport.code}
                        position={[airport.latitude, airport.longitude]}
                        icon={getIcon(airport)}
                    >
                        <Popup>
                            <div>
                                <h2>
                                    {airport.name} ({airport.code})
                                </h2>
                                <p>
                                    {airport.city}, {airport.country}
                                </p>
                                <Button onClick={() => onSelect(airport)} className="mt-2 w-full">
                                    Confirm Selection
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            <Button onClick={onCancel} variant="outline">
                Cancel
            </Button>
        </div>
    );
} 