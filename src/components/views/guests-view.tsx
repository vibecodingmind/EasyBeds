'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Star,
  Mail,
  Phone,
  ChevronRight,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ID_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'other', label: 'Other' },
]

interface GuestFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  idType: string
  idNumber: string
  notes: string
  vip: boolean
}

const emptyFormData: GuestFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationality: '',
  idType: '',
  idNumber: '',
  notes: '',
  vip: false,
}

function guestToFormData(guest: {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  nationality: string | null
  idType: string | null
  idNumber: string | null
  notes: string | null
  vip: boolean
}): GuestFormData {
  return {
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email || '',
    phone: guest.phone || '',
    nationality: guest.nationality || '',
    idType: guest.idType || '',
    idNumber: guest.idNumber || '',
    notes: guest.notes || '',
    vip: guest.vip,
  }
}

export function GuestsView() {
  const { guests, createGuest, updateGuest, deleteGuest, fetchGuests, loading, currentHotelId } =
    useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchGuests()
    }
  }, [currentHotelId, fetchGuests])

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newGuest, setNewGuest] = useState<GuestFormData>({ ...emptyFormData })
  const [editForm, setEditForm] = useState<GuestFormData>({ ...emptyFormData })

  // Debounced search — calls API after 300ms
  useEffect(() => {
    if (!currentHotelId) return
    const timer = setTimeout(() => {
      fetchGuests(searchQuery || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, currentHotelId, fetchGuests])

  const selectedGuest = guests.find((g) => g.id === selectedGuestId) || null

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setEditForm({ ...emptyFormData })
  }, [])

  const openDetailDialog = useCallback((guestId: string) => {
    setSelectedGuestId(guestId)
    setIsEditing(false)
  }, [])

  const closeDetailDialog = useCallback(() => {
    setSelectedGuestId(null)
    resetEditState()
  }, [resetEditState])

  const openEditMode = useCallback(() => {
    if (selectedGuest) {
      setEditForm(guestToFormData(selectedGuest))
      setIsEditing(true)
    }
  }, [selectedGuest])

  const handleAddGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName) return
    setSubmitting(true)
    try {
      const result = await createGuest({
        firstName: newGuest.firstName,
        lastName: newGuest.lastName,
        email: newGuest.email || undefined,
        phone: newGuest.phone || undefined,
        nationality: newGuest.nationality || undefined,
        idType: newGuest.idType || undefined,
        idNumber: newGuest.idNumber || undefined,
        notes: newGuest.notes || undefined,
        vip: newGuest.vip,
      })

      if (result) {
        toast.success('Guest added successfully')
        setShowAddDialog(false)
        setNewGuest({ ...emptyFormData })
      } else {
        toast.error('Failed to add guest. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add guest')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateGuest = async () => {
    if (!selectedGuest || !editForm.firstName || !editForm.lastName) return
    setSubmitting(true)
    try {
      const result = await updateGuest(selectedGuest.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        nationality: editForm.nationality || undefined,
        idType: editForm.idType || undefined,
        idNumber: editForm.idNumber || undefined,
        notes: editForm.notes || undefined,
        vip: editForm.vip,
      })

      if (result) {
        toast.success('Guest updated successfully')
        setIsEditing(false)
      } else {
        toast.error('Failed to update guest. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update guest')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return
    setSubmitting(true)
    try {
      const success = await deleteGuest(selectedGuest.id)
      if (success) {
        toast.success('Guest deleted successfully')
        setShowDeleteDialog(false)
        closeDetailDialog()
      } else {
        toast.error('Failed to delete guest. Please try again.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete guest'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
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
          <h2 className="text-lg font-semibold">Guest Directory</h2>
          <p className="text-sm text-muted-foreground">
            {guests.length} guest{guests.length !== 1 ? 's' : ''} · {guests.filter((g) => g.vip).length} VIP
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guests by name, email, phone..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Guest Cards */}
      {loading.guests && guests.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guests.map((guest, idx) => {
            const stayCount = guest._count?.bookings || 0
            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * idx }}
              >
                <Card className="group transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex flex-1 cursor-pointer items-center gap-3"
                        onClick={() => openDetailDialog(guest.id)}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                            guest.vip
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {guest.firstName[0]}
                          {guest.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">
                              {guest.firstName} {guest.lastName}
                            </span>
                            {guest.vip && (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-amber-300 bg-amber-50 px-1 text-[10px] text-amber-700"
                              >
                                <Star className="mr-0.5 h-2.5 w-2.5 fill-amber-500" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {guest.nationality || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons on the right */}
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetailDialog(guest.id)
                            // We need to set editing after the guest is selected
                            setTimeout(() => {
                              setEditForm(guestToFormData(guest))
                              setIsEditing(true)
                            }, 0)
                          }}
                          aria-label="Edit guest"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGuestId(guest.id)
                            setShowDeleteDialog(true)
                          }}
                          aria-label="Delete guest"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div
                      className="mt-3 cursor-pointer space-y-1.5 text-sm text-muted-foreground"
                      onClick={() => openDetailDialog(guest.id)}
                    >
                      {guest.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{guest.email}</span>
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{guest.phone}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="mt-3 flex cursor-pointer items-center justify-between border-t pt-3 text-xs"
                      onClick={() => openDetailDialog(guest.id)}
                    >
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {stayCount} stay{stayCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Guest Detail / Edit Dialog */}
      <Dialog
        open={!!selectedGuestId}
        onOpenChange={(open) => {
          if (!open) closeDetailDialog()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AnimatePresence mode="wait">
            {selectedGuest && (
              <>
                {isEditing ? (
                  /* ─── Edit Mode ─── */
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-emerald-600" />
                        Edit Guest
                      </DialogTitle>
                      <DialogDescription>
                        Update {selectedGuest.firstName} {selectedGuest.lastName}&apos;s profile
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName">First Name *</Label>
                          <Input
                            id="edit-firstName"
                            placeholder="John"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName">Last Name *</Label>
                          <Input
                            id="edit-lastName"
                            placeholder="Smith"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="john@example.com"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-phone">Phone</Label>
                          <Input
                            id="edit-phone"
                            placeholder="+1 (555) 123-4567"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-nationality">Nationality</Label>
                          <Input
                            id="edit-nationality"
                            placeholder="American"
                            value={editForm.nationality}
                            onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-idType">ID Type</Label>
                          <Select
                            value={editForm.idType}
                            onValueChange={(val) => setEditForm({ ...editForm, idType: val })}
                          >
                            <SelectTrigger id="edit-idType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ID_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-idNumber">ID Number</Label>
                          <Input
                            id="edit-idNumber"
                            placeholder="Passport or ID number"
                            value={editForm.idNumber}
                            onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                          id="edit-notes"
                          placeholder="Special requirements, preferences, etc."
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="edit-vip-checkbox"
                          checked={editForm.vip}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, vip: !!checked })}
                        />
                        <Label htmlFor="edit-vip-checkbox" className="cursor-pointer text-sm font-medium">
                          VIP Guest
                        </Label>
                      </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleUpdateGuest}
                        disabled={submitting || !editForm.firstName || !editForm.lastName}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </DialogFooter>
                  </motion.div>
                ) : (
                  /* ─── View Mode ─── */
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                          {selectedGuest.firstName} {selectedGuest.lastName}
                          {selectedGuest.vip && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                              <Star className="mr-1 h-3 w-3 fill-amber-500" />
                              VIP
                            </Badge>
                          )}
                        </DialogTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
                            onClick={openEditMode}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <DialogDescription>Guest profile details</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      {/* Contact Info */}
                      <div className="rounded-lg border p-3">
                        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Contact Information
                        </h4>
                        <div className="grid gap-2 text-sm">
                          {selectedGuest.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {selectedGuest.email}
                            </div>
                          )}
                          {selectedGuest.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {selectedGuest.phone}
                            </div>
                          )}
                          {(selectedGuest.nationality || selectedGuest.idNumber) && (
                            <div className="text-sm text-muted-foreground">
                              {selectedGuest.nationality || ''}{selectedGuest.nationality && selectedGuest.idNumber ? ' · ' : ''}ID: {selectedGuest.idNumber || '—'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stay Stats */}
                      <div className="rounded-lg border p-3">
                        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Stay Statistics
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {selectedGuest._count?.bookings || 0} total stay{(selectedGuest._count?.bookings || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedGuest.notes && (
                        <div className="rounded-lg border p-3">
                          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            Notes
                          </h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {selectedGuest.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Guest
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {selectedGuest?.firstName} {selectedGuest?.lastName}
              </span>
              ? This action cannot be undone.
              {selectedGuest && (selectedGuest._count?.bookings || 0) > 0 && (
                <span className="mt-2 block rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  This guest has {(selectedGuest._count?.bookings || 0)} booking(s) and cannot be deleted.
                  Deactivating is recommended instead.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteGuest}
              disabled={
                submitting ||
                !selectedGuest ||
                (selectedGuest._count?.bookings || 0) > 0
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Guest'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Guest Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
            <DialogDescription>Add a new guest to your directory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">First Name</Label>
                <Input
                  id="add-firstName"
                  placeholder="John"
                  value={newGuest.firstName}
                  onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Last Name</Label>
                <Input
                  id="add-lastName"
                  placeholder="Smith"
                  value={newGuest.lastName}
                  onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="john@example.com"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  placeholder="+1 (555) 123-4567"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-nationality">Nationality</Label>
                <Input
                  id="add-nationality"
                  placeholder="American"
                  value={newGuest.nationality}
                  onChange={(e) => setNewGuest({ ...newGuest, nationality: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-idNumber">ID Number</Label>
              <Input
                id="add-idNumber"
                placeholder="Passport or ID number"
                value={newGuest.idNumber}
                onChange={(e) => setNewGuest({ ...newGuest, idNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                placeholder="Special requirements, preferences, etc."
                value={newGuest.notes}
                onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="add-vip-checkbox"
                checked={newGuest.vip}
                onCheckedChange={(checked) => setNewGuest({ ...newGuest, vip: !!checked })}
              />
              <Label htmlFor="add-vip-checkbox" className="cursor-pointer text-sm font-medium">
                VIP Guest
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddGuest}
              disabled={submitting || !newGuest.firstName || !newGuest.lastName}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Guest'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
