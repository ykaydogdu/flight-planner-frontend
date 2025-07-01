import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Minus, ChevronDown } from 'lucide-react'
import type { PassengerSelection } from '@/types'

interface PassengerSelectorProps {
  value: PassengerSelection
  onChange: (selection: PassengerSelection) => void
  error?: string
}

export function PassengerSelector({ value, onChange, error }: PassengerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSelection, setTempSelection] = useState<PassengerSelection>(value)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const totalPassengers = value.economy + value.business + value.firstClass

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        // Auto-confirm changes when clicking outside
        const total = getTotalPassengers(tempSelection)
        if (total >= 1 && total <= 9) {
          onChange(tempSelection)
        }
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, tempSelection, onChange])

  const handleIncrement = (type: keyof PassengerSelection) => {
    const newValue = tempSelection[type] + 1
    if (getTotalPassengers({ ...tempSelection, [type]: newValue }) <= 9) {
      setTempSelection(prev => ({
        ...prev,
        [type]: newValue
      }))
    }
  }

  const handleDecrement = (type: keyof PassengerSelection) => {
    const newValue = Math.max(0, tempSelection[type] - 1)
    setTempSelection(prev => ({
      ...prev,
      [type]: newValue
    }))
  }

  const getTotalPassengers = (selection: PassengerSelection) => {
    return selection.economy + selection.business + selection.firstClass
  }



  const handleToggle = () => {
    if (!isOpen) {
      setTempSelection(value)
    }
    setIsOpen(!isOpen)
  }

  const tempTotal = getTotalPassengers(tempSelection)

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <Users className="h-4 w-4 mr-1" />
        Passengers
      </label>
      
      <div className="relative" ref={triggerRef}>
        <div
          className={`flex items-center justify-between cursor-pointer ${error ? 'border-red-500' : ''}`}
          onClick={handleToggle}
        >
          <Input
            value={`${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}`}
            readOnly
            className={`cursor-pointer pr-10 ${error ? 'border-red-500' : ''}`}
          />
          <ChevronDown 
            className={`absolute right-3 h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
        
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4"
          >
            <div className="space-y-4">
              {/* Economy Class */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Economy</div>
                  <div className="text-xs text-gray-500">Standard seating</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecrement('economy')}
                    disabled={tempSelection.economy === 0}
                    className="h-7 w-7 p-0"
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
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Business Class */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Business</div>
                  <div className="text-xs text-gray-500">Premium seating</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecrement('business')}
                    disabled={tempSelection.business === 0}
                    className="h-7 w-7 p-0"
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
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* First Class */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">First Class</div>
                  <div className="text-xs text-gray-500">Luxury seating</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecrement('firstClass')}
                    disabled={tempSelection.firstClass === 0}
                    className="h-7 w-7 p-0"
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
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total passengers:</span>
                  <span className={`font-medium ${tempTotal > 9 ? 'text-red-500' : tempTotal === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {tempTotal}
                  </span>
                </div>
                {tempTotal > 9 && (
                  <p className="text-xs text-red-500 mt-1">Maximum 9 passengers allowed</p>
                )}
                {tempTotal === 0 && (
                  <p className="text-xs text-red-500 mt-1">At least 1 passenger required</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 