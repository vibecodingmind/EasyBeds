'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, addDays, differenceInCalendarDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarIcon,
  CheckCircle,
  ChevronRight,
  Hotel,
  Mail,
  MapPin,
  Phone,
  Users,
  BedDouble,
  Wifi,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HotelData {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  timezone: string
  checkInTime: string
  checkOutTime: string
  currency: string
}

interface RoomData {
  id: string
  name: string
  roomNumber: string
  type: string
  maxGuests: number
  basePrice: number
  description: string | null
  amenities: string | null
  bedType: string | null
  imageUrl: string | null
  numNights?: number
  totalPrice?: number
  available?: boolean
}

interface BookingResult {
  booking: {
    id: string
    confirmationCode: string
    checkInDate: string
    checkOutDate: string
    numNights: number
    totalPrice: number
    currency: string
    status: string
    room: { name: string; roomNumber: string }
  }
  guest: { id: string; firstName: string; lastName: string }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function parseAmenities(amenities: string | null): string[] {
  if (!amenities) return []
  try {
    const parsed = JSON.parse(amenities)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="size-3.5" />,
}

function AmenityBadge({ amenity }: { amenity: string }) {
  const icon = AMENITY_ICONS[amenity.toLowerCase()]
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {icon}
      {amenity.replace(/_/g, ' ')}
    </Badge>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BookingPage() {
  // The slug comes from the URL path: /book/[slug]
  const [slug, setSlug] = useState<string | null>(null)
  const [hotel, setHotel] = useState<HotelData | null>(null)
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<BookingResult | null>(null)

  // Form state
  const [step, setStep] = useState<'dates' | 'room' | 'guest' | 'confirm'>('dates')
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined)
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined)
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null)
  const [numGuests, setNumGuests] = useState(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Load hotel data based on URL slug
  useEffect(() => {
    const path = window.location.pathname
    // Path format: /book/[slug] or /[slug] depending on Next.js routing
    const segments = path.split('/').filter(Boolean)
    // The (booking) route group means the URL could be /book/slug or just /slug
    const slugSegment = segments[segments.length - 1]
    if (slugSegment && slugSegment !== 'book') {
      setSlug(slugSegment)
    }
  }, [])

  useEffect(() => {
    if (!slug) return

    async function fetchHotel() {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/hotel/${encodeURIComponent(slug)}`)
        const json = await res.json()
        if (json.success && json.data) {
          setHotel(json.data.hotel)
          setRooms(json.data.rooms)
        } else {
          setError(json.error || 'Hotel not found.')
        }
      } catch {
        setError('Failed to load hotel information.')
      } finally {
        setLoading(false)
      }
    }

    fetchHotel()
  }, [slug])

  const numNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    return differenceInCalendarDays(checkOut, checkIn)
  }, [checkIn, checkOut])

  const totalPrice = useMemo(() => {
    if (!selectedRoom || numNights <= 0) return 0
    return numNights * selectedRoom.basePrice
  }, [selectedRoom, numNights])

  const checkAvailability = useCallback(async () => {
    if (!slug || !checkIn || !checkOut) return

    setLoadingAvailability(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        from: format(checkIn, 'yyyy-MM-dd'),
        to: format(checkOut, 'yyyy-MM-dd'),
      })
      const res = await fetch(`/api/public/hotel/${encodeURIComponent(slug)}/availability?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        setAvailableRooms(json.data.availableRooms)
        if (json.data.availableRooms.length === 0) {
          setError('No rooms available for the selected dates. Please try different dates.')
        } else {
          setStep('room')
        }
      } else {
        setError(json.error || 'Failed to check availability.')
      }
    } catch {
      setError('Failed to check room availability.')
    } finally {
      setLoadingAvailability(false)
    }
  }, [slug, checkIn, checkOut])

  const handleDatesNext = () => {
    if (!checkIn || !checkOut || numNights < 1) {
      setError('Please select valid check-in and check-out dates.')
      return
    }
    checkAvailability()
  }

  const handleRoomNext = () => {
    if (!selectedRoom) {
      setError('Please select a room.')
      return
    }
    setError(null)
    setStep('guest')
  }

  const handleSubmit = async () => {
    if (!slug || !selectedRoom || !checkIn || !checkOut) return
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please enter your email or phone number.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/public/hotel/${encodeURIComponent(slug)}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          checkIn: format(checkIn, 'yyyy-MM-dd'),
          checkOut: format(checkOut, 'yyyy-MM-dd'),
          numGuests,
          guestFirstName: firstName.trim(),
          guestLastName: lastName.trim(),
          guestEmail: email.trim() || undefined,
          guestPhone: phone.trim() || undefined,
          specialRequests: specialRequests.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setSuccess(json.data)
        setStep('confirm')
      } else {
        setError(json.error || 'Failed to create booking.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetBooking = () => {
    setStep('dates')
    setCheckIn(undefined)
    setCheckOut(undefined)
    setSelectedRoom(null)
    setAvailableRooms([])
    setNumGuests(1)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setSpecialRequests('')
    setError(null)
    setSuccess(null)
  }

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading hotel information...</p>
        </div>
      </div>
    )
  }

  if (error && !hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
            <h2 className="text-lg font-semibold">Hotel Not Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hotel) return null

  // ─── Success / Confirmation Screen ─────────────────────────────────────────

  if (success && step === 'confirm') {
    const b = success.booking
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-8 text-center text-white">
              <CheckCircle className="mx-auto mb-4 size-16" />
              <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
              <p className="mt-2 text-emerald-100">
                Your reservation has been successfully created.
              </p>
            </div>
            <CardContent className="space-y-6 pt-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Confirmation Code
                </p>
                <p className="mt-1 text-3xl font-bold text-emerald-600">{b.confirmationCode}</p>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Guest</p>
                  <p className="mt-1 font-medium">
                    {success.guest.firstName} {success.guest.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Room</p>
                  <p className="mt-1 font-medium">
                    {b.room.name} ({b.room.roomNumber})
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Check-in</p>
                  <p className="mt-1 font-medium">
                    {new Date(b.checkInDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Check-out</p>
                  <p className="mt-1 font-medium">
                    {new Date(b.checkOutDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Duration</p>
                  <p className="mt-1 font-medium">{b.numNights} night(s)</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">
                    {b.currency} {b.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                <p>
                  {hotel.phone && (
                    <span className="mr-4">
                      <Phone className="mr-1 inline size-3.5" />
                      {hotel.phone}
                    </span>
                  )}
                  {hotel.email && (
                    <span>
                      <Mail className="mr-1 inline size-3.5" />
                      {hotel.email}
                    </span>
                  )}
                </p>
                <p className="mt-2">
                  Check-in from <strong>{hotel.checkInTime}</strong> · Check-out by{' '}
                  <strong>{hotel.checkOutTime}</strong>
                </p>
              </div>
              <div className="text-center">
                <Button onClick={resetBooking} variant="outline" size="lg">
                  Make Another Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Main Booking Flow ─────────────────────────────────────────────────────

  const stepLabels = ['Dates', 'Room', 'Details', 'Confirm']
  const stepIndex = { dates: 0, room: 1, guest: 2, confirm: 3 }[step]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-4 py-12 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-emerald-200">
            <Hotel className="size-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Online Booking
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">{hotel.name}</h1>
          {(hotel.address || hotel.city) && (
            <p className="mt-2 flex items-center justify-center gap-1 text-emerald-200">
              <MapPin className="size-4" />
              {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <React.Fragment key={label}>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  i === stepIndex
                    ? 'bg-emerald-600 text-white'
                    : i < stepIndex
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-full text-xs font-bold">
                  {i < stepIndex ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Dates */}
            {step === 'dates' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Dates</CardTitle>
                  <CardDescription>
                    Choose your check-in and check-out dates to see available rooms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Check-in</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !checkIn && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {checkIn ? format(checkIn, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={(date) => {
                              setCheckIn(date)
                              // Auto-set checkout to next day
                              if (date && (!checkOut || checkOut <= date)) {
                                setCheckOut(addDays(date, 1))
                              }
                            }}
                            disabled={{ before: new Date() }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !checkOut && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {checkOut ? format(checkOut, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={setCheckOut}
                            disabled={{ before: checkIn ? addDays(checkIn, 1) : addDays(new Date(), 1) }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {numNights > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Duration: <strong>{numNights} night(s)</strong>
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleDatesNext}
                    disabled={!checkIn || !checkOut || numNights < 1 || loadingAvailability}
                    className="w-full"
                    size="lg"
                  >
                    {loadingAvailability ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Check Availability
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 2: Room Selection */}
            {step === 'room' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Room</CardTitle>
                  <CardDescription>
                    {numNights} night(s) · {format(checkIn!, 'MMM dd')} — {format(checkOut!, 'MMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableRooms.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No rooms available for these dates.
                    </p>
                  ) : (
                    availableRooms.map((room) => {
                      const amenities = parseAmenities(room.amenities)
                      const price = room.basePrice * numNights
                      return (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={cn(
                            'w-full rounded-lg border-2 p-4 text-left transition-all',
                            selectedRoom?.id === room.id
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                              : 'border-border hover:border-emerald-300 hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <BedDouble className="size-4 text-muted-foreground" />
                                <h3 className="font-semibold">{room.name}</h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {room.type}
                                </Badge>
                              </div>
                              {room.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {room.description}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="mr-1 size-3" />
                                  Up to {room.maxGuests} guests
                                </Badge>
                                {room.bedType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {room.bedType}
                                  </Badge>
                                )}
                                {amenities.slice(0, 4).map((a) => (
                                  <AmenityBadge key={a} amenity={a} />
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">per night</p>
                              <p className="text-lg font-bold text-emerald-600">
                                {hotel.currency} {room.basePrice.toLocaleString()}
                              </p>
                              <p className="text-sm font-medium text-muted-foreground">
                                Total: {hotel.currency} {price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('dates')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleRoomNext}
                    disabled={!selectedRoom}
                    className="flex-1"
                    size="lg"
                  >
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 3: Guest Details */}
            {step === 'guest' && selectedRoom && (
              <Card>
                <CardHeader>
                  <CardTitle>Guest Details</CardTitle>
                  <CardDescription>
                    Please provide your contact information to complete the booking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+255 700 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Guests</Label>
                    <Select
                      value={String(numGuests)}
                      onValueChange={(v) => setNumGuests(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: selectedRoom.maxGuests },
                          (_, i) => i + 1,
                        ).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? 'Guest' : 'Guests'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requests">Special Requests</Label>
                    <Textarea
                      id="requests"
                      placeholder="Any special requests or preferences..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('room')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Sidebar: Price Summary */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hotel && (
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Hotel className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{hotel.name}</p>
                      {hotel.city && (
                        <p className="text-xs text-muted-foreground">{hotel.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {checkIn && checkOut && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">{format(checkIn, 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">from {hotel.checkInTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-medium">{format(checkOut, 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">by {hotel.checkOutTime}</p>
                      </div>
                    </div>
                  </>
                )}

                {selectedRoom && numNights > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="size-4 text-muted-foreground" />
                        <p className="font-medium">{selectedRoom.name}</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {selectedRoom.basePrice.toLocaleString()} × {numNights} night(s)
                          </span>
                          <span className="font-medium">
                            {hotel.currency} {totalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-emerald-600">
                        {hotel.currency} {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                {!selectedRoom && (
                  <p className="text-center text-sm text-muted-foreground">
                    Select dates and a room to see the price breakdown.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
