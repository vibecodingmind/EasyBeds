'use client'

import React, { useEffect } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

export function DashboardView() {
  const {
    dashboardStats,
    rooms,
    bookings,
    loading,
    fetchDashboard,
    fetchRooms,
    fetchBookings,
    setShowNewBookingDialog,
    setCurrentView,
    setSelectedBookingId,
    hotel,
    currentHotelId,
  } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchDashboard()
      fetchRooms()
      fetchBookings()
    }
  }, [currentHotelId, fetchDashboard, fetchRooms, fetchBookings])

  const isLoading = loading.dashboard && !dashboardStats
  const currency = hotel?.currency || 'USD'

  const formatCurrency = (amount: number) => {
    try {
      return amount.toLocaleString(undefined, { style: 'currency', currency })
    } catch {
      return `${currency} ${amount.toLocaleString()}`
    }
  }

  const stats = dashboardStats
    ? [
        {
          title: "Today's Bookings",
          value: dashboardStats.today.bookingsCreated,
          icon: CalendarDays,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
        },
        {
          title: "Today's Check-ins",
          value: dashboardStats.today.checkIns,
          icon: LogIn,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          title: "Today's Check-outs",
          value: dashboardStats.today.checkOuts,
          icon: LogOut,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
        },
        {
          title: 'Current Guests',
          value: dashboardStats.today.currentGuests,
          icon: Users,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        },
        {
          title: 'Occupancy Rate',
          value: `${dashboardStats.today.occupancyRate}%`,
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          title: 'Revenue This Month',
          value: formatCurrency(dashboardStats.thisMonth.totalRevenue),
          icon: DollarSign,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          title: 'Bookings This Month',
          value: dashboardStats.thisMonth.totalBookings,
          icon: CalendarDays,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          title: 'Total Rooms',
          value: dashboardStats.today.totalRooms,
          icon: LogIn,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        },
      ]
    : []

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

  const recentBookings = dashboardStats?.recentBookings || []
  const upcomingCheckIns = dashboardStats?.upcomingCheckIns || []

  // Derive room status from bookings
  const getRoomStatus = (roomId: string): 'available' | 'occupied' => {
    const activeBooking = bookings.find(
      (b) => b.roomId === roomId && (b.status === 'confirmed' || b.status === 'checked_in'),
    )
    return activeBooking ? 'occupied' : 'available'
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.slice(0, 8).map((stat) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        stat.bg,
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
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
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
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead className="hidden sm:table-cell">Room</TableHead>
                      <TableHead className="hidden md:table-cell">Channel</TableHead>
                      <TableHead className="hidden md:table-cell">Check-in</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No recent bookings
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentBookings.map((booking) => (
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
                                {booking.guest?.firstName} {booking.guest?.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {booking.confirmationCode}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {booking.room?.roomNumber} - {booking.room?.name}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {booking.channel?.name || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(parseISO(booking.checkInDate), 'MMM d')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs capitalize',
                                statusColors[booking.status],
                              )}
                            >
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Arrivals */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Upcoming Arrivals</CardTitle>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingCheckIns.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No upcoming arrivals
                    </p>
                  ) : (
                    upcomingCheckIns.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {booking.guest?.firstName} {booking.guest?.lastName}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Room {booking.room?.roomNumber}</span>
                            <span>·</span>
                            <span>{format(parseISO(booking.checkInDate), 'MMM d')}</span>
                            <span>→</span>
                            <span>{format(parseISO(booking.checkOutDate), 'MMM d')}</span>
                          </div>
                          {booking.channel && (
                            <span className="text-[10px] text-muted-foreground">
                              via {booking.channel.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
            {isLoading || rooms.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {rooms.map((room) => {
                  const roomStatus = getRoomStatus(room.id)
                  const statusColor = {
                    available: 'border-emerald-200 bg-emerald-50',
                    occupied: 'border-blue-200 bg-blue-50',
                  }[roomStatus]

                  const statusDot = {
                    available: 'bg-emerald-500',
                    occupied: 'bg-blue-500',
                  }[roomStatus]

                  return (
                    <div
                      key={room.id}
                      className={cn('rounded-lg border p-3 transition-colors', statusColor)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{room.roomNumber}</span>
                        <div className={cn('h-2 w-2 rounded-full', statusDot)} />
                      </div>
                      <p className="text-xs text-muted-foreground">{room.name}</p>
                      <p className="mt-1 text-xs font-medium capitalize text-muted-foreground">
                        {roomStatus}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
