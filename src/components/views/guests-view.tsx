'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Star,
  Mail,
  Phone,
  ChevronRight,
  CalendarDays,
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
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function GuestsView() {
  const { guests, createGuest, fetchGuests, loading, currentHotelId } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchGuests()
    }
  }, [currentHotelId, fetchGuests])

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    idNumber: '',
    notes: '',
    vip: false,
  })

  // Debounced search — calls API after 300ms
  useEffect(() => {
    if (!currentHotelId) return
    const timer = setTimeout(() => {
      fetchGuests(searchQuery || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, currentHotelId, fetchGuests])

  const selectedGuest = guests.find((g) => g.id === selectedGuestId) || null

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
        idNumber: newGuest.idNumber || undefined,
        notes: newGuest.notes || undefined,
        vip: newGuest.vip,
      })

      if (result) {
        toast.success('Guest added successfully')
        setShowAddDialog(false)
        setNewGuest({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          nationality: '',
          idNumber: '',
          notes: '',
          vip: false,
        })
      } else {
        toast.error('Failed to add guest. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add guest')
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
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedGuestId(guest.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                            guest.vip
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {guest.firstName[0]}
                          {guest.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {guest.firstName} {guest.lastName}
                            </span>
                            {guest.vip && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1"
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
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

                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
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

      {/* Guest Detail Dialog */}
      <Dialog open={!!selectedGuestId} onOpenChange={() => setSelectedGuestId(null)}>
        <DialogContent className="max-w-lg">
          {selectedGuest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedGuest.firstName} {selectedGuest.lastName}
                  {selectedGuest.vip && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                      <Star className="mr-1 h-3 w-3 fill-amber-500" />
                      VIP
                    </Badge>
                  )}
                </DialogTitle>
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
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedGuest.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={newGuest.firstName}
                  onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Smith"
                  value={newGuest.lastName}
                  onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  placeholder="American"
                  value={newGuest.nationality}
                  onChange={(e) => setNewGuest({ ...newGuest, nationality: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                placeholder="Passport or ID number"
                value={newGuest.idNumber}
                onChange={(e) => setNewGuest({ ...newGuest, idNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Special requirements, preferences, etc."
                value={newGuest.notes}
                onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="vip-checkbox"
                checked={newGuest.vip}
                onCheckedChange={(checked) => setNewGuest({ ...newGuest, vip: !!checked })}
              />
              <Label htmlFor="vip-checkbox" className="text-sm font-medium cursor-pointer">
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
              {submitting ? 'Adding...' : 'Add Guest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
