'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  Eye,
  LogIn,
  LogOut,
  XCircle,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore, type BookingStatus } from '@/lib/store'
import {
  mockBookings,
  mockChannels,
  getGuestById,
  getRoomById,
  getChannelById,
  type MockBooking,
} from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export function BookingsView() {
  const {
    bookings,
    selectedBookingId,
    setSelectedBookingId,
    setShowNewBookingDialog,
    updateBookingStatus,
  } = useAppStore()

  const allBookings = bookings.length > 0 ? bookings : mockBookings

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const guest = getGuestById(b.guestId)
      const matchesSearch =
        !searchQuery ||
        b.confirmationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getRoomById(b.roomId)?.number.includes(searchQuery)

      const matchesStatus =
        statusFilter === 'all' || b.status === statusFilter

      const matchesChannel =
        channelFilter === 'all' || b.channel === channelFilter

      return matchesSearch && matchesStatus && matchesChannel
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allBookings, searchQuery, statusFilter, channelFilter])

  const selectedBooking = allBookings.find((b) => b.id === selectedBookingId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 md:p-6"
    >
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">All Bookings</h2>
          <p className="text-sm text-muted-foreground">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowNewBookingDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or room..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {mockChannels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Confirmation</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden sm:table-cell">Room</TableHead>
                <TableHead className="hidden md:table-cell">Check-in</TableHead>
                <TableHead className="hidden md:table-cell">Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Channel</TableHead>
                <TableHead className="hidden lg:table-cell">Total</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => {
                  const guest = getGuestById(booking.guestId)
                  const room = getRoomById(booking.roomId)
                  const channel = getChannelById(booking.channel)

                  return (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedBookingId(booking.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {booking.confirmationCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {guest?.vip && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1">
                              VIP
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            {guest?.firstName} {guest?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {room?.number} - {room?.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(booking.checkIn), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(booking.checkOut), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs capitalize',
                            statusColors[booking.status]
                          )}
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: channel?.color }}
                          />
                          <span className="text-sm">{channel?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-medium">
                        ${booking.totalPrice}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBookingId(booking.id)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {booking.status === 'confirmed' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateBookingStatus(booking.id, 'checked_in')
                                }}
                              >
                                <LogIn className="mr-2 h-4 w-4" />
                                Check In
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'checked_in' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateBookingStatus(booking.id, 'checked_out')
                                }}
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Check Out
                              </DropdownMenuItem>
                            )}
                            {(booking.status === 'confirmed' || booking.status === 'pending') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateBookingStatus(booking.id, 'cancelled')
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog
        open={!!selectedBookingId}
        onOpenChange={(open) => !open && setSelectedBookingId(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedBooking && (() => {
            const guest = getGuestById(selectedBooking.guestId)
            const room = getRoomById(selectedBooking.roomId)
            const channel = getChannelById(selectedBooking.channel)

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    Booking Details
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        statusColors[selectedBooking.status]
                      )}
                    >
                      {selectedBooking.status.replace('_', ' ')}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedBooking.confirmationCode}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Guest */}
                  <div className="rounded-lg border p-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Guest Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name</span>
                        <p className="font-medium">
                          {guest?.firstName} {guest?.lastName}
                          {guest?.vip && (
                            <Badge variant="outline" className="ml-2 border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1">
                              VIP
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email</span>
                        <p className="font-medium">{guest?.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone</span>
                        <p className="font-medium">{guest?.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nationality</span>
                        <p className="font-medium">{guest?.nationality}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking */}
                  <div className="rounded-lg border p-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Booking Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Room</span>
                        <p className="font-medium">{room?.number} - {room?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Channel</span>
                        <p className="flex items-center gap-1 font-medium">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: channel?.color }}
                          />
                          {channel?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-in</span>
                        <p className="font-medium">{format(parseISO(selectedBooking.checkIn), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-out</span>
                        <p className="font-medium">{format(parseISO(selectedBooking.checkOut), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Guests</span>
                        <p className="font-medium">{selectedBooking.adults} adults{selectedBooking.children > 0 ? `, ${selectedBooking.children} children` : ''}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total</span>
                        <p className="text-lg font-bold">${selectedBooking.totalPrice}</p>
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mt-3">
                        <span className="text-muted-foreground text-sm">Special Requests</span>
                        <p className="mt-1 text-sm">{selectedBooking.specialRequests}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {selectedBooking.status === 'confirmed' && (
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => updateBookingStatus(selectedBooking.id, 'checked_in')}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Check In Guest
                      </Button>
                    )}
                    {selectedBooking.status === 'checked_in' && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => updateBookingStatus(selectedBooking.id, 'checked_out')}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Check Out Guest
                      </Button>
                    )}
                    {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </Button>
                    )}
                    {(selectedBooking.status === 'pending') && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                      >
                        Confirm Booking
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
