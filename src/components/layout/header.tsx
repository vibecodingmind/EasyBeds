'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Menu,
  Bell,
  Search,
  CalendarCheck,
  CreditCard,
  Star,
  XCircle,
  AlertTriangle,
  Info,
  BellRing,
  CheckCheck,
  Loader2,
  Mail,
  MessageSquare,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { api, type NotificationItem } from '@/lib/api'
import { timeAgo } from '@/lib/time-ago'
import { toast } from 'sonner'

// ─── Notification type → icon mapping ─────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  booking_confirmation: CalendarCheck,
  booking_reminder: CalendarCheck,
  pre_arrival: CalendarCheck,
  post_checkout: CalendarCheck,
  payment_receipt: CreditCard,
  review_request: Star,
  cancellation: XCircle,
  low_balance: CreditCard,
  housekeeping_alert: AlertTriangle,
  system_alert: Info,
  custom: BellRing,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  booking_confirmation: 'text-emerald-600 bg-emerald-50',
  booking_reminder: 'text-emerald-600 bg-emerald-50',
  pre_arrival: 'text-blue-600 bg-blue-50',
  post_checkout: 'text-slate-600 bg-slate-50',
  payment_receipt: 'text-amber-600 bg-amber-50',
  review_request: 'text-purple-600 bg-purple-50',
  cancellation: 'text-red-600 bg-red-50',
  low_balance: 'text-orange-600 bg-orange-50',
  housekeeping_alert: 'text-amber-600 bg-amber-50',
  system_alert: 'text-slate-600 bg-slate-50',
  custom: 'text-slate-600 bg-slate-50',
}

// ─── Human-readable type labels ──────────────────────────────────────────

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  booking_confirmation: 'Booking Confirmed',
  booking_reminder: 'Booking Reminder',
  pre_arrival: 'Pre-arrival Notice',
  post_checkout: 'Post Checkout',
  payment_receipt: 'Payment Receipt',
  review_request: 'Review Request',
  cancellation: 'Cancellation',
  low_balance: 'Low Balance Alert',
  housekeeping_alert: 'Housekeeping Alert',
  system_alert: 'System Alert',
  custom: 'Notification',
}

function getNotificationTitle(n: NotificationItem): string {
  if (n.subject) return n.subject
  return NOTIFICATION_TYPE_LABELS[n.type] || 'Notification'
}

function getNotificationDescription(n: NotificationItem): string | null {
  if (n.body) {
    // Truncate body to ~100 chars
    const text = n.body.replace(/<[^>]*>/g, '').trim()
    if (text.length > 100) return text.slice(0, 100) + '...'
    return text.length > 0 ? text : null
  }
  return null
}

function isUnread(n: NotificationItem): boolean {
  return n.status === 'pending' || n.status === 'sent' || n.status === 'delivered'
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'whatsapp': return MessageSquare
    case 'in_app': return Bell
    default: return Mail
  }
}

// ─── View titles ──────────────────────────────────────────────────────────

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  calendar: 'Room Calendar',
  bookings: 'Bookings',
  rooms: 'Room Management',
  guests: 'Guest Directory',
  channels: 'Channel Manager',
  reports: 'Reports & Analytics',
  settings: 'Hotel Settings',
}

// ─── Notification Bell Component ──────────────────────────────────────────

function NotificationBell() {
  const { currentHotelId, navigate } = useAppStore()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevOpenRef = useRef(false)

  const unreadCount = notifications.filter(isUnread).length

  const fetchNotifications = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await api.getNotifications(currentHotelId, 20)
      if (res.success) {
        setNotifications(res.data)
      }
    } catch {
      // Silently fail — don't spam console
    }
  }, [currentHotelId])

  // Fetch when popover opens or hotel changes
  useEffect(() => {
    if (!currentHotelId) return

    // Fetch immediately when popover opens
    if (open && !prevOpenRef.current) {
      setLoading(true)
      fetchNotifications().finally(() => setLoading(false))
    }

    // Also refresh in background every 30 seconds
    if (open && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchNotifications()
      }, 30000)
    }

    if (!open && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    prevOpenRef.current = open
  }, [open, currentHotelId, fetchNotifications])

  // Initial fetch on mount
  useEffect(() => {
    if (!currentHotelId) return
    fetchNotifications()
  }, [currentHotelId, fetchNotifications])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const handleMarkAllRead = async () => {
    if (!currentHotelId) return
    const unreadIds = notifications.filter(isUnread).map((n) => n.id)
    if (unreadIds.length === 0) return

    setMarkingAll(true)
    try {
      await Promise.allSettled(
        unreadIds.map((id) => api.markNotificationRead(currentHotelId, id)),
      )
      // Update local state to reflect read status
      setNotifications((prev) =>
        prev.map((n) => {
          if (unreadIds.includes(n.id)) {
            return { ...n, status: 'opened' as const }
          }
          return n
        }),
      )
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark notifications as read')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 sm:w-96"
      >
        <AnimatePresence mode="wait">
          {loading && notifications.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center gap-2 px-4 py-10"
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading notifications…</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto gap-1.5 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-700"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                  >
                    {markingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3 w-3" />
                    )}
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* Notification List */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No new notifications</p>
                  <p className="text-xs text-muted-foreground/70">
                    We&apos;ll let you know when something arrives
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[360px]">
                  <div className="flex flex-col">
                    {notifications.map((notification, index) => {
                      const Icon = NOTIFICATION_ICONS[notification.type] || Bell
                      const colorClass =
                        NOTIFICATION_COLORS[notification.type] || 'text-slate-600 bg-slate-50'
                      const ChannelIcon = getChannelIcon(notification.channel)
                      const title = getNotificationTitle(notification)
                      const description = getNotificationDescription(notification)
                      const unread = isUnread(notification)

                      return (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          onClick={() => setOpen(false)}
                          className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                            unread ? 'bg-emerald-50/60' : ''
                          }`}
                        >
                          {/* Type icon */}
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm leading-snug ${
                                  unread ? 'font-semibold' : 'font-medium'
                                }`}
                              >
                                {title}
                              </p>
                              {unread && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            {description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {description}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                              <ChannelIcon className="h-3 w-3" />
                              <span>{timeAgo(notification.createdAt)}</span>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t px-4 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-emerald-600 hover:text-emerald-700"
                    onClick={() => {
                      setOpen(false)
                      navigate('activity')
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  )
}

// ─── Main Header ──────────────────────────────────────────────────────────

export function AppHeader() {
  const {
    currentView,
    toggleSidebar,
    setShowNewBookingDialog,
    logout,
    currentUser,
    hotel,
  } = useAppStore()

  const initials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const hotelName = hotel?.name || 'EasyBeds'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {viewTitles[currentView] || 'Dashboard'}
        </h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {hotelName}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bookings, guests..." className="w-64 pl-9" />
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* New booking quick action */}
      <Button
        className="hidden bg-emerald-600 hover:bg-emerald-700 sm:flex"
        onClick={() => setShowNewBookingDialog(true)}
      >
        + New Booking
      </Button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-emerald-100 text-sm text-emerald-700">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={logout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
