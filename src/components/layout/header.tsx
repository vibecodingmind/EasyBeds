'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Sun,
  Moon,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
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
  booking_confirmation: 'text-emerald-400 bg-emerald-500/15',
  booking_reminder: 'text-emerald-400 bg-emerald-500/15',
  pre_arrival: 'text-cyan-400 bg-cyan-500/15',
  post_checkout: 'text-slate-400 bg-slate-500/15',
  payment_receipt: 'text-amber-400 bg-amber-500/15',
  review_request: 'text-purple-400 bg-purple-500/15',
  cancellation: 'text-red-400 bg-red-500/15',
  low_balance: 'text-orange-400 bg-orange-500/15',
  housekeeping_alert: 'text-amber-400 bg-amber-500/15',
  system_alert: 'text-slate-400 bg-slate-500/15',
  custom: 'text-slate-400 bg-slate-500/15',
}

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

// ─── Path → Title mapping ──────────────────────────────────────────────────

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/calendar': 'Room Calendar',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/rooms': 'Room Management',
  '/dashboard/guests': 'Guest Directory',
  '/dashboard/channels': 'Channel Manager',
  '/dashboard/housekeeping': 'Housekeeping',
  '/dashboard/reports': 'Reports & Analytics',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/revenue': 'Revenue & Pricing',
  '/dashboard/rate-parity': 'Rate Parity',
  '/dashboard/concierge': 'AI Concierge',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/loyalty': 'Loyalty',
  '/dashboard/activity': 'Activity Log',
  '/dashboard/night-audit': 'Night Audit',
  '/dashboard/settings': 'Settings',
  '/dashboard/subscription': 'Subscription & Billing',
  '/dashboard/admin': 'Platform Admin',
}

// ─── Notification Bell Component ──────────────────────────────────────────

function NotificationBell() {
  const router = useRouter()
  const { currentHotelId } = useAppStore()
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
      // Silently fail
    }
  }, [currentHotelId])

  useEffect(() => {
    if (!currentHotelId) return

    if (open && !prevOpenRef.current) {
      setLoading(true)
      fetchNotifications().finally(() => setLoading(false))
    }

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

  useEffect(() => {
    if (!currentHotelId) return
    fetchNotifications()
  }, [currentHotelId, fetchNotifications])

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
        <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/10" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 border-white/10 bg-gray-900/95 backdrop-blur-xl p-0 sm:w-96"
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
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              <p className="text-sm text-white/40">Loading notifications…</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto gap-1.5 px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-white/10"
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

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                  <Bell className="h-8 w-8 text-white/20" />
                  <p className="text-sm font-medium text-white/40">No new notifications</p>
                  <p className="text-xs text-white/30">
                    We&apos;ll let you know when something arrives
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[360px]">
                  <div className="flex flex-col">
                    {notifications.map((notification, index) => {
                      const Icon = NOTIFICATION_ICONS[notification.type] || Bell
                      const colorClass =
                        NOTIFICATION_COLORS[notification.type] || 'text-slate-400 bg-slate-500/15'
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
                          className={`flex w-full items-start gap-3 border-b border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/10 ${
                            unread ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm leading-snug ${
                                  unread ? 'font-semibold text-white' : 'font-medium text-white/70'
                                }`}
                              >
                                {title}
                              </p>
                              {unread && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            {description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
                                {description}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-white/30">
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

              {notifications.length > 0 && (
                <div className="border-t border-white/10 px-4 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-white/10"
                    onClick={() => {
                      setOpen(false)
                      router.push('/dashboard/activity')
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
  const pathname = usePathname()
  const router = useRouter()
  const {
    toggleSidebar,
    setShowNewBookingDialog,
    logout,
    currentUser,
    hotel,
    userRole,
  } = useAppStore()

  const initials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const hotelName = hotel?.name || 'EasyBeds'
  const pageTitle = PATH_TITLES[pathname] || 'Dashboard'

  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b dark:border-white/10 border-gray-200 dark:bg-gray-900/60 bg-white/80 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-tight dark:text-white text-gray-900">
          {pageTitle}
        </h1>
        <p className="hidden text-xs dark:text-white/50 text-gray-500 sm:block">
          {hotelName}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 dark:text-white/30 text-gray-400" />
        <Input
          placeholder="Search bookings, guests..."
          className="w-64 dark:border-white/10 dark:bg-white/5 dark:text-white border-gray-300 bg-gray-50 pl-9 dark:placeholder:text-white/30 placeholder:text-gray-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
        />
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* Theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>

      {/* New booking quick action */}
      <Button
        className="hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 sm:flex border-0"
        onClick={() => setShowNewBookingDialog(true)}
      >
        + New Booking
      </Button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
            <Avatar className="h-9 w-9">
              {currentUser?.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser?.name || 'User'} />
              )}
              <AvatarFallback className="bg-emerald-500/20 border border-emerald-500/30 text-sm text-emerald-400">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-white/10 bg-gray-900/95 backdrop-blur-xl">
          <DropdownMenuLabel className="font-normal text-white">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{currentUser?.name}</p>
                {userRole && (
                  <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-[10px] font-normal capitalize text-emerald-400">
                    {userRole}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/50">
                {currentUser?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="text-white/70 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10">
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="text-white/70 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10">
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-white/10 focus:text-red-300 focus:bg-white/10" onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
