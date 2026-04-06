'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import {
  Check,
  X,
  Bed,
  DollarSign,
  MessageSquare,
  LogIn,
  LogOut,
  XCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import type { ApiBooking } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusSteps = ['pending', 'confirmed', 'checked_in', 'checked_out']
const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

const statusBadgeColors: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-50 text-gray-600 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
}

export function BookingDetailsDialog() {
  const {
    selectedBookingId,
    setSelectedBookingId,
    bookings,
    hotel,
    updateBookingStatus,
  } = useAppStore()
  const [fetchedBooking, setFetchedBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Get booking from local store or fetched
  const booking = useMemo((): ApiBooking | null => {
    if (selectedBookingId) {
      const local = bookings.find((b) => b.id === selectedBookingId)
      if (local) return local
      return fetchedBooking
    }
    return null
  }, [selectedBookingId, bookings, fetchedBooking])

  const isLocal = bookings.some((b) => b.id === selectedBookingId)

  // Fetch booking from API when not in local store
  const fetchBooking = useCallback(async (id: string) => {
    setLoading(true)
    setFetchError(false)
    try {
      const currentHotelId = useAppStore.getState().currentHotelId
      const res = await fetch(
        `/api/bookings/${id}?hotelId=${currentHotelId}`,
      )
      const json = await res.json()
      if (json.success) {
        setFetchedBooking(json.data)
      } else {
        setFetchError(true)
      }
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch when dialog opens for a booking not in local store
  useEffect(() => {
    if (selectedBookingId && !isLocal) {
      fetchBooking(selectedBookingId)
    }
    return () => {
      setFetchedBooking(null)
      setFetchError(false)
    }
  }, [selectedBookingId, isLocal, fetchBooking])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedBookingId(null)
        setFetchedBooking(null)
        setFetchError(false)
      }
    },
    [setSelectedBookingId],
  )

  const handleStatusUpdate = useCallback(
    async (bookingId: string, status: string, label: string) => {
      setUpdatingStatus(true)
      try {
        const success = await updateBookingStatus(bookingId, status)
        if (success) {
          toast.success(`Booking ${label} successfully`)
        } else {
          toast.error('Failed to update booking status')
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update booking',
        )
      } finally {
        setUpdatingStatus(false)
      }
    },
    [updateBookingStatus],
  )

  if (!selectedBookingId) return null

  const currencySymbol =
    hotel?.currency === 'EUR' ? '€' : hotel?.currency === 'GBP' ? '£' : '$'

  if (loading && !booking) {
    return (
      <Dialog open={!!selectedBookingId} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (fetchError && !booking) {
    return (
      <Dialog open={!!selectedBookingId} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Not Found</DialogTitle>
            <DialogDescription>Could not load booking details.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            This booking may have been deleted or is no longer available.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!booking) return null

  const currentStepIdx =
    booking.status === 'cancelled' || booking.status === 'no_show'
      ? -1
      : statusSteps.indexOf(booking.status)

  return (
    <Dialog open={!!selectedBookingId} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Booking Details
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                statusBadgeColors[booking.status],
              )}
            >
              {booking.status.replace(/_/g, ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>{booking.confirmationCode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Timeline */}
          {booking.status !== 'cancelled' && booking.status !== 'no_show' && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Booking Progress
              </h4>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx
                  const isCurrent = idx === currentStepIdx
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                            isCompleted
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-muted-foreground/30 text-muted-foreground/50',
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] text-center',
                            isCurrent
                              ? 'font-semibold text-emerald-700'
                              : isCompleted
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground/50',
                          )}
                        >
                          {statusLabels[step]}
                        </span>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            'h-0.5 flex-1 rounded-full',
                            idx < currentStepIdx
                              ? 'bg-emerald-500'
                              : 'bg-muted-foreground/20',
                          )}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )}

          {(booking.status === 'cancelled' || booking.status === 'no_show') && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <X className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-2 text-sm font-medium text-red-700">
                {booking.status === 'no_show'
                  ? 'Guest did not show up'
                  : 'This booking has been cancelled'}
              </p>
            </div>
          )}

          {/* Guest Info */}
          <div className="rounded-lg border p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Guest Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {booking.guest?.firstName?.[0]}
                {booking.guest?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {booking.guest?.firstName} {booking.guest?.lastName}
                </p>
                {booking.guest?.email && (
                  <p className="text-xs text-muted-foreground">
                    {booking.guest.email}
                  </p>
                )}
                {booking.guest?.phone && (
                  <p className="text-xs text-muted-foreground">
                    {booking.guest.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="rounded-lg border p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Booking Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground">Room</span>
                  <p className="font-medium">
                    {booking.room?.roomNumber} - {booking.room?.name}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Channel</span>
                <p className="font-medium">
                  {booking.channel?.name || '—'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Check-in</span>
                <p className="font-medium">
                  {format(parseISO(booking.checkInDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Check-out</span>
                <p className="font-medium">
                  {format(parseISO(booking.checkOutDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Guests</span>
                <p className="font-medium">
                  {booking.numGuests} guest
                  {booking.numGuests !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Nights</span>
                <p className="font-medium">{booking.numNights}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Payment
              </h4>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold">
                {currencySymbol}
                {booking.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Rate per night</span>
              <span>
                {currencySymbol}
                {booking.pricePerNight.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="rounded-lg border p-3">
              <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                Special Requests
              </h4>
              <p className="text-sm">{booking.specialRequests}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground">
            <p>
              Created:{' '}
              {format(parseISO(booking.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
            <p>
              Last updated:{' '}
              {format(parseISO(booking.updatedAt), 'MMM d, yyyy HH:mm')}
            </p>
            {booking.checkedInAt && (
              <p>
                Checked in:{' '}
                {format(parseISO(booking.checkedInAt), 'MMM d, yyyy HH:mm')}
              </p>
            )}
            {booking.checkedOutAt && (
              <p>
                Checked out:{' '}
                {format(parseISO(booking.checkedOutAt), 'MMM d, yyyy HH:mm')}
              </p>
            )}
          </div>

          {/* Status Actions */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {booking.status === 'pending' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={updatingStatus}
                  onClick={() =>
                    handleStatusUpdate(booking.id, 'confirmed', 'confirmed')
                  }
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Confirm Booking
                </Button>
              )}
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updatingStatus}
                  onClick={() =>
                    handleStatusUpdate(booking.id, 'checked_in', 'checked in')
                  }
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Check In
                </Button>
              )}
              {booking.status === 'checked_in' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={updatingStatus}
                  onClick={() =>
                    handleStatusUpdate(booking.id, 'checked_out', 'checked out')
                  }
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Check Out
                </Button>
              )}
              {(booking.status === 'confirmed' ||
                booking.status === 'pending') && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updatingStatus}
                  onClick={() =>
                    handleStatusUpdate(booking.id, 'cancelled', 'cancelled')
                  }
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
