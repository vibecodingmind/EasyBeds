'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, Send, User, RefreshCw, MessageSquare, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatMessage {
  id: string
  role: string
  content: string
  channel: string
  isRead: boolean
  readAt: string | null
  aiModel: string | null
  createdAt: string
}

interface BookingInfo {
  id: string
  confirmationCode: string
  status: string
  checkInDate: string
  checkOutDate: string
  room?: { name: string; roomNumber: string }
  guest?: { firstName: string; lastName: string }
}

export function ConciergeView() {
  const { currentHotelId } = useAppStore()
  const [selectedBookingId, setSelectedBookingId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingInput, setBookingInput] = useState('')
  const [bookings, setBookings] = useState<BookingInfo[]>([])
  const [loadBookingLoading, setLoadBookingLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = useCallback(async (bookingId: string) => {
    if (!bookingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/chat?bookingId=${bookingId}`)
      const json = await res.json()
      if (json.success) {
        setMessages(json.data.messages)
      }
    } catch {
      console.error('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBookings = useCallback(async () => {
    if (!currentHotelId) return
    setLoadBookingLoading(true)
    try {
      const res = await fetch(`/api/bookings?hotelId=${currentHotelId}&limit=50`)
      const json = await res.json()
      if (json.success) {
        setBookings(json.data.bookings.map((b: BookingInfo & { room?: { name: string; roomNumber: string }; guest?: { firstName: string; lastName: string } }) => ({
          id: b.id,
          confirmationCode: b.confirmationCode,
          status: b.status,
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          room: b.room,
          guest: b.guest,
        })))
      }
    } catch {
      console.error('Failed to load bookings')
    } finally {
      setLoadBookingLoading(false)
    }
  }, [currentHotelId])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setBookingInput('')
    loadChatHistory(bookingId)
  }

  const handleSendStaffMessage = useCallback(async () => {
    if (!selectedBookingId || !inputMessage.trim() || sending) return
    setSending('staff')
    try {
      // For staff messages, we use the portal message endpoint through the booking
      // We need to find the booking's portalAccessCode
      const res = await fetch(`/api/bookings/${selectedBookingId}?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success && json.data.portalAccessCode) {
        await fetch(`/api/portal/${json.data.portalAccessCode}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `[Staff Reply] ${inputMessage}` }),
        })
        setInputMessage('')
        loadChatHistory(selectedBookingId)
      } else {
        alert('Cannot send: booking has no portal access code')
      }
    } catch { alert('Failed to send message') } finally { setSending('') }
  }, [selectedBookingId, inputMessage, sending, currentHotelId, loadChatHistory])

  const handleSendAIMessage = useCallback(async () => {
    if (!selectedBookingId || !inputMessage.trim() || sending) return
    const msgText = inputMessage.trim()
    setInputMessage('')
    setSending('ai')

    // Optimistically add user message
    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'guest',
      content: msgText,
      channel: 'chat',
      isRead: false,
      readAt: null,
      aiModel: null,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const booking = bookings.find(b => b.id === selectedBookingId)
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          message: msgText,
          guestId: booking?.guest ? 'simulated' : 'unknown',
        }),
      })
      const json = await res.json()
      if (json.success) {
        // Replace optimistic message and add AI response
        setMessages(prev => [
          ...prev.filter(m => m.id !== optimisticMsg.id),
          optimisticMsg,
          json.data,
        ])
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        alert(json.error || 'Failed to get AI response')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      alert('Network error')
    } finally { setSending('') }
  }, [selectedBookingId, inputMessage, sending, bookings])

  const filteredBookings = bookings.filter(b =>
    !bookingInput.trim() ||
    b.confirmationCode.toLowerCase().includes(bookingInput.toLowerCase()) ||
    b.guest?.firstName?.toLowerCase().includes(bookingInput.toLowerCase()) ||
    b.guest?.lastName?.toLowerCase().includes(bookingInput.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Concierge</h2>
        <p className="text-muted-foreground">Monitor and manage guest conversations with the AI concierge.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Booking selector */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conversations</CardTitle>
            <Input
              placeholder="Search bookings..."
              value={bookingInput}
              onChange={e => setBookingInput(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[500px]">
              {loadBookingLoading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : filteredBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings found</p>
              ) : (
                <div className="space-y-1">
                  {filteredBookings.map(booking => (
                    <button
                      key={booking.id}
                      onClick={() => handleSelectBooking(booking.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                        selectedBookingId === booking.id ? 'bg-emerald-50 border-emerald-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium">{booking.confirmationCode}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{booking.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.guest ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'Unknown guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.room?.name || 'N/A'} · {new Date(booking.checkInDate).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-3 flex flex-col">
          {selectedBookingId ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-500" />
                      Chat — {bookings.find(b => b.id === selectedBookingId)?.confirmationCode}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {messages.length} messages · Max 20 per booking
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadChatHistory(selectedBookingId)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 max-h-[400px] p-2">
                  {loading ? (
                    <div className="space-y-4 p-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-16 flex-1 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Send a message to start a conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'guest' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role !== 'guest' && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className={
                                msg.role === 'ai'
                                  ? 'bg-purple-100 text-purple-700 text-xs'
                                  : 'bg-emerald-100 text-emerald-700 text-xs'
                              }>
                                {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : 'S'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                            msg.role === 'guest'
                              ? 'bg-emerald-600 text-white'
                              : msg.role === 'ai'
                              ? 'bg-purple-50 text-purple-900 border border-purple-100'
                              : 'bg-gray-50 text-gray-900 border'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${
                                msg.role === 'guest' ? 'text-emerald-200' : msg.role === 'ai' ? 'text-purple-500' : 'text-gray-400'
                              }`}>
                                {msg.role === 'guest' ? 'Guest' : msg.role === 'ai' ? 'AI Concierge' : 'Staff'}
                              </span>
                              <span className={`text-[10px] flex items-center gap-1 ${
                                msg.role === 'guest' ? 'text-emerald-200/60' : 'text-gray-400'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.aiModel && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1">{msg.aiModel}</Badge>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          {msg.role === 'guest' && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2 pt-3 border-t mt-auto">
                  <Input
                    placeholder="Type as guest to test AI..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendAIMessage()
                      }
                    }}
                    disabled={sending === 'ai' || messages.length >= 20}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendAIMessage}
                    disabled={sending === 'ai' || !inputMessage.trim() || messages.length >= 20}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {sending === 'ai' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4 mr-1" />}
                    AI
                  </Button>
                  <Button
                    onClick={handleSendStaffMessage}
                    disabled={sending === 'staff' || !inputMessage.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {sending === 'staff' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Staff
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select a booking to view or start a conversation</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
