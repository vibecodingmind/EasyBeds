'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Hotel, MapPin, Clock, Phone, Shield, CheckCircle2,
  AlertTriangle, Loader2, CreditCard, Calendar, ChevronRight,
  User, FileCheck, BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CheckinData {
  id: string
  confirmationCode: string
  checkInDate: string
  checkOutDate: string
  numNights: number
  numGuests: number
  totalPrice: number
  currency: string
  specialRequests: string | null
  paymentStatus: string
  portalAccessCode: string
  room: {
    id: string; name: string; roomNumber: string; type: string;
    amenities: string | null; description: string | null; floor: number | null
  }
  guest: {
    id: string; firstName: string; lastName: string; email: string | null;
    phone: string | null; idNumber: string | null; idType: string | null; nationality: string | null
  }
  hotel: {
    id: string; name: string; address: string | null; city: string | null; country: string;
    checkInTime: string; checkOutTime: string; currency: string; selfCheckInEnabled: boolean
  }
}

function parseAmenities(amenities: string | null): string[] {
  if (!amenities) return []
  try { return JSON.parse(amenities) } catch { return [] }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const steps = ['Verify', 'ID Info', 'Confirm', 'Complete']

export default function SelfCheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const [data, setData] = useState<CheckinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInResult, setCheckInResult] = useState<{ roomNumber: string; guestName: string; hotelName: string } | null>(null)
  const [idNumber, setIdNumber] = useState('')
  const [idType, setIdType] = useState('')
  const [nationality, setNationality] = useState('')
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const token = React.use(params)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/checkin/${token}`)
        const json = await res.json()
        if (!json.success) {
          setError(json.error || 'Check-in not available')
          return
        }
        setData(json.data)
        if (json.data.guest.idNumber) setIdNumber(json.data.guest.idNumber)
        if (json.data.guest.idType) setIdType(json.data.guest.idType)
        if (json.data.guest.nationality) setNationality(json.data.guest.nationality)
      } catch { setError('Network error. Please try again.') } finally { setLoading(false) }
    }
    fetchData()
  }, [token])

  const handleCheckIn = async () => {
    if (!data || !idNumber.trim() || !idType) return
    setCheckingIn(true)
    setCheckInError(null)
    try {
      const res = await fetch(`/api/checkin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: idNumber.trim(), idType, nationality: nationality.trim() }),
      })
      const json = await res.json()
      if (!json.success) {
        setCheckInError(json.error || 'Check-in failed')
        return
      }
      setCheckInResult({
        roomNumber: json.data.roomNumber,
        guestName: json.data.guestName,
        hotelName: json.data.hotelName,
      })
      setStep(3)
    } catch { setCheckInError('Network error') } finally { setCheckingIn(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading check-in...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Check-In Not Available</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const amenities = parseAmenities(data.room.amenities)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-emerald-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{data.hotel.name}</h1>
              <p className="text-emerald-200 text-sm">Self Check-In</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600' : 'bg-gray-100 text-gray-400'
                )}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-sm font-medium hidden sm:block', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 w-8 sm:w-16 rounded', i < step ? 'bg-emerald-600' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Verify */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" /> Verify Your Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Please confirm these details are correct:</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Guest</p>
                  <p className="font-medium">{data.guest.firstName} {data.guest.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Confirmation</p>
                  <p className="font-mono font-medium">{data.confirmationCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="font-medium">{data.room.name} ({data.room.roomNumber})</p>
                  <Badge variant="outline" className="capitalize text-xs mt-1">{data.room.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dates</p>
                  <p className="font-medium text-sm">{formatDate(data.checkInDate)}</p>
                  <p className="font-medium text-sm">→ {formatDate(data.checkOutDate)}</p>
                  <p className="text-xs text-gray-500">{data.numNights} night{data.numNights > 1 ? 's' : ''}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(data.totalPrice, data.currency)}</p>
                  <Badge variant={data.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-xs">
                    {data.paymentStatus}
                  </Badge>
                </div>
              </div>
              {amenities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Room Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <Badge key={i} variant="outline" className="capitalize text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <Clock className="h-4 w-4" />
                <span>Check-in from: {data.hotel.checkInTime} · Check-out by: {data.hotel.checkOutTime}</span>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(1)} className="bg-emerald-600 hover:bg-emerald-700">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: ID Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" /> Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Please provide your identification details as required by local regulations.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type *</Label>
                  <select
                    id="idType"
                    value={idType}
                    onChange={e => setIdType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select ID type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Enter your ID number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Tanzanian" />
                </div>
              </div>
              {checkInError && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {checkInError}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!idType || !idNumber.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Review <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm Check-In */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-600" /> Confirm Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-2">
                <p className="font-medium text-emerald-800">You are about to check in to:</p>
                <div className="text-sm text-emerald-700 space-y-1">
                  <p><strong>Hotel:</strong> {data.hotel.name}</p>
                  <p><strong>Room:</strong> {data.room.name} ({data.room.roomNumber})</p>
                  <p><strong>Dates:</strong> {formatDate(data.checkInDate)} — {formatDate(data.checkOutDate)}</p>
                  <p><strong>Guest:</strong> {data.guest.firstName} {data.guest.lastName}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">ID Information</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> <span className="capitalize">{idType.replace('_', ' ')}</span></p>
                  <p><strong>Number:</strong> {idNumber}</p>
                  {nationality && <p><strong>Nationality:</strong> {nationality}</p>}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                By completing self check-in, you confirm that all information provided is accurate and agree to the hotel&apos;s terms and conditions.
              </div>
              {checkInError && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {checkInError}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {checkingIn ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Check-In</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && checkInResult && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-700">Welcome!</h2>
                <p className="text-gray-600 mt-1">Your check-in is complete</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-lg font-bold text-emerald-800">
                  <Hotel className="h-5 w-5" />
                  Room {checkInResult.roomNumber}
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p><strong>Guest:</strong> {checkInResult.guestName}</p>
                  <p><strong>Check-out:</strong> {formatDate(data!.checkOutDate)} by {data!.hotel.checkOutTime}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Your room is ready. Please proceed to the front desk if you need a physical key card.</p>
                <p>Enjoy your stay at {checkInResult.hotelName}!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
