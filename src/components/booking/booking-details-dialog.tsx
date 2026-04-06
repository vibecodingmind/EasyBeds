'use client'

import React from 'react'
import {
  Clock,
  Check,
  X,
  User,
  Bed,
  DollarSign,
  MessageSquare,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  mockBookings,
  getGuestById,
  getRoomById,
  getChannelById,
} from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const statusSteps = ['pending', 'confirmed', 'checked_in', 'checked_out']
const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
}

export function BookingDetailsDialog() {
  const { selectedBookingId, setSelectedBookingId } = useAppStore()

  const booking = selectedBookingId
    ? mockBookings.find((b) => b.id === selectedBookingId)
    : null

  if (!booking) return null

  const guest = getGuestById(booking.guestId)
  const room = getRoomById(booking.roomId)
  const channel = getChannelById(booking.channel)

  const currentStepIdx = booking.status === 'cancelled'
    ? -1
    : statusSteps.indexOf(booking.status)

  return (
    <Dialog
      open={!!selectedBookingId}
      onOpenChange={(open) => !open && setSelectedBookingId(null)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Booking Details
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                booking.status === 'confirmed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                booking.status === 'checked_in' && 'bg-blue-50 text-blue-700 border-blue-200',
                booking.status === 'checked_out' && 'bg-gray-50 text-gray-600 border-gray-200',
                booking.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                booking.status === 'cancelled' && 'bg-red-50 text-red-700 border-red-200',
              )}
            >
              {booking.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>{booking.confirmationCode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Timeline */}
          {booking.status !== 'cancelled' && (
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
                              : 'border-muted-foreground/30 text-muted-foreground/50'
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
                                : 'text-muted-foreground/50'
                          )}
                        >
                          {statusLabels[step]}
                        </span>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            'h-0.5 flex-1 rounded-full',
                            idx < currentStepIdx ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                          )}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <X className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-2 text-sm font-medium text-red-700">
                This booking has been cancelled
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
                {guest?.firstName[0]}{guest?.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {guest?.firstName} {guest?.lastName}
                  {guest?.vip && (
                    <Badge variant="outline" className="ml-2 border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1">
                      VIP
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{guest?.email}</p>
                <p className="text-xs text-muted-foreground">{guest?.phone}</p>
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
                  <p className="font-medium">{room?.number} - {room?.name}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Channel</span>
                <p className="flex items-center gap-1 font-medium">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: channel?.color }}
                  />
                  {channel?.name}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Check-in</span>
                <p className="font-medium">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Check-out</span>
                <p className="font-medium">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Guests</span>
                <p className="font-medium">{booking.adults} adults{booking.children > 0 ? `, ${booking.children} children` : ''}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Nights</span>
                <p className="font-medium">
                  {Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))}
                </p>
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
              <span className="text-2xl font-bold">${booking.totalPrice}</span>
            </div>
            {channel && channel.commission > 0 && (
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Commission ({channel.commission}%)</span>
                <span>${Math.round(booking.totalPrice * channel.commission / 100)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Net Revenue</span>
              <span className="font-medium text-emerald-700">
                ${channel ? Math.round(booking.totalPrice * (100 - channel.commission) / 100) : booking.totalPrice}
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
            <p>Created: {format(parseISO(booking.createdAt), 'MMM d, yyyy HH:mm')}</p>
            <p>Last updated: {format(parseISO(booking.updatedAt), 'MMM d, yyyy HH:mm')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
