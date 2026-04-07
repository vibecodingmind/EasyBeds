'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Eye,
  LogIn,
  LogOut,
  XCircle,
  MoreHorizontal,
  Edit3,
  Loader2,
  CalendarDays,
  BedDouble,
  CheckCircle2,
  FileText,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAppStore, type BookingStatus, type ApiBooking } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { openPrintPreview } from '@/lib/pdf-utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

export function BookingsView() {
  const {
    bookings,
    channels,
    selectedBookingId,
    setSelectedBookingId,
    setShowNewBookingDialog,
    updateBookingStatus,
    fetchBookings,
    fetchChannels,
    loading,
    currentHotelId,
    hotel,
  } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchBookings()
      fetchChannels()
    }
  }, [currentHotelId, fetchBookings, fetchChannels])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Modify booking dialog
  const [modifyingBooking, setModifyingBooking] = useState<ApiBooking | null>(null)
  const [modifyForm, setModifyForm] = useState({
    checkIn: '',
    checkOut: '',
    roomId: '',
  })
  const [modifying, setModifying] = useState(false)
  const { rooms } = useAppStore()

  const handleOpenModify = (booking: ApiBooking) => {
    setModifyingBooking(booking)
    setModifyForm({
      checkIn: format(parseISO(booking.checkInDate), 'yyyy-MM-dd'),
      checkOut: format(parseISO(booking.checkOutDate), 'yyyy-MM-dd'),
      roomId: booking.roomId,
    })
  }

  const handleModify = async () => {
    if (!currentHotelId || !modifyingBooking) return
    setModifying(true)
    try {
      const res = await fetch(
        `/api/bookings/${modifyingBooking.id}/modify?hotelId=${currentHotelId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modifyForm),
        }
      )
      const json = await res.json()
      if (json.success) {
        toast.success('Booking modified successfully')
        setModifyingBooking(null)
        fetchBookings()
      } else {
        toast.error(json.error || 'Failed to modify booking')
      }
    } catch {
      toast.error('Failed to modify booking')
    } finally {
      setModifying(false)
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        b.confirmationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guestName.includes(searchQuery.toLowerCase()) ||
        (b.room?.roomNumber || '').includes(searchQuery)

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter

      const matchesChannel = channelFilter === 'all' || b.channelId === channelFilter

      return matchesSearch && matchesStatus && matchesChannel
    })
  }, [bookings, searchQuery, statusFilter, channelFilter])

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || null

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      const success = await updateBookingStatus(id, status)
      if (success) {
        toast.success(`Booking ${status.replace(/_/g, ' ')} successfully`)
      } else {
        toast.error('Failed to update booking status')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update booking')
    }
  }

  const currencySymbol =
    hotel?.currency === 'EUR' ? '€' : hotel?.currency === 'GBP' ? '£' : '$'

  // Invoice download handler
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)

  const handleDownloadInvoice = async (booking: ApiBooking) => {
    if (!currentHotelId) return
    setDownloadingInvoice(booking.id)
    try {
      // Step 1: Create invoice (returns existing if one exists)
      const createRes = await fetch(`/api/invoices?hotelId=${currentHotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, taxRate: 0 }),
      })
      const createJson = await createRes.json()
      if (!createJson.success) {
        toast.error(createJson.error || 'Failed to create invoice')
        return
      }
      const invoiceId = createJson.data.id

      // Step 2: Fetch printable HTML
      const pdfRes = await fetch(`/api/invoices/${invoiceId}/pdf?hotelId=${currentHotelId}`)
      if (!pdfRes.ok) {
        toast.error('Failed to generate invoice')
        return
      }
      const html = await pdfRes.text()
      openPrintPreview(html, `Invoice ${createJson.data.invoiceNumber}`)
    } catch {
      toast.error('Failed to download invoice')
    } finally {
      setDownloadingInvoice(null)
    }
  }

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
                {channels.map((ch) => (
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
          {loading.bookings && bookings.length === 0 ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
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
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedBookingId(booking.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {booking.confirmationCode}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {booking.guest?.firstName} {booking.guest?.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {booking.room?.roomNumber} - {booking.room?.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(booking.checkInDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(booking.checkOutDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs capitalize',
                            statusColors[booking.status],
                          )}
                        >
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">{booking.channel?.name || '—'}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-medium">
                        {currencySymbol}
                        {booking.totalPrice.toLocaleString()}
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
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenModify(booking)
                                }}
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Modify Booking
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'confirmed' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(booking.id, 'checked_in')
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
                                  handleStatusUpdate(booking.id, 'checked_out')
                                }}
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Check Out
                              </DropdownMenuItem>
                            )}
                            {(booking.status === 'confirmed' ||
                              booking.status === 'pending') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(booking.id, 'cancelled')
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadInvoice(booking)
                              }}
                              disabled={downloadingInvoice === booking.id}
                            >
                              {downloadingInvoice === booking.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="mr-2 h-4 w-4" />
                              )}
                              Download Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog
        open={!!selectedBookingId}
        onOpenChange={(open) => !open && setSelectedBookingId(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Booking Details
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize',
                      statusColors[selectedBooking.status],
                    )}
                  >
                    {selectedBooking.status.replace(/_/g, ' ')}
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
                        {selectedBooking.guest?.firstName}{' '}
                        {selectedBooking.guest?.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <p className="font-medium">
                        {selectedBooking.guest?.email || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone</span>
                      <p className="font-medium">
                        {selectedBooking.guest?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guests</span>
                      <p className="font-medium">
                        {selectedBooking.numGuests} guest
                        {selectedBooking.numGuests !== 1 ? 's' : ''}
                      </p>
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
                      <p className="font-medium">
                        {selectedBooking.room?.roomNumber} -{' '}
                        {selectedBooking.room?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Channel</span>
                      <p className="font-medium">
                        {selectedBooking.channel?.name || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-in</span>
                      <p className="font-medium">
                        {format(
                          parseISO(selectedBooking.checkInDate),
                          'MMM d, yyyy',
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out</span>
                      <p className="font-medium">
                        {format(
                          parseISO(selectedBooking.checkOutDate),
                          'MMM d, yyyy',
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights</span>
                      <p className="font-medium">{selectedBooking.numNights}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total</span>
                      <p className="text-lg font-bold">
                        {currencySymbol}
                        {selectedBooking.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedBooking.specialRequests && (
                    <div className="mt-3">
                      <span className="text-muted-foreground text-sm">
                        Special Requests
                      </span>
                      <p className="mt-1 text-sm">
                        {selectedBooking.specialRequests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, 'checked_in')
                      }
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Check In Guest
                    </Button>
                  )}
                  {selectedBooking.status === 'checked_in' && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, 'checked_out')
                      }
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Check Out Guest
                    </Button>
                  )}
                  {(selectedBooking.status === 'confirmed' ||
                    selectedBooking.status === 'pending') && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, 'cancelled')
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  )}
                  {selectedBooking.status === 'pending' && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, 'confirmed')
                      }
                    >
                      Confirm Booking
                    </Button>
                  )}
                  {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenModify(selectedBooking)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Modify
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownloadInvoice(selectedBooking)}
                    disabled={downloadingInvoice === selectedBooking.id}
                  >
                    {downloadingInvoice === selectedBooking.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modify Booking Dialog */}
      <Dialog open={!!modifyingBooking} onOpenChange={() => setModifyingBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Modify Booking
            </DialogTitle>
            <DialogDescription>
              Change dates or room for this booking
            </DialogDescription>
          </DialogHeader>
          {modifyingBooking && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{modifyingBooking.confirmationCode}</p>
                <p className="text-muted-foreground">
                  {modifyingBooking.guest?.firstName} {modifyingBooking.guest?.lastName} &bull;{' '}
                  Room {modifyingBooking.room?.roomNumber}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Check-in Date
                </Label>
                <Input
                  type="date"
                  value={modifyForm.checkIn}
                  onChange={(e) =>
                    setModifyForm({ ...modifyForm, checkIn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Check-out Date
                </Label>
                <Input
                  type="date"
                  value={modifyForm.checkOut}
                  onChange={(e) =>
                    setModifyForm({ ...modifyForm, checkOut: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BedDouble className="h-3.5 w-3.5" />
                  Room
                </Label>
                <Select
                  value={modifyForm.roomId}
                  onValueChange={(v) => setModifyForm({ ...modifyForm, roomId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms
                      .filter((r) => r.isActive)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.roomNumber} — {r.name} ({r.type}) —{' '}
                          {currencySymbol}{r.basePrice}/night
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyingBooking(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleModify}
              disabled={modifying}
            >
              {modifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
