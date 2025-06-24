import { useState } from 'react'
import { useAirlineStore } from '@/store/airlines'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import type { Airline } from '@/types'

export function AirlineManagement() {
  const { airlines, loading, createAirline, deleteAirline } = useAirlineStore()
  const [newAirline, setNewAirline] = useState<Omit<Airline, 'id'>>({
    code: '',
    name: ''
  })
  const [creating, setCreating] = useState(false)

  const handleCreateAirline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAirline.code.trim() || !newAirline.name.trim()) {
      alert('Please fill in all fields')
      return
    }

    setCreating(true)
    try {
      await createAirline(newAirline)
      setNewAirline({ code: '', name: '' })
      alert('Airline created successfully!')
    } catch (error) {
      console.error('Error creating airline:', error)
      alert('Failed to create airline. Code might already exist.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAirline = async (code: string) => {
    try {
      await deleteAirline(code)
      alert('Airline deleted successfully!')
    } catch (error) {
      console.error('Error deleting airline:', error)
      alert('Failed to delete airline. It might be in use.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✈️ Airline Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Create New Airline Form */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-3">Create New Airline</h3>
          <form onSubmit={handleCreateAirline} className="flex gap-3">
            <Input
              placeholder="Airline Code (e.g., AA)"
              value={newAirline.code}
              onChange={(e) => setNewAirline({ ...newAirline, code: e.target.value.toUpperCase() })}
              className="w-48"
              maxLength={3}
              required
            />
            <Input
              placeholder="Airline Name (e.g., American Airlines)"
              value={newAirline.name}
              onChange={(e) => setNewAirline({ ...newAirline, name: e.target.value })}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </div>

        {/* Airlines List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Existing Airlines ({airlines.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading airlines...</div>
          ) : airlines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No airlines found</div>
          ) : (
            <div className="grid gap-3">
              {airlines.map((airline) => (
                <div key={airline.code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {airline.code}
                    </Badge>
                    <span className="font-medium">{airline.name}</span>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Airline</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete airline "{airline.name}" ({airline.code})? 
                          This action cannot be undone and may affect existing flights and user assignments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteAirline(airline.code)}>
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
      </CardContent>
    </Card>
  )
} 