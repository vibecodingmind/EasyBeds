'use client'

import React, { useState, useEffect } from 'react'
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
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { useAppStore } from '@/lib/store'
import { parseAmenities, deriveRoomStatus } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  Jacuzzi: Bath,
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  occupied: { label: 'Occupied', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
}

const roomTypeLabels: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  twin: 'Twin',
  suite: 'Suite',
  dormitory: 'Dormitory',
  family: 'Family',
  standard: 'Standard',
  deluxe: 'Deluxe',
}

export function RoomsView() {
  const { rooms, createRoom, fetchRooms, loading, currentHotelId, hotel } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchRooms()
    }
  }, [currentHotelId, fetchRooms])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: '',
    roomNumber: '',
    type: 'double',
    basePrice: 0,
    maxGuests: 2,
    description: '',
    amenities: '',
  })

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.roomNumber) return
    setSubmitting(true)
    try {
      const amenitiesArray = newRoom.amenities
        ? newRoom.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

      const result = await createRoom({
        name: newRoom.name,
        roomNumber: newRoom.roomNumber,
        type: newRoom.type,
        basePrice: newRoom.basePrice,
        maxGuests: newRoom.maxGuests,
        description: newRoom.description || undefined,
        amenities: amenitiesArray,
      })

      if (result) {
        toast.success('Room added successfully')
        setShowAddDialog(false)
        setNewRoom({
          name: '',
          roomNumber: '',
          type: 'double',
          basePrice: 0,
          maxGuests: 2,
          description: '',
          amenities: '',
        })
      } else {
        toast.error('Failed to add room. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add room')
    } finally {
      setSubmitting(false)
    }
  }

  const currencySymbol = hotel?.currency === 'EUR' ? '€' : hotel?.currency === 'GBP' ? '£' : '$'

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
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {rooms.filter((r) => deriveRoomStatus(r._count?.bookings || 0) === 'available').length} available
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
      {loading.rooms && rooms.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, idx) => {
            const bookingCount = room._count?.bookings || 0
            const status = deriveRoomStatus(bookingCount)
            const config = statusConfig[status]
            const amenities = parseAmenities(room.amenities)

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          {room.roomNumber}
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
                          {roomTypeLabels[room.type] || room.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {room.maxGuests}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {bookingCount}
                        </span>
                      </div>
                      <span className="text-lg font-bold">
                        {currencySymbol}{room.basePrice}
                        <span className="text-xs font-normal text-muted-foreground">/night</span>
                      </span>
                    </div>

                    {/* Description */}
                    {room.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.slice(0, 4).map((amenity) => {
                          const Icon = amenityIcons[amenity]
                          return (
                            <Badge key={amenity} variant="secondary" className="text-[10px] gap-1">
                              {Icon && <Icon className="h-2.5 w-2.5" />}
                              {amenity}
                            </Badge>
                          )
                        })}
                        {amenities.length > 4 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
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
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
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
                  onValueChange={(v) => setNewRoom({ ...newRoom, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="twin">Twin</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Price ({currencySymbol})</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={newRoom.basePrice || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, basePrice: parseInt(e.target.value) || 0 })}
                />
              </div>
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
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the room"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Amenities</Label>
              <Input
                placeholder="WiFi, TV, Air Conditioning, Mini Bar"
                value={newRoom.amenities}
                onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Separate amenities with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddRoom}
              disabled={submitting || !newRoom.name || !newRoom.roomNumber}
            >
              {submitting ? 'Adding...' : 'Add Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
