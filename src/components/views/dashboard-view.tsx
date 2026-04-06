'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  LogIn,
  LogOut,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CalendarDays,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import {
  mockRooms,
  mockBookings,
  mockGuests,
  getGuestById,
  getRoomById,
  getChannelById,
  getTodayCheckIns,
  getTodayCheckOuts,
  getOccupancyRate,
  getMonthlyRevenue,
  getUpcomingArrivals,
} from '@/lib/mock-data'
import { format, isToday, addDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export function DashboardView() {
  const { bookings, rooms, guests, setShowNewBookingDialog, setCurrentView, setSelectedBookingId } =
    useAppStore()

  const allBookings = bookings.length > 0 ? bookings : mockBookings
  const allRooms = rooms.length > 0 ? rooms : mockRooms
  const allGuests = guests.length > 0 ? guests : mockGuests

  const todayCheckIns = getTodayCheckIns()
  const todayCheckOuts = getTodayCheckOuts()
  const occupancyRate = getOccupancyRate()
  const monthlyRevenue = getMonthlyRevenue()
  const upcomingArrivals = getUpcomingArrivals(3)

  const recentBookings = allBookings
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const stats = [
    {
      title: "Today's Check-ins",
      value: todayCheckIns.length,
      icon: LogIn,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: "Today's Check-outs",
      value: todayCheckOuts.length,
      icon: LogOut,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Revenue This Month',
      value: `$${monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Quick actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowNewBookingDialog(true)}
        >
          + New Booking
        </Button>
        <Button variant="outline" onClick={() => setCurrentView('calendar')}>
          <CalendarDays className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      stat.bg
                    )}
                  >
                    <stat.icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Recent Bookings
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('bookings')}
              >
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead className="hidden sm:table-cell">Room</TableHead>
                    <TableHead className="hidden md:table-cell">Check-in</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => {
                    const guest = getGuestById(booking.guestId)
                    const room = getRoomById(booking.roomId)
                    return (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedBookingId(booking.id)
                        }}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {guest?.firstName} {guest?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {booking.confirmationCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {room?.number} - {room?.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(parseISO(booking.checkIn), 'MMM d')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs capitalize',
                              statusColors[booking.status]
                            )}
                          >
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Arrivals */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Upcoming Arrivals
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Next 3 days
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingArrivals.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No upcoming arrivals
                  </p>
                ) : (
                  upcomingArrivals.map((booking) => {
                    const guest = getGuestById(booking.guestId)
                    const room = getRoomById(booking.roomId)
                    const channel = getChannelById(booking.channel)
                    return (
                      <div
                        key={booking.id}
                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {guest?.firstName} {guest?.lastName}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Room {room?.number}</span>
                            <span>·</span>
                            <span>{format(parseISO(booking.checkIn), 'MMM d')}</span>
                            <span>→</span>
                            <span>{format(parseISO(booking.checkOut), 'MMM d')}</span>
                          </div>
                          {channel && (
                            <span className="text-[10px] text-muted-foreground">
                              via {channel.name}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Room Status Overview */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Room Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {allRooms.map((room) => {
                const statusColor = {
                  available: 'border-emerald-200 bg-emerald-50',
                  occupied: 'border-blue-200 bg-blue-50',
                  maintenance: 'border-amber-200 bg-amber-50',
                  out_of_service: 'border-red-200 bg-red-50',
                }[room.status]

                const statusDot = {
                  available: 'bg-emerald-500',
                  occupied: 'bg-blue-500',
                  maintenance: 'bg-amber-500',
                  out_of_service: 'bg-red-500',
                }[room.status]

                return (
                  <div
                    key={room.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      statusColor
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {room.number}
                      </span>
                      <div className={cn('h-2 w-2 rounded-full', statusDot)} />
                    </div>
                    <p className="text-xs text-muted-foreground">{room.name}</p>
                    <p className="mt-1 text-xs font-medium capitalize text-muted-foreground">
                      {room.status.replace('_', ' ')}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
