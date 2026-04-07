'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Hotel, MapPin, Clock, Phone, Mail, Globe, CreditCard,
  MessageSquare, Upload, Calendar, X, Send, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, User, FileText, LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { formatCurrency } from '@/lib/currency'

interface PortalData {
  id: string
  confirmationCode: string
  checkInDate: string
  checkOutDate: string
  numNights: number
  numGuests: number
  pricePerNight: number
  totalPrice: number
  currency: string
  status: string
  specialRequests: string | null
  paymentStatus: string
  depositPaid: boolean
  balanceDue: number
  portalAccessCode: string
  room: { id: string; name: string; roomNumber: string; type: string; amenities: string | null; description: string | null }
  guest: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; idNumber: string | null; idType: string | null; nationality: string | null }
  channel: { id: string; name: string; type: string }
  hotel: {
    id: string; name: string; description: string | null; address: string | null;
    city: string | null; country: string; phone: string | null; email: string | null;
    website: string | null; logoUrl: string | null; checkInTime: string;
    checkOutTime: string; currency: string; timezone: string; selfCheckInEnabled: boolean
  }
  guestMessages: { id: string; role: string; content: string; createdAt: string; isRead: boolean }[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function GuestPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [specialRequests, setSpecialRequests] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idType, setIdType] = useState('')
  const [nationality, setNationality] = useState('')
  const [saving, setSaving] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    booking: true, hotel: true, messages: true, profile: false, actions: true
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const token = React.use(params)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/portal/${token}`)
        const json = await res.json()
        if (!json.success) {
          setError(json.error || 'Failed to load booking')
          return
        }
        setData(json.data)
        setSpecialRequests(json.data.specialRequests || '')
        setPhone(json.data.guest.phone || '')
        setIdNumber(json.data.guest.idNumber || '')
        setIdType(json.data.guest.idType || '')
        setNationality(json.data.guest.nationality || '')
      } catch (e) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.guestMessages])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSaveProfile = useCallback(async () => {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, specialRequests, idNumber, idType, nationality })
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to save')
        return
      }
      // Refresh data
      const fresh = await fetch(`/api/portal/${token}`)
      const freshJson = await fresh.json()
      if (freshJson.success) setData(freshJson.data)
      alert('Information saved successfully!')
    } catch { alert('Network error') } finally { setSaving(false) }
  }, [data, token, phone, specialRequests, idNumber, idType, nationality])

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/portal/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      })
      const json = await res.json()
      if (!json.success) { alert(json.error || 'Failed to send'); return }
      setMessage('')
      const fresh = await fetch(`/api/portal/${token}`)
      const freshJson = await fresh.json()
      if (freshJson.success) setData(freshJson.data)
    } catch { alert('Network error') } finally { setSendingMessage(false) }
  }, [message, token])

  const handleCancelBooking = useCallback(async () => {
    if (!data || !cancelReason.trim()) return
    try {
      const res = await fetch(`/api/bookings/${data.id}?hotelId=${data.hotelId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) { alert(json.error || 'Failed to cancel'); return }
      const fresh = await fetch(`/api/portal/${token}`)
      const freshJson = await fresh.json()
      if (freshJson.success) setData(freshJson.data)
      setCancelReason('')
    } catch { alert('Network error') }
  }, [data, cancelReason, token])

  const handleRequestEarlyCheckIn = useCallback(async () => {
    if (!data) return
    const msg = 'I would like to request an early check-in for my booking. Is this possible?'
    try {
      await fetch(`/api/portal/${token}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: msg })
      })
      const fresh = await fetch(`/api/portal/${token}`)
      const freshJson = await fresh.json()
      if (freshJson.success) setData(freshJson.data)
    } catch { alert('Failed to send request') }
  }, [data, token])

  const handleRequestLateCheckOut = useCallback(async () => {
    if (!data) return
    const msg = 'I would like to request a late check-out for my booking. Is this possible?'
    try {
      await fetch(`/api/portal/${token}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: msg })
      })
      const fresh = await fetch(`/api/portal/${token}`)
      const freshJson = await fresh.json()
      if (freshJson.success) setData(freshJson.data)
    } catch { alert('Failed to send request') }
  }, [data, token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your booking...</p>
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
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">{error || 'Booking not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const amenities = parseAmenities(data.room.amenities)
  const isCancellable = ['pending', 'confirmed'].includes(data.status)
  const canCheckIn = data.hotel.selfCheckInEnabled && data.status === 'confirmed' &&
    new Date(data.checkInDate) <= new Date(new Date().toDateString())

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Hotel className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{data.hotel.name}</h1>
                <p className="text-emerald-200 text-sm">Guest Portal</p>
              </div>
            </div>
            <Badge className={`text-xs font-medium ${statusColors[data.status] || 'bg-gray-100'}`}>
              {statusLabels[data.status] || data.status}
            </Badge>
          </div>
          <p className="mt-2 text-emerald-100 text-sm">
            Confirmation: <span className="font-mono font-bold text-white">{data.confirmationCode}</span>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Quick Actions */}
        {(canCheckIn || isCancellable) && (
          <div className="flex flex-wrap gap-3">
            {canCheckIn && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href={`/portal/${data.portalAccessCode}/checkin`}>
                  <LogIn className="h-4 w-4 mr-2" /> Self Check-In
                </a>
              </Button>
            )}
            {isCancellable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <X className="h-4 w-4 mr-2" /> Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your booking? Cancellation fees may apply based on the hotel's policy. Please provide a reason.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Reason for cancellation..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="my-3"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelBooking} disabled={!cancelReason.trim()}>
                      Yes, Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('booking')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" /> Booking Details
              </CardTitle>
              {expandedSections.booking ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.booking && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="font-medium">{data.room.name} ({data.room.roomNumber})</p>
                  <Badge variant="outline" className="capitalize">{data.room.type}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Dates</p>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs text-gray-400">Check-in</p>
                      <p className="font-medium text-sm">{formatDate(data.checkInDate)}</p>
                    </div>
                    <span className="text-gray-300">→</span>
                    <div>
                      <p className="text-xs text-gray-400">Check-out</p>
                      <p className="font-medium text-sm">{formatDate(data.checkOutDate)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{data.numNights} night{data.numNights > 1 ? 's' : ''} · {data.numGuests} guest{data.numGuests > 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Guest</p>
                  <p className="font-medium">{data.guest.firstName} {data.guest.lastName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Booked via</p>
                  <p className="font-medium capitalize">{data.channel.name} ({data.channel.type})</p>
                </div>
              </div>
              <Separator />
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Price per night</span>
                  <span className="font-medium">{formatCurrency(data.pricePerNight, data.currency)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{data.numNights} nights</span>
                  <span className="font-medium">{formatCurrency(data.pricePerNight * data.numNights, data.currency)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-700">{formatCurrency(data.totalPrice, data.currency)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-500">Payment status</span>
                  <Badge variant={data.paymentStatus === 'paid' ? 'default' : data.paymentStatus === 'partial' ? 'secondary' : 'outline'}>
                    {data.paymentStatus}
                  </Badge>
                </div>
                {data.balanceDue > 0 && (
                  <div className="flex items-center justify-between mt-1 text-sm">
                    <span className="text-gray-500">Balance due</span>
                    <span className="text-orange-600 font-medium">{formatCurrency(data.balanceDue, data.currency)}</span>
                  </div>
                )}
              </div>
              {data.room.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Room Description</p>
                  <p className="text-sm text-gray-700">{data.room.description}</p>
                </div>
              )}
              {amenities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <Badge key={i} variant="outline" className="capitalize text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {data.specialRequests && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                  <p className="text-sm text-gray-700 bg-yellow-50 rounded p-3 border border-yellow-100">{data.specialRequests}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Hotel Information */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('hotel')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hotel className="h-5 w-5 text-emerald-600" /> Hotel Information
              </CardTitle>
              {expandedSections.hotel ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.hotel && (
            <CardContent>
              {data.hotel.description && <p className="text-sm text-gray-700 mb-4">{data.hotel.description}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-gray-600">{data.hotel.address || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{data.hotel.city}, {data.hotel.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Check-in / Check-out</p>
                    <p className="text-sm text-gray-600">Check-in from: {data.hotel.checkInTime}</p>
                    <p className="text-sm text-gray-600">Check-out by: {data.hotel.checkOutTime}</p>
                  </div>
                </div>
                {data.hotel.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{data.hotel.phone}</p>
                    </div>
                  </div>
                )}
                {data.hotel.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{data.hotel.email}</p>
                    </div>
                  </div>
                )}
                {data.hotel.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Website</p>
                      <p className="text-sm text-emerald-600 break-all">{data.hotel.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quick Request Actions */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('actions')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Quick Requests
              </CardTitle>
              {expandedSections.actions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.actions && (
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-4" onClick={handleRequestEarlyCheckIn}>
                  <Clock className="h-4 w-4 mr-3 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Early Check-In</p>
                    <p className="text-xs text-gray-500">Request to check in before {data.hotel.checkInTime}</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4" onClick={handleRequestLateCheckOut}>
                  <Clock className="h-4 w-4 mr-3 text-orange-500" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Late Check-Out</p>
                    <p className="text-xs text-gray-500">Request to check out after {data.hotel.checkOutTime}</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Messaging */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('messages')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" /> Messages
                {data.guestMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{data.guestMessages.length}</Badge>
                )}
              </CardTitle>
              {expandedSections.messages ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.messages && (
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3 mb-4 p-2">
                {data.guestMessages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No messages yet. Send a message to the hotel staff.</p>
                ) : (
                  data.guestMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'guest' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                        msg.role === 'guest'
                          ? 'bg-emerald-600 text-white'
                          : msg.role === 'ai'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-80 capitalize">
                            {msg.role === 'guest' ? 'You' : msg.role === 'ai' ? 'AI Concierge' : 'Staff'}
                          </span>
                          <span className="text-xs opacity-60">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={sendingMessage || !message.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Profile / ID Upload */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('profile')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" /> My Information
              </CardTitle>
              {expandedSections.profile ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.profile && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <select
                    id="idType"
                    value={idType}
                    onChange={e => setIdType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select ID type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Enter ID number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Tanzanian" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or preferences..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Saving...' : <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Information</>}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-400">
        <p>Powered by EasyBeds</p>
      </div>
    </div>
  )
}
