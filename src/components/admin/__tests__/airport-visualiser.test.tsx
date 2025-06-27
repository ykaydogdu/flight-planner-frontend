import { render, screen, fireEvent } from '@testing-library/react'
import { AirportVisualiser } from '../airport-visualiser'
import { vi } from 'vitest'
import type { Airport } from '@/types'

// Mock react-leaflet primitives to avoid rendering real maps
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <></>,
  Marker: ({ children, eventHandlers }: { children: React.ReactNode; eventHandlers?: { click?: () => void } }) => (
    <div data-testid="marker" onClick={() => eventHandlers?.click?.()}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: () => {} }),
}))

const airportsMock: Airport[] = [
  { code: 'AAA', name: 'Alpha', city: 'Alpha', country: 'A', latitude: 0, longitude: 0 },
  { code: 'BBB', name: 'Beta', city: 'Beta', country: 'B', latitude: 1, longitude: 1 },
]

describe('AirportVisualiser', () => {
  it('renders a marker for each airport', () => {
    render(
      <AirportVisualiser
        airports={airportsMock}
        selectedAirport={null}
        handleSelectAirport={vi.fn()}
      />,
    )
    expect(screen.getAllByTestId('marker')).toHaveLength(airportsMock.length)
  })

  it('invokes callback when marker is clicked', () => {
    const selectMock = vi.fn()
    render(
      <AirportVisualiser
        airports={airportsMock}
        selectedAirport={null}
        handleSelectAirport={selectMock}
      />,
    )

    fireEvent.click(screen.getAllByTestId('marker')[0])
    expect(selectMock).toHaveBeenCalledWith(airportsMock[0])
  })
}) 