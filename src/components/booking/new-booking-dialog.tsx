'use client'

import React, { useState, useMemo } from 'react'
import {
  CalendarDays,
  Users,
  DollarSign,
  Check,
  UserPlus,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppStore, type MockBooking } from '@/lib/store'
import {
  mockRooms,
  mockGuests,
  mockChannels,
  getRoomById,
  getGuestById,
} from '@/lib/mock-data'
import { format, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function NewBookingDialog() {
  const {
    showNewBookingDialog,
    setShowNewBookingDialog,
    rooms,
    guests,
    bookings,
    addBooking,
  } = useAppStore()

  const allRooms = rooms.length > 0 ? rooms : mockRooms
  const allGuests = guests.length > 0 ? guests : mockGuests
  const allBookings = bookings.length > 0 ? bookings : []

  const [guestSearch, setGuestSearch] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined)
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [channelId, setChannelId] = useState('channel-4')
  const [specialRequests, setSpecialRequests] = useState('')
  const [step, setStep] = useState<'guest' | 'room' | 'dates' | 'confirm'>('guest')

  // Filter available rooms based on dates
  const availableRooms = useMemo(() => {
    if (!checkIn || !checkOut) return allRooms.filter((r) => r.status !== 'maintenance' && r.status !== 'out_of_service')

    return allRooms.filter((room) => {
      if (room.status === 'maintenance' || room.status === 'out_of_service') return false

      // Check if room has conflicting bookings
      return !allBookings.some((b) => {
        if (b.roomId !== room.id || b.status === 'cancelled') return false
        const bCheckIn = parseISO(b.checkIn)
        const bCheckOut = parseISO(b.checkOut)
        return (
          (isBefore(checkIn, bCheckOut) && isAfter(checkOut, bCheckIn))
        )
      })
    })
  }, [allRooms, checkIn, checkOut, allBookings])

  const filteredGuests = useMemo(() => {
    if (!guestSearch) return allGuests
    const q = guestSearch.toLowerCase()
    return allGuests.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q)
    )
  }, [allGuests, guestSearch])

  const selectedRoom = allRooms.find((r) => r.id === selectedRoomId)
  const selectedGuest = allGuests.find((g) => g.id === selectedGuestId)

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const totalPrice = selectedRoom ? selectedRoom.basePrice * Math.max(nights, 1) : 0

  const handleClose = () => {
    setShowNewBookingDialog(false)
    resetForm()
  }

  const resetForm = () => {
    setGuestSearch('')
    setSelectedGuestId('')
    setSelectedRoomId('')
    setCheckIn(undefined)
    setCheckOut(undefined)
    setAdults(1)
    setChildren(0)
    setChannelId('channel-4')
    setSpecialRequests('')
    setStep('guest')
  }

  const handleSubmit = () => {
    if (!selectedGuestId || !selectedRoomId || !checkIn || !checkOut || nights < 1) return

    const booking: MockBooking = {
      id: `booking-${Date.now()}`,
      confirmationCode: `EB-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      hotelId: 'hotel-1',
      roomId: selectedRoomId,
      guestId: selectedGuestId,
      channel: channelId,
      status: 'confirmed',
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      adults,
      children,
      totalPrice,
      currency: 'USD',
      specialRequests,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }

    addBooking(booking)
    toast.success('Booking created successfully!', {
      description: `${booking.confirmationCode} - ${selectedGuest?.firstName} ${selectedGuest?.lastName}`,
    })
    handleClose()
  }

  const canProceed = () => {
    switch (step) {
      case 'guest': return !!selectedGuestId
      case 'room': return !!selectedRoomId
      case 'dates': return !!checkIn && !!checkOut && nights >= 1
      case 'confirm': return true
      default: return false
    }
  }

  return (
    <Dialog open={showNewBookingDialog} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
          <DialogDescription>
            Step {step === 'guest' ? 1 : step === 'room' ? 2 : step === 'dates' ? 3 : 4} of 4 —{' '}
            {step === 'guest' ? 'Select Guest' : step === 'room' ? 'Select Room' : step === 'dates' ? 'Choose Dates' : 'Confirm Booking'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {['guest', 'room', 'dates', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                ['guest', 'room', 'dates', 'confirm'].indexOf(step) >= i
                  ? 'bg-emerald-500'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {/* Step 1: Guest Selection */}
          {step === 'guest' && (
            <div className="space-y-3">
              <div className="relative">
                <Label>Search or Select Guest</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="max-h-60 space-y-1.5 overflow-y-auto">
                {filteredGuests.map((guest) => (
                  <button
                    key={guest.id}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      selectedGuestId === guest.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => setSelectedGuestId(guest.id)}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        guest.vip ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {guest.firstName[0]}{guest.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{guest.firstName} {guest.lastName}</span>
                        {guest.vip && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1">VIP</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{guest.email} · {guest.nationality}</span>
                    </div>
                    {selectedGuestId === guest.id && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Room Selection */}
          {step === 'room' && (
            <div className="space-y-3">
              <Label>Select Room</Label>
              <div className="max-h-60 space-y-1.5 overflow-y-auto">
                {availableRooms.map((room) => {
                  const isAvailable = availableRooms.some((r) => r.id === room.id)
                  return (
                    <button
                      key={room.id}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        selectedRoomId === room.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : isAvailable ? 'hover:bg-muted' : 'opacity-50'
                      )}
                      onClick={() => isAvailable && setSelectedRoomId(room.id)}
                      disabled={!isAvailable}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{room.number}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">{room.type}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{room.name}</span>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Up to {room.maxGuests} guests</span>
                          <span>·</span>
                          <span className="font-medium">${room.basePrice}/night</span>
                        </div>
                      </div>
                      {selectedRoomId === room.id && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  )
                })}
                {availableRooms.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    No rooms available for the selected dates
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Dates & Details */}
          {step === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !checkIn && 'text-muted-foreground')}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={(date) => {
                          setCheckIn(date)
                          if (checkOut && date && isBefore(checkOut, date)) {
                            setCheckOut(undefined)
                          }
                        }}
                        disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !checkOut && 'text-muted-foreground')}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => !checkIn || isBefore(date, checkIn)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {nights > 0 && (
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-semibold text-emerald-700">{nights} night{nights !== 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Select value={String(adults)} onValueChange={(v) => setAdults(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Select value={String(children)} onValueChange={(v) => setChildren(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockChannels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Special Requests</Label>
                <Textarea
                  placeholder="Any special requests..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Booking Summary</h4>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guest</span>
                    <span className="font-medium">{selectedGuest?.firstName} {selectedGuest?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-medium">{selectedRoom?.number} - {selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{checkIn && format(checkIn, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{checkOut && format(checkOut, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{adults} adults{children > 0 ? `, ${children} children` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel</span>
                    <span className="font-medium">{mockChannels.find((c) => c.id === channelId)?.name}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <div className="text-right">
                      <span className="text-xl font-bold">${totalPrice}</span>
                      <span className="text-xs text-muted-foreground ml-1">USD</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${selectedRoom?.basePrice} × {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {specialRequests && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <span className="text-xs font-semibold text-muted-foreground">Special Requests</span>
                  <p className="mt-1 text-sm">{specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'guest' && (
            <Button variant="outline" onClick={() => setStep(step === 'confirm' ? 'dates' : step === 'dates' ? 'room' : 'guest')}>
              Back
            </Button>
          )}
          {step !== 'confirm' ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!canProceed()}
              onClick={() => {
                if (step === 'guest') setStep('room')
                else if (step === 'room') setStep('dates')
                else setStep('confirm')
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
            >
              Create Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
