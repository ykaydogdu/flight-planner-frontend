import { render, screen, waitFor } from '@testing-library/react'
import { AirportManagement } from '../airport-management'
import { vi } from 'vitest'
import type { Airport } from '@/types'
import userEvent from '@testing-library/user-event'

// Mock alert to silence pop-ups during tests
window.alert = vi.fn()

// Mocks for store actions
const createAirportMock = vi.fn(() => Promise.resolve())
const deleteAirportMock = vi.fn(() => Promise.resolve())

const airportsMock: Airport[] = [
  { code: 'AAA', name: 'Alpha Airport', city: 'Alpha', country: 'A-Land', latitude: 0, longitude: 0 },
  { code: 'BBB', name: 'Beta Airport', city: 'Beta', country: 'B-Land', latitude: 1, longitude: 1 },
  { code: 'CCC', name: 'Charlie Airport', city: 'Charlie', country: 'C-Land', latitude: 2, longitude: 2 },
  { code: 'DDD', name: 'Delta Airport', city: 'Delta', country: 'D-Land', latitude: 3, longitude: 3 },
  { code: 'EEE', name: 'Echo Airport', city: 'Echo', country: 'E-Land', latitude: 4, longitude: 4 },
]

vi.mock('@/store/airports', () => ({
  useAirportStore: () => ({
    airports: airportsMock,
    loading: false,
    createAirport: createAirportMock,
    deleteAirport: deleteAirportMock,
  }),
}))

// Stub MapLocationPicker to avoid Leaflet & network complexity
vi.mock('@/components/ui/map-location-picker', () => ({
  MapLocationPicker: ({ onLocationSelect, onCancel }: { onLocationSelect: (lat: number, lng: number) => void; onCancel: () => void }) => (
    <div data-testid="map-picker">
      <button onClick={() => onLocationSelect(10, 20)}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

describe('AirportManagement', () => {
  it('renders existing airports', () => {
    render(<AirportManagement />)
    expect(screen.getByText(/existing airports/i)).toBeInTheDocument()
    expect(screen.getByText(/alpha airport/i)).toBeInTheDocument()
    expect(screen.getByText(/beta airport/i)).toBeInTheDocument()
  })

  it('shows map picker and creates airport on form flow', async () => {
    render(<AirportManagement />)

    await userEvent.type(screen.getByPlaceholderText(/airport code/i), 'CCC')
    await userEvent.type(screen.getByPlaceholderText(/airport name/i), 'Charlie Airport')

    await userEvent.click(screen.getByRole('button', { name: /next: select location/i }))

    // Map picker should now be visible
    expect(await screen.findByTestId('map-picker')).toBeInTheDocument()

    // Confirm location selection
    await userEvent.click(screen.getByText(/confirm/i))

    await waitFor(() => {
      expect(createAirportMock).toHaveBeenCalledWith({
        code: 'CCC',
        name: 'Charlie Airport',
        city: '',
        country: '',
        latitude: 10,
        longitude: 20,
      })
    })
  })

  it('deletes an airport after confirmation', async () => {
    render(<AirportManagement />)

    // Click the first Delete button (Alpha Airport)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    // Confirm deletion inside dialog
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => {
      expect(deleteAirportMock).toHaveBeenCalledWith('AAA')
    })
  })

  it('shows 3 airports by default', async () => {
    render(<AirportManagement />)
    expect(screen.getAllByTestId('airport-card')).toHaveLength(3)
  })

  it('shows more airports when clicking on the "Show All" button', async () => {
    render(<AirportManagement />)

    await userEvent.click(screen.getByRole('button', { name: /show all/i }))

    await waitFor(() => {
      expect(screen.getAllByTestId('airport-card')).toHaveLength(airportsMock.length)
    })
  })
}) 