'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Star,
  Mail,
  Phone,
  Globe,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type MockGuest } from '@/lib/store'
import {
  mockGuests,
  mockBookings,
  getBookingsForGuest,
  getRoomById,
  getChannelById,
  type MockBooking,
} from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function GuestsView() {
  const { guests, bookings, addGuest } = useAppStore()

  const allGuests = guests.length > 0 ? guests : mockGuests
  const allBookings = bookings.length > 0 ? bookings : mockBookings

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<MockGuest | null>(null)
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    idNumber: '',
  })

  const filteredGuests = useMemo(() => {
    return allGuests.filter((g) => {
      const query = searchQuery.toLowerCase()
      return (
        !query ||
        g.firstName.toLowerCase().includes(query) ||
        g.lastName.toLowerCase().includes(query) ||
        g.email.toLowerCase().includes(query) ||
        g.phone.includes(query) ||
        g.nationality.toLowerCase().includes(query)
      )
    })
  }, [allGuests, searchQuery])

  const handleAddGuest = () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.email) return
    const guest: MockGuest = {
      id: `guest-${Date.now()}`,
      ...newGuest,
      vip: false,
      totalStays: 0,
      totalSpent: 0,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    }
    addGuest(guest)
    setShowAddDialog(false)
    setNewGuest({ firstName: '', lastName: '', email: '', phone: '', nationality: '', idNumber: '' })
  }

  const getGuestBookings = (guestId: string) => {
    return allBookings.filter((b) => b.guestId === guestId)
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
            {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} · {allGuests.filter((g) => g.vip).length} VIP
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGuests.map((guest) => {
          const guestBookings = getGuestBookings(guest.id)
          return (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * filteredGuests.indexOf(guest) }}
            >
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedGuest(guest)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                          guest.vip
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-muted text-muted-foreground'
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
                          {guest.nationality}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{guest.phone}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                    <span className="text-muted-foreground">
                      {guest.totalStays} stay{guest.totalStays !== 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold">
                      ${guest.totalSpent.toLocaleString()} total
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Guest Detail Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
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
                <DialogDescription>Guest profile and booking history</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Contact Info */}
                <div className="rounded-lg border p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Contact Information
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedGuest.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedGuest.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {selectedGuest.nationality} · ID: {selectedGuest.idNumber}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">{selectedGuest.totalStays}</p>
                    <p className="text-xs text-muted-foreground">Total Stays</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">${selectedGuest.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">
                      {getGuestBookings(selectedGuest.id).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedGuest.notes && (
                  <div className="rounded-lg border p-3">
                    <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      Notes
                    </h4>
                    <p className="text-sm">{selectedGuest.notes}</p>
                  </div>
                )}

                {/* Booking History */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Booking History
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getGuestBookings(selectedGuest.id).length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No bookings found for this guest in current data
                      </p>
                    ) : (
                      getGuestBookings(selectedGuest.id)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((b) => {
                          const room = getRoomById(b.roomId)
                          const channel = getChannelById(b.channel)
                          return (
                            <div
                              key={b.id}
                              className="flex items-center justify-between rounded-lg border p-2.5"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {b.confirmationCode}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] capitalize',
                                      b.status === 'confirmed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                      b.status === 'checked_in' && 'bg-blue-50 text-blue-700 border-blue-200',
                                      b.status === 'checked_out' && 'bg-gray-50 text-gray-600 border-gray-200',
                                      b.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                                      b.status === 'cancelled' && 'bg-red-50 text-red-700 border-red-200',
                                    )}
                                  >
                                    {b.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Room {room?.number} · {format(parseISO(b.checkIn), 'MMM d')} → {format(parseISO(b.checkOut), 'MMM d')}
                                  {channel && ` · ${channel.name}`}
                                </div>
                              </div>
                              <span className="text-sm font-semibold">${b.totalPrice}</span>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Guest Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddGuest}
              disabled={!newGuest.firstName || !newGuest.lastName || !newGuest.email}
            >
              Add Guest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
