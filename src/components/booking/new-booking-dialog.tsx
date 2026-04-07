'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  CalendarDays,
  Users,
  DollarSign,
  Check,
  UserPlus,
  AlertCircle,
  Loader2,
  Search,
  Tag,
  X,
  TrendingUp,
  TrendingDown,
  Info,
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
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { api, type PricingBreakdown, type CouponValidation, type NightlyPrice } from '@/lib/api'
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'

export function NewBookingDialog() {
  const {
    showNewBookingDialog,
    setShowNewBookingDialog,
    rooms,
    guests,
    bookings,
    channels,
    createBooking,
    createGuest,
    fetchGuests,
    currentHotelId,
    hotel,
  } = useAppStore()

  const [guestSearch, setGuestSearch] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined)
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined)
  const [numGuests, setNumGuests] = useState(1)
  const [channelId, setChannelId] = useState<string>('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [step, setStep] = useState<'guest' | 'room' | 'dates' | 'confirm'>('guest')
  const [submitting, setSubmitting] = useState(false)

  // New guest form state
  const [showNewGuestForm, setShowNewGuestForm] = useState(false)
  const [newGuestFirstName, setNewGuestFirstName] = useState('')
  const [newGuestLastName, setNewGuestLastName] = useState('')
  const [newGuestEmail, setNewGuestEmail] = useState('')
  const [newGuestPhone, setNewGuestPhone] = useState('')
  const [creatingGuest, setCreatingGuest] = useState(false)

  // Dynamic pricing state
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // Set default channel to first walk-in channel
  useEffect(() => {
    if (channels.length > 0 && !channelId) {
      const walkIn = channels.find(
        (c) => c.type === 'walkin' || c.type === 'walk_in',
      )
      setChannelId(walkIn?.id || channels[0].id)
    }
  }, [channels, channelId])

  // Search guests when typing
  useEffect(() => {
    if (!showNewGuestForm && guestSearch.length >= 2 && currentHotelId) {
      const timer = setTimeout(() => {
        fetchGuests(guestSearch)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [guestSearch, currentHotelId, fetchGuests, showNewGuestForm])

  // Fetch dynamic pricing when room/dates/channel change
  const fetchPricing = useCallback(async () => {
    if (!currentHotelId || !selectedRoomId || !checkIn || !checkOut) {
      setPricingBreakdown(null)
      return
    }
    const nights = differenceInDays(checkOut, checkIn)
    if (nights < 1) {
      setPricingBreakdown(null)
      return
    }

    setLoadingPricing(true)
    try {
      const nightlyPrices: NightlyPrice[] = []
      let baseTotal = 0
      let dynamicTotal = 0

      for (let i = 0; i < nights; i++) {
        const dateStr = format(addDays(checkIn, i), 'yyyy-MM-dd')
        const result = await api.calculatePrice(
          currentHotelId,
          selectedRoomId,
          dateStr,
          channelId || undefined,
        )
        if (result.success) {
          nightlyPrices.push({
            date: dateStr,
            basePrice: result.data.basePrice,
            finalPrice: result.data.finalPrice,
            appliedRules: result.data.appliedRules,
          })
          baseTotal += result.data.basePrice
          dynamicTotal += result.data.finalPrice
        } else {
          // Fallback to base price
          const room = rooms.find((r) => r.id === selectedRoomId)
          const fallback = room?.basePrice || 0
          nightlyPrices.push({
            date: dateStr,
            basePrice: fallback,
            finalPrice: fallback,
            appliedRules: [],
          })
          baseTotal += fallback
          dynamicTotal += fallback
        }
      }

      setPricingBreakdown({
        nightlyPrices,
        baseTotal: Math.round(baseTotal * 100) / 100,
        adjustmentsTotal: Math.round((dynamicTotal - baseTotal) * 100) / 100,
        dynamicTotal: Math.round(dynamicTotal * 100) / 100,
        couponDiscount: 0,
        couponCode: null,
        couponType: null,
        finalTotal: Math.round(dynamicTotal * 100) / 100,
      })
    } catch {
      // Fallback to flat base price
      const room = rooms.find((r) => r.id === selectedRoomId)
      const fallback = room?.basePrice || 0
      const flatTotal = fallback * nights
      setPricingBreakdown({
        nightlyPrices: Array.from({ length: nights }, (_, i) => ({
          date: format(addDays(checkIn, i), 'yyyy-MM-dd'),
          basePrice: fallback,
          finalPrice: fallback,
          appliedRules: [],
        })),
        baseTotal: flatTotal,
        adjustmentsTotal: 0,
        dynamicTotal: flatTotal,
        couponDiscount: 0,
        couponCode: null,
        couponType: null,
        finalTotal: flatTotal,
      })
    } finally {
      setLoadingPricing(false)
    }
  }, [currentHotelId, selectedRoomId, checkIn, checkOut, channelId, rooms])

  useEffect(() => {
    if (step === 'dates' || step === 'confirm') {
      fetchPricing()
    } else {
      setPricingBreakdown(null)
    }
  }, [step, fetchPricing])

  // Filter available rooms based on dates
  const availableRooms = useMemo(() => {
    if (!checkIn || !checkOut) return rooms

    return rooms.filter((room) => {
      return !bookings.some((b) => {
        if (b.roomId !== room.id || b.status === 'cancelled') return false
        const bCheckIn = new Date(b.checkInDate)
        const bCheckOut = new Date(b.checkOutDate)
        return isBefore(checkIn, bCheckOut) && isAfter(checkOut, bCheckIn)
      })
    })
  }, [rooms, checkIn, checkOut, bookings])

  const filteredGuests = useMemo(() => {
    if (!guestSearch) return guests
    const q = guestSearch.toLowerCase()
    return guests.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        (g.email || '').toLowerCase().includes(q),
    )
  }, [guests, guestSearch])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const selectedGuest = guests.find((g) => g.id === selectedGuestId)
  const selectedChannel = channels.find((c) => c.id === channelId)

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const currency = hotel?.currency || 'USD'

  // Computed final total with coupon
  const finalTotalWithCoupon = useMemo(() => {
    if (!pricingBreakdown) return 0
    if (couponValidation?.valid && couponValidation.discount) {
      return Math.max(0, pricingBreakdown.finalTotal - couponValidation.discount)
    }
    return pricingBreakdown.finalTotal
  }, [pricingBreakdown, couponValidation])

  // All applied rules across all nights
  const allAppliedRules = useMemo(() => {
    if (!pricingBreakdown) return []
    const rulesMap = new Map<string, { name: string; ruleType: string; adjustmentType: string; adjustmentValue: number; count: number }>()
    for (const night of pricingBreakdown.nightlyPrices) {
      for (const rule of night.appliedRules) {
        const existing = rulesMap.get(rule.id)
        if (existing) {
          existing.count++
        } else {
          rulesMap.set(rule.id, {
            name: rule.name,
            ruleType: rule.ruleType,
            adjustmentType: rule.adjustmentType,
            adjustmentValue: rule.adjustmentValue,
            count: 1,
          })
        }
      }
    }
    return Array.from(rulesMap.entries()).map(([, v]) => v)
  }, [pricingBreakdown])

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
    setNumGuests(1)
    setChannelId('')
    setSpecialRequests('')
    setStep('guest')
    setShowNewGuestForm(false)
    setNewGuestFirstName('')
    setNewGuestLastName('')
    setNewGuestEmail('')
    setNewGuestPhone('')
    setCreatingGuest(false)
    setPricingBreakdown(null)
    setCouponCode('')
    setCouponInput('')
    setCouponValidation(null)
    setValidatingCoupon(false)
  }

  const handleCreateGuest = async () => {
    if (!newGuestFirstName.trim() || !newGuestLastName.trim()) {
      toast.error('First name and last name are required')
      return
    }

    setCreatingGuest(true)
    try {
      const guest = await createGuest({
        firstName: newGuestFirstName.trim(),
        lastName: newGuestLastName.trim(),
        email: newGuestEmail.trim() || undefined,
        phone: newGuestPhone.trim() || undefined,
      })

      if (guest) {
        setSelectedGuestId(guest.id)
        setShowNewGuestForm(false)
        setNewGuestFirstName('')
        setNewGuestLastName('')
        setNewGuestEmail('')
        setNewGuestPhone('')
        toast.success(
          `Guest ${guest.firstName} ${guest.lastName} created successfully`,
        )
      } else {
        toast.error('Failed to create guest. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create guest')
    } finally {
      setCreatingGuest(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !currentHotelId) return

    setValidatingCoupon(true)
    try {
      const result = await api.validateCoupon(currentHotelId, couponInput.trim(), {
        numNights: nights,
        channelId: channelId || undefined,
      })
      if (result.success) {
        setCouponValidation(result.data)
        if (result.data.valid) {
          setCouponCode(couponInput.trim())
          toast.success(`Coupon "${result.data.code}" applied! ${result.data.type === 'percentage' ? `${result.data.value}% off` : result.data.type === 'free_nights' ? `${result.data.value} free night(s)` : `${formatCurrency(result.data.discount, currency)} off`}`)
        } else {
          setCouponCode('')
          toast.error(result.data.reason || 'Invalid coupon code')
        }
      } else {
        setCouponValidation(null)
        setCouponCode('')
        toast.error(result.error || 'Failed to validate coupon')
      }
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponInput('')
    setCouponValidation(null)
  }

  const handleSubmit = async () => {
    if (!selectedGuestId || !selectedRoomId || !checkIn || !checkOut || nights < 1)
      return

    setSubmitting(true)
    try {
      const booking = await createBooking({
        roomId: selectedRoomId,
        guestId: selectedGuestId,
        channelId: channelId || undefined,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        numGuests,
        specialRequests: specialRequests || undefined,
        couponCode: couponCode || undefined,
      })

      if (booking) {
        toast.success('Booking created successfully!', {
          description: `${booking.confirmationCode} - ${selectedGuest?.firstName} ${selectedGuest?.lastName}`,
        })
        handleClose()
      } else {
        toast.error('Failed to create booking. The room may no longer be available.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'guest':
        return !!selectedGuestId
      case 'room':
        return !!selectedRoomId
      case 'dates':
        return !!checkIn && !!checkOut && nights >= 1
      case 'confirm':
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={showNewBookingDialog} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
          <DialogDescription>
            Step{' '}
            {step === 'guest'
              ? 1
              : step === 'room'
                ? 2
                : step === 'dates'
                  ? 3
                  : 4}{' '}
            of 4 —{' '}
            {step === 'guest'
              ? 'Select Guest'
              : step === 'room'
                ? 'Select Room'
                : step === 'dates'
                  ? 'Choose Dates'
                  : 'Confirm Booking'}
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
                  : 'bg-muted',
              )}
            />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {/* Step 1: Guest Selection */}
          {step === 'guest' && (
            <div className="space-y-3">
              {/* Toggle between existing/new guest */}
              <div className="flex gap-2">
                <Button
                  variant={!showNewGuestForm ? 'default' : 'outline'}
                  size="sm"
                  className={!showNewGuestForm ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  onClick={() => {
                    setShowNewGuestForm(false)
                    setGuestSearch('')
                  }}
                >
                  <Search className="mr-2 h-3.5 w-3.5" />
                  Existing Guest
                </Button>
                <Button
                  variant={showNewGuestForm ? 'default' : 'outline'}
                  size="sm"
                  className={showNewGuestForm ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  onClick={() => {
                    setShowNewGuestForm(true)
                    setGuestSearch('')
                  }}
                >
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  New Guest
                </Button>
              </div>

              {!showNewGuestForm ? (
                <>
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
                    {filteredGuests.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>No guests found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewGuestForm(true)}
                        >
                          <UserPlus className="mr-2 h-3.5 w-3.5" />
                          Create New Guest
                        </Button>
                      </div>
                    ) : (
                      filteredGuests.map((guest) => (
                        <button
                          key={guest.id}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            selectedGuestId === guest.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'hover:bg-muted',
                          )}
                          onClick={() => setSelectedGuestId(guest.id)}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                              guest.vip
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {guest.firstName[0]}
                            {guest.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {guest.firstName} {guest.lastName}
                              </span>
                              {guest.vip && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1"
                                >
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {guest.email || ''} · {guest.nationality || ''}
                            </span>
                          </div>
                          {selectedGuestId === guest.id && (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* New Guest Form */
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold">Create New Guest</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-first-name">First Name *</Label>
                      <Input
                        id="new-first-name"
                        placeholder="John"
                        value={newGuestFirstName}
                        onChange={(e) => setNewGuestFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-last-name">Last Name *</Label>
                      <Input
                        id="new-last-name"
                        placeholder="Doe"
                        value={newGuestLastName}
                        onChange={(e) => setNewGuestLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="john@example.com"
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-phone">Phone</Label>
                    <Input
                      id="new-phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={newGuestPhone}
                      onChange={(e) => setNewGuestPhone(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleCreateGuest}
                    disabled={creatingGuest || !newGuestFirstName.trim() || !newGuestLastName.trim()}
                  >
                    {creatingGuest ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Guest & Select
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Room Selection */}
          {step === 'room' && (
            <div className="space-y-3">
              <Label>Select Room</Label>
              <div className="max-h-60 space-y-1.5 overflow-y-auto">
                {availableRooms.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    No rooms available for the selected dates
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <button
                      key={room.id}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        selectedRoomId === room.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'hover:bg-muted',
                      )}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {room.roomNumber}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] capitalize"
                          >
                            {room.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {room.name}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Up to {room.maxGuests} guests</span>
                          <span>·</span>
                          <span className="font-medium">
                            {formatCurrency(room.basePrice, currency)}/night
                          </span>
                        </div>
                      </div>
                      {selectedRoomId === room.id && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))
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
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !checkIn && 'text-muted-foreground',
                        )}
                      >
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
                        disabled={(date) =>
                          isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !checkOut && 'text-muted-foreground',
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {checkOut
                          ? format(checkOut, 'MMM d, yyyy')
                          : 'Select date'}
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
                  <span className="ml-2 font-semibold text-emerald-700">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Number of Guests</Label>
                <Select
                  value={String(numGuests)}
                  onValueChange={(v) => setNumGuests(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.name}
                      </SelectItem>
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

              {/* Dynamic Pricing Breakdown */}
              {loadingPricing && (
                <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating dynamic pricing...
                </div>
              )}

              {!loadingPricing && pricingBreakdown && (
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Price Breakdown
                  </div>

                  {/* Nightly prices */}
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {pricingBreakdown.nightlyPrices.map((night) => {
                      const hasAdjustment = night.appliedRules.length > 0
                      return (
                        <div key={night.date} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {format(new Date(night.date + 'T12:00:00'), 'EEE, MMM d')}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasAdjustment && night.basePrice !== night.finalPrice && (
                              <span className="text-muted-foreground line-through">
                                {formatCurrency(night.basePrice, currency)}
                              </span>
                            )}
                            <span className={cn(
                              'font-medium',
                              night.finalPrice < night.basePrice ? 'text-emerald-600' :
                              night.finalPrice > night.basePrice ? 'text-red-600' : ''
                            )}>
                              {formatCurrency(night.finalPrice, currency)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Applied rules summary */}
                  {allAppliedRules.length > 0 && (
                    <div className="space-y-1">
                      {allAppliedRules.map((rule) => (
                        <div key={rule.ruleType + rule.name} className="flex items-center gap-1.5 text-xs">
                          {rule.adjustmentType === 'percentage' ? (
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {rule.name}
                            {rule.count > 1 && <span> (×{rule.count})</span>}
                          </span>
                          <span className={cn(
                            'font-medium',
                            rule.adjustmentValue > 0 ? 'text-red-600' :
                            rule.adjustmentValue < 0 ? 'text-emerald-600' : ''
                          )}>
                            {rule.adjustmentValue > 0 ? '+' : ''}
                            {rule.adjustmentType === 'percentage'
                              ? `${rule.adjustmentValue}%`
                              : formatCurrency(Math.abs(rule.adjustmentValue), currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base total</span>
                      <span>{formatCurrency(pricingBreakdown.baseTotal, currency)}</span>
                    </div>
                    {pricingBreakdown.adjustmentsTotal !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Adjustments</span>
                        <span className={cn(
                          'font-medium',
                          pricingBreakdown.adjustmentsTotal > 0 ? 'text-red-600' : 'text-emerald-600'
                        )}>
                          {pricingBreakdown.adjustmentsTotal > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(pricingBreakdown.adjustmentsTotal), currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold">
                      <span>Subtotal</span>
                      <span>{formatCurrency(pricingBreakdown.dynamicTotal, currency)}</span>
                    </div>
                  </div>
                </div>
              )}
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
                    <span className="font-medium">
                      {selectedGuest?.firstName} {selectedGuest?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-medium">
                      {selectedRoom?.roomNumber} - {selectedRoom?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">
                      {checkIn && format(checkIn, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">
                      {checkOut && format(checkOut, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{numGuests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel</span>
                    <span className="font-medium">
                      {selectedChannel?.name || '—'}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Full Pricing Breakdown */}
                {pricingBreakdown && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Pricing Details
                    </h4>

                    {pricingBreakdown.baseTotal !== pricingBreakdown.dynamicTotal && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base price ({nights} nights)</span>
                          <span>{formatCurrency(pricingBreakdown.baseTotal, currency)}</span>
                        </div>
                        {allAppliedRules.map((rule) => (
                          <div key={rule.ruleType + rule.name} className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              {rule.adjustmentValue > 0 ? (
                                <TrendingUp className="h-3 w-3 text-red-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-emerald-500" />
                              )}
                              {rule.name}{rule.count > 1 ? ` (×${rule.count})` : ''}
                            </span>
                            <span className={cn(
                              'font-medium',
                              rule.adjustmentValue > 0 ? 'text-red-600' : 'text-emerald-600'
                            )}>
                              {rule.adjustmentValue > 0 ? '+' : '-'}
                              {formatCurrency(Math.abs(rule.adjustmentValue * rule.count), currency)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(pricingBreakdown.dynamicTotal, currency)}</span>
                        </div>
                      </>
                    )}

                    {pricingBreakdown.baseTotal === pricingBreakdown.dynamicTotal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(selectedRoom?.basePrice || 0, currency)} × {nights} nights
                        </span>
                        <span>{formatCurrency(pricingBreakdown.dynamicTotal, currency)}</span>
                      </div>
                    )}

                    {/* Coupon discount */}
                    {couponValidation?.valid && couponValidation.discount ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 flex items-center gap-1.5">
                          <Tag className="h-3 w-3" />
                          Coupon &ldquo;{couponValidation.code}&rdquo;
                          {couponValidation.type === 'percentage' && ` (${couponValidation.value}%)`}
                          {couponValidation.type === 'free_nights' && ` (${couponValidation.value} free night${couponValidation.value > 1 ? 's' : ''})`}
                        </span>
                        <span className="font-medium text-emerald-600">
                          -{formatCurrency(couponValidation.discount, currency)}
                        </span>
                      </div>
                    ) : null}

                    <Separator />

                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <div className="text-right">
                        <span className="text-xl font-bold">
                          {formatCurrency(finalTotalWithCoupon, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Code Input */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Code
                </Label>
                {couponValidation?.valid ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="text-sm font-medium text-emerald-700">
                          {couponValidation.code}
                        </span>
                        <p className="text-xs text-emerald-600">
                          {couponValidation.type === 'percentage' && `${couponValidation.value}% discount applied`}
                          {couponValidation.type === 'fixed' && `${formatCurrency(couponValidation.discount, currency)} discount applied`}
                          {couponValidation.type === 'free_nights' && `${couponValidation.value} free night(s) - ${formatCurrency(couponValidation.discount, currency)} off`}
                          {couponValidation.remainingUses !== null && couponValidation.remainingUses !== undefined && (
                            <span className="ml-1">({couponValidation.remainingUses} uses remaining)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      disabled={validatingCoupon}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim() || validatingCoupon}
                    >
                      {validatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                )}
                {couponValidation && !couponValidation.valid && (
                  <p className="text-xs text-red-600">{couponValidation.reason}</p>
                )}
              </div>

              {specialRequests && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Special Requests
                  </span>
                  <p className="mt-1 text-sm">{specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'guest' && (
            <Button
              variant="outline"
              onClick={() =>
                setStep(
                  step === 'confirm'
                    ? 'dates'
                    : step === 'dates'
                      ? 'room'
                      : 'guest',
                )
              }
            >
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
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Booking'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
