import { useState } from 'react'
import { useUserStore } from '@/store/user'
import { useAirlineStore } from '@/store/airlines'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { motion } from 'motion/react'
import type { User } from '@/types'

export function UserManagement() {
  const { users, loading, assignRole, assignAirline } = useUserStore()
  const { airlines } = useAirlineStore()
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: string }>({})
  const [selectedAirline, setSelectedAirline] = useState<{ [key: string]: string }>({})

  const handleRoleAssignment = async (username: string, role: string) => {
    try {
      await assignRole(username, role)

      // Business logic: If changing from AIRLINE_STAFF to another role, clear airline assignment
      if (role !== 'ROLE_AIRLINE_STAFF') {
        const user = users.find(u => u.username === username)
        if (user?.airline) {
          await assignAirline(username, '') // Clear airline
        }
      }

      // Clear selection
      setSelectedRole({ ...selectedRole, [username]: '' })
      alert('Role assigned successfully!')
    } catch (error) {
      console.error('Error assigning role:', error)
      alert('Failed to assign role')
    }
  }

  const handleAirlineAssignment = async (username: string, airlineCode: string) => {
    try {
      const user = users.find(u => u.username === username)

      // Business logic: Ensure user has AIRLINE_STAFF role when assigning airline
      if (user?.role !== 'ROLE_AIRLINE_STAFF' && airlineCode) {
        await assignRole(username, 'ROLE_AIRLINE_STAFF')
      }

      await assignAirline(username, airlineCode)

      // Clear selection
      setSelectedAirline({ ...selectedAirline, [username]: '' })
      alert('Airline assigned successfully!')
    } catch (error) {
      console.error('Error assigning airline:', error)
      alert('Failed to assign airline')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'bg-red-100 text-red-800'
      case 'ROLE_AIRLINE_STAFF': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationWarning = (user: User) => {
    if (user.role === 'ROLE_AIRLINE_STAFF' && !user.airline) {
      return 'Airline staff without assigned airline'
    }
    if (user.role !== 'ROLE_AIRLINE_STAFF' && user.airline) {
      return 'Non-staff user with assigned airline'
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading users...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👥 User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const warning = getValidationWarning(user)

            return (
              <div key={user.username} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{user.username}</h3>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('ROLE_', '')}
                    </Badge>
                    {user.airline && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        🏢 {user.airline.name}
                      </Badge>
                    )}
                    {warning && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        ⚠️ Warning
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {warning && (
                    <p className="text-sm text-red-600 mt-1">{warning}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Airline Assignment */}
                  {user.role === 'ROLE_AIRLINE_STAFF' && (
                    <div className="flex items-center gap-2">
                      <motion.div layout>
                        <Select onValueChange={(value) => setSelectedAirline({ ...selectedAirline, [user.username]: value })} defaultValue={user.airline?.code || ''}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Change airline..." />
                          </SelectTrigger>
                          <SelectContent>
                            {airlines.map(airline => (
                              <SelectItem key={airline.code} value={airline.code}>{airline.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {selectedAirline[user.username] !== undefined && selectedAirline[user.username] !== (user.airline?.code || '') && (
                        <motion.div
                          key="assign-button"
                          layout
                          initial={{ opacity: 0, scale: 0.8, x: -20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -20 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm">Assign</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Airline Assignment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to assign airline {selectedAirline[user.username] || 'None'} to {user.username}?
                                  {selectedAirline[user.username] && user.role !== 'ROLE_AIRLINE_STAFF' && (
                                    <span className="text-blue-600"> This will also change their role to Airline Staff.</span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAirlineAssignment(user.username, selectedAirline[user.username])}>
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* Role Assignment */}
                  <div className="flex items-center gap-2">
                    <motion.div layout>
                      <Select onValueChange={(value) => setSelectedRole({ ...selectedRole, [user.username]: value })} defaultValue={user.role}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Change role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ROLE_USER">User</SelectItem>
                          <SelectItem value="ROLE_AIRLINE_STAFF">Airline Staff</SelectItem>
                          <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    {selectedRole[user.username] && selectedRole[user.username] !== user.role && (
                      <motion.div
                        key="assign-button"
                        layout
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">Assign</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Role Assignment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to assign the role {selectedRole[user.username].replace('ROLE_', '')} to {user.username}?
                                {selectedRole[user.username] !== 'ROLE_AIRLINE_STAFF' && user.airline && (
                                  <span className="text-red-600"> This will also remove their airline assignment.</span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRoleAssignment(user.username, selectedRole[user.username])}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 