'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Bed,
  Users,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Bath,
  Sofa,
  UtensilsCrossed,
  ConciergeBell,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore, type MockRoom } from '@/lib/store'
import { mockRooms, type MockBooking } from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  TV: Tv,
  'Air Conditioning': Wind,
  'Mini Bar': Coffee,
  Bathtub: Bath,
  Balcony: Sofa,
  Kitchen: UtensilsCrossed,
  'Living Area': Sofa,
  'Butler Service': ConciergeBell,
  'Jacuzzi': Bath,
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  occupied: { label: 'Occupied', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  maintenance: { label: 'Maintenance', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  out_of_service: { label: 'Out of Service', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const roomTypeLabels: Record<string, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  suite: 'Suite',
  family: 'Family',
  single: 'Single',
}

export function RoomsView() {
  const { rooms, bookings, addRoom, setShowNewRoomDialog } = useAppStore()

  const allRooms = rooms.length > 0 ? rooms : mockRooms
  const allBookings = bookings.length > 0 ? bookings : []

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [editDialog, setEditDialog] = useState<string | null>(null)
  const [newRoom, setNewRoom] = useState({
    name: '',
    number: '',
    type: 'standard' as MockRoom['type'],
    basePrice: 0,
    maxGuests: 2,
    floor: 1,
    description: '',
  })

  const handleAddRoom = () => {
    if (!newRoom.name || !newRoom.number) return
    const room: MockRoom = {
      id: `room-${Date.now()}`,
      hotelId: 'hotel-1',
      ...newRoom,
      amenities: ['WiFi', 'TV', 'Air Conditioning'],
      status: 'available',
    }
    addRoom(room)
    setShowAddDialog(false)
    setNewRoom({ name: '', number: '', type: 'standard', basePrice: 0, maxGuests: 2, floor: 1, description: '' })
  }

  const getRoomBookings = (roomId: string) => {
    return allBookings.filter(
      (b) => b.roomId === roomId && (b.status === 'confirmed' || b.status === 'checked_in')
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Room Management</h2>
          <p className="text-sm text-muted-foreground">
            {allRooms.length} room{allRooms.length !== 1 ? 's' : ''} · {allRooms.filter((r) => r.status === 'available').length} available
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allRooms.map((room) => {
          const config = statusConfig[room.status]
          const roomBookings = getRoomBookings(room.id)

          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * allRooms.indexOf(room) }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        {room.number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{room.name}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize', config.bg, config.color)}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        {roomTypeLabels[room.type]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {room.maxGuests}
                      </span>
                      <span>Floor {room.floor}</span>
                    </div>
                    <span className="text-lg font-bold">${room.basePrice}<span className="text-xs font-normal text-muted-foreground">/night</span></span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 4).map((amenity) => {
                      const Icon = amenityIcons[amenity]
                      return (
                        <Badge key={amenity} variant="secondary" className="text-[10px] gap-1">
                          {Icon && <Icon className="h-2.5 w-2.5" />}
                          {amenity}
                        </Badge>
                      )
                    })}
                    {room.amenities.length > 4 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{room.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Current bookings */}
                  {roomBookings.length > 0 && (
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        Active Bookings
                      </p>
                      {roomBookings.slice(0, 2).map((b) => {
                        const guest = allBookings.length > 0
                          ? { firstName: 'Guest', lastName: '' }
                          : null
                        return (
                          <div key={b.id} className="text-xs">
                            <span className="font-medium">{b.confirmationCode}</span>
                            <span className="text-muted-foreground">
                              {' '}{format(parseISO(b.checkIn), 'MMM d')} → {format(parseISO(b.checkOut), 'MMM d')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditDialog(room.id)}
                    >
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteDialog(room.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Add a new room to your hotel inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  placeholder="e.g., 401"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input
                  placeholder="e.g., Deluxe Ocean View"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select
                  value={newRoom.type}
                  onValueChange={(v) => setNewRoom({ ...newRoom, type: v as MockRoom['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price ($)</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={newRoom.basePrice || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, basePrice: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Guests</Label>
                <Input
                  type="number"
                  placeholder="2"
                  value={newRoom.maxGuests}
                  onChange={(e) => setNewRoom({ ...newRoom, maxGuests: parseInt(e.target.value) || 2 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of the room"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddRoom}
              disabled={!newRoom.name || !newRoom.number}
            >
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => setDeleteDialog(null)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Room editing is a placeholder in this demo. In a production app, this would allow full editing capabilities.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
