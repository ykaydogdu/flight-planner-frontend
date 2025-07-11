import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import type { PassengerSelection } from '@/types'

interface PassengerSelectorProps {
  value: PassengerSelection
  onChange: (selection: PassengerSelection) => void
  error?: string
  isOpen: boolean
  onClose: () => void
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function PassengerSelector({ value, onChange, error, isOpen, onClose, containerRef }: PassengerSelectorProps) {
  const [tempSelection, setTempSelection] = useState<PassengerSelection>(value)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update temp selection when value changes
  useEffect(() => {
    if (isOpen) {
      setTempSelection(value)
    }
  }, [value, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          containerRef?.current && !containerRef.current.contains(event.target as Node)) {
        // Auto-confirm changes when clicking outside
        const total = getTotalPassengers(tempSelection)
        if (total >= 1 && total <= 9) {
          onChange(tempSelection)
        }
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, tempSelection, onChange, onClose, containerRef])

  const handleIncrement = (type: keyof PassengerSelection) => {
    const newValue = tempSelection[type] + 1
    if (getTotalPassengers({ ...tempSelection, [type]: newValue }) <= 9) {
      setTempSelection((prev: PassengerSelection) => ({
        ...prev,
        [type]: newValue
      }))
    }
  }

  const handleDecrement = (type: keyof PassengerSelection) => {
    const newValue = Math.max(0, tempSelection[type] - 1)
    setTempSelection((prev: PassengerSelection) => ({
      ...prev,
      [type]: newValue
    }))
  }

  const getTotalPassengers = (selection: PassengerSelection) => {
    return selection.economy + selection.business + selection.firstClass
  }

  const handleConfirm = () => {
    const total = getTotalPassengers(tempSelection)
    if (total >= 1 && total <= 9) {
      onChange(tempSelection)
      onClose()
    }
  }

  const tempTotal = getTotalPassengers(tempSelection)

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-card border border-app rounded-md shadow-lg z-50 p-4"
    >
      <div className="space-y-4">
        {/* Economy Class */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Economy</div>
            <div className="text-xs text-secondary-foreground">Standard seating</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecrement('economy')}
              disabled={tempSelection.economy === 0}
              className="h-7 w-7 p-0"
              data-testid="economy-minus-button"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{tempSelection.economy}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleIncrement('economy')}
              disabled={tempTotal >= 9}
              className="h-7 w-7 p-0"
              data-testid="economy-plus-button"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Business Class */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Business</div>
            <div className="text-xs text-secondary-foreground">Premium seating</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecrement('business')}
              disabled={tempSelection.business === 0}
              className="h-7 w-7 p-0"
              data-testid="business-minus-button"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{tempSelection.business}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleIncrement('business')}
              disabled={tempTotal >= 9}
              className="h-7 w-7 p-0"
              data-testid="business-plus-button"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* First Class */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">First Class</div>
            <div className="text-xs text-secondary-foreground">Luxury seating</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecrement('firstClass')}
              disabled={tempSelection.firstClass === 0}
              className="h-7 w-7 p-0"
              data-testid="first-class-minus-button"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{tempSelection.firstClass}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleIncrement('firstClass')}
              disabled={tempTotal >= 9}
              className="h-7 w-7 p-0"
              data-testid="first-class-plus-button"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-secondary-foreground">Total passengers:</span>
            <span className={`font-medium ${tempTotal > 9 ? 'text-red-500' : tempTotal === 0 ? 'text-red-500' : 'text-secondary-foreground'}`}>
              {tempTotal}
            </span>
          </div>
          {tempTotal > 9 && (
            <p className="text-xs text-red-500 mt-1">Maximum 9 passengers allowed</p>
          )}
          {tempTotal === 0 && (
            <p className="text-xs text-red-500 mt-1">At least 1 passenger required</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
          
          {/* Confirm button for complex interactions */}
          <div className="flex justify-end mt-3">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={tempTotal === 0 || tempTotal > 9}
              className="px-4"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 