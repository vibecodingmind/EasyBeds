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
  Pencil,
  Trash2,
  Loader2,
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
import { useAppStore, type ApiRoom } from '@/lib/store'
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

const bedTypeOptions = [
  { value: 'single', label: 'Single Bed' },
  { value: 'double', label: 'Double Bed' },
  { value: 'twin', label: 'Twin Beds' },
  { value: 'queen', label: 'Queen Bed' },
  { value: 'king', label: 'King Bed' },
  { value: 'sofa_bed', label: 'Sofa Bed' },
]

const roomTypeOptions = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'twin', label: 'Twin' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Family' },
  { value: 'dormitory', label: 'Dormitory' },
]

interface RoomFormData {
  name: string
  roomNumber: string
  type: string
  basePrice: number
  maxGuests: number
  description: string
  amenities: string
  floor: number
  bedType: string
}

const defaultFormData: RoomFormData = {
  name: '',
  roomNumber: '',
  type: 'double',
  basePrice: 0,
  maxGuests: 2,
  description: '',
  amenities: '',
  floor: 1,
  bedType: 'double',
}

function roomToFormData(room: ApiRoom): RoomFormData {
  return {
    name: room.name,
    roomNumber: room.roomNumber,
    type: room.type,
    basePrice: room.basePrice,
    maxGuests: room.maxGuests,
    description: room.description || '',
    amenities: parseAmenities(room.amenities).join(', '),
    floor: room.floor || 1,
    bedType: room.bedType || 'double',
  }
}

export function RoomsView() {
  const { rooms, createRoom, updateRoom, deleteRoom, fetchRooms, loading, currentHotelId, hotel } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchRooms()
    }
  }, [currentHotelId, fetchRooms])

  // ── Add Room Dialog State ──
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [newRoom, setNewRoom] = useState<RoomFormData>(defaultFormData)

  // ── Edit Room Dialog State ──
  const [editingRoom, setEditingRoom] = useState<ApiRoom | null>(null)
  const [editForm, setEditForm] = useState<RoomFormData>(defaultFormData)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── Delete Room Dialog State ──
  const [deletingRoom, setDeletingRoom] = useState<ApiRoom | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const currencySymbol = hotel?.currency === 'EUR' ? '€' : hotel?.currency === 'GBP' ? '£' : '$'

  // ── Add Room Handler ──
  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.roomNumber) return
    setAddSubmitting(true)
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
        floor: newRoom.floor,
        bedType: newRoom.bedType || undefined,
      })

      if (result) {
        toast.success('Room added successfully')
        setShowAddDialog(false)
        setNewRoom(defaultFormData)
      } else {
        toast.error('Failed to add room. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add room')
    } finally {
      setAddSubmitting(false)
    }
  }

  // ── Edit Room Handlers ──
  const handleOpenEdit = (room: ApiRoom) => {
    setEditingRoom(room)
    setEditForm(roomToFormData(room))
  }

  const handleCloseEdit = () => {
    setEditingRoom(null)
    setEditForm(defaultFormData)
  }

  const handleEditRoom = async () => {
    if (!editingRoom || !editForm.name || !editForm.roomNumber) return
    setEditSubmitting(true)
    try {
      const amenitiesArray = editForm.amenities
        ? editForm.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

      const result = await updateRoom(editingRoom.id, {
        name: editForm.name,
        roomNumber: editForm.roomNumber,
        type: editForm.type,
        basePrice: editForm.basePrice,
        maxGuests: editForm.maxGuests,
        description: editForm.description || undefined,
        amenities: amenitiesArray,
        floor: editForm.floor,
        bedType: editForm.bedType || undefined,
      })

      if (result) {
        toast.success('Room updated successfully')
        handleCloseEdit()
      } else {
        toast.error('Failed to update room. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update room')
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Delete Room Handler ──
  const handleDeleteRoom = async () => {
    if (!deletingRoom) return
    setDeleteSubmitting(true)
    try {
      const success = await deleteRoom(deletingRoom.id)
      if (success) {
        toast.success('Room deleted successfully')
        setDeletingRoom(null)
      } else {
        toast.error('Failed to delete room. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete room')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // ── Shared Room Form ──
  const RoomFormFields = ({
    form,
    setForm,
    disabled,
  }: {
    form: RoomFormData
    setForm: React.Dispatch<React.SetStateAction<RoomFormData>>
    disabled?: boolean
  }) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Room Number</Label>
          <Input
            placeholder="e.g., 401"
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Room Name</Label>
          <Input
            placeholder="e.g., Deluxe Ocean View"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Room Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roomTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Base Price ({currencySymbol})</Label>
          <Input
            type="number"
            placeholder="150"
            value={form.basePrice || ''}
            onChange={(e) => setForm({ ...form, basePrice: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Guests</Label>
          <Input
            type="number"
            placeholder="2"
            value={form.maxGuests}
            onChange={(e) => setForm({ ...form, maxGuests: parseInt(e.target.value) || 2 })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Floor</Label>
          <Input
            type="number"
            placeholder="1"
            value={form.floor || ''}
            onChange={(e) => setForm({ ...form, floor: parseInt(e.target.value) || 1 })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bed Type</Label>
        <Select
          value={form.bedType}
          onValueChange={(v) => setForm({ ...form, bedType: v })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bed type" />
          </SelectTrigger>
          <SelectContent>
            {bedTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Brief description of the room"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label>Amenities</Label>
        <Input
          placeholder="WiFi, TV, Air Conditioning, Mini Bar"
          value={form.amenities}
          onChange={(e) => setForm({ ...form, amenities: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Separate amenities with commas
        </p>
      </div>
    </div>
  )

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
                      <div className="min-w-0 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          {room.roomNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{room.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn('text-xs capitalize', config.bg, config.color)}
                        >
                          {config.label}
                        </Badge>
                      </div>
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1 border-t mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(room)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeletingRoom(room)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Add a new room to your hotel inventory</DialogDescription>
          </DialogHeader>
          <RoomFormFields form={newRoom} setForm={setNewRoom} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddRoom}
              disabled={addSubmitting || !newRoom.name || !newRoom.roomNumber}
            >
              {addSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Room'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Room
            </DialogTitle>
            <DialogDescription>
              Update the details for {editingRoom?.roomNumber} — {editingRoom?.name}
            </DialogDescription>
          </DialogHeader>
          <RoomFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleEditRoom}
              disabled={editSubmitting || !editForm.name || !editForm.roomNumber}
            >
              {editSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!deletingRoom} onOpenChange={(open) => !open && setDeletingRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete room{' '}
                  <span className="font-semibold">{deletingRoom?.roomNumber} — {deletingRoom?.name}</span>?
                  This action will deactivate the room and remove it from your active inventory.
                </p>
                {(deletingRoom?._count?.bookings ?? 0) > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">
                      ⚠ This room has {deletingRoom?._count?.bookings} booking(s) on record.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Existing bookings will not be affected, but no new bookings can be made for this room.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteRoom}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Room
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
