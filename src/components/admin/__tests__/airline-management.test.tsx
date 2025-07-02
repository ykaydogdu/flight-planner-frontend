import { render, screen, waitFor } from '@testing-library/react'
import { AirlineManagement } from '../airline-management'
import { vi } from 'vitest'
import type { Airline } from '@/types'
import userEvent from '@testing-library/user-event'

const createAirlineMock = vi.fn(() => Promise.resolve())
const deleteAirlineMock = vi.fn(() => Promise.resolve())

const airlinesMock: Airline[] = [
  { code: 'AA', name: 'Alpha Air', staffCount: 10 },
  { code: 'BB', name: 'Beta Air', staffCount: 20 },
]

// Stub window.alert to silence pop-ups during tests
window.alert = vi.fn()

vi.mock('@/store/airlines', () => ({
  useAirlineStore: () => ({
    airlines: airlinesMock,
    loading: false,
    createAirline: createAirlineMock,
    deleteAirline: deleteAirlineMock,
  }),
}))

describe('AirlineManagement', () => {
  it('renders existing airlines', () => {
    render(<AirlineManagement />)
    expect(screen.getByText(/existing airlines/i)).toBeInTheDocument()
    expect(screen.getByText(/alpha air/i)).toBeInTheDocument()
    expect(screen.getByText(/beta air/i)).toBeInTheDocument()
  })

  it('creates a new airline on form submit', async () => {
    render(<AirlineManagement />)

    await userEvent.type(screen.getByPlaceholderText(/airline code/i), 'CC')
    await userEvent.type(screen.getByPlaceholderText(/airline name/i), 'Charlie Air')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(createAirlineMock).toHaveBeenCalledWith({ code: 'CC', name: 'Charlie Air', staffCount: 0 })
    })
  })

  it('deletes an airline after confirmation', async () => {
    render(<AirlineManagement />)

    // Click first Delete button (for Alpha Air)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    // Dialog opens; confirm deletion by clicking Delete inside dialog
    const confirmButton = await screen.findAllByRole('button', { name: /^delete$/i })
    await userEvent.click(confirmButton[confirmButton.length - 1])

    await waitFor(() => {
      expect(deleteAirlineMock).toHaveBeenCalledWith('AA')
    })
  })
}) 