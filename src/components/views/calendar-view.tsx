'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  ArrowLeftRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import {
  mockRooms,
  mockBookings,
  getRoomById,
  getGuestById,
  getChannelById,
  type MockBooking,
} from '@/lib/mock-data'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  parseISO,
  differenceInDays,
  addDays,
} from 'date-fns'
import { cn } from '@/lib/utils'

const statusBarColors: Record<string, string> = {
  confirmed: 'bg-emerald-500 hover:bg-emerald-600',
  checked_in: 'bg-blue-500 hover:bg-blue-600',
  pending: 'bg-amber-400 hover:bg-amber-500',
  checked_out: 'bg-gray-400 hover:bg-gray-500',
  cancelled: 'bg-red-400 hover:bg-red-500 line-through',
}

const statusTextColors: Record<string, string> = {
  confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  checked_in: 'text-blue-700 bg-blue-50 border-blue-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  checked_out: 'text-gray-600 bg-gray-50 border-gray-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
}

export function CalendarView() {
  const { calendarDate, setCalendarDate, bookings, rooms, setShowNewBookingDialog, setSelectedBookingId } =
    useAppStore()

  const allBookings = bookings.length > 0 ? bookings : mockBookings
  const allRooms = rooms.length > 0 ? rooms : mockRooms

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
    allRooms.map((r) => r.id)
  )

  const filteredRooms = allRooms.filter((r) => selectedRoomIds.includes(r.id))

  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Build a map of bookings per room
  const bookingsByRoom = useMemo(() => {
    const map: Record<string, MockBooking[]> = {}
    allBookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        if (!map[b.roomId]) map[b.roomId] = []
        map[b.roomId].push(b)
      })
    return map
  }, [allBookings])

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    )
  }

  const selectAllRooms = () => setSelectedRoomIds(allRooms.map((r) => r.id))
  const deselectAllRooms = () => setSelectedRoomIds([])

  const today = new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[180px] text-lg font-semibold">
            {format(calendarDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date())}>
            Today
          </Button>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          size="sm"
          onClick={() => setShowNewBookingDialog(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Room Filter Sidebar */}
        <div className="hidden w-56 shrink-0 border-r bg-muted/30 lg:block">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Rooms</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAllRooms}>
                  All
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAllRooms}>
                  None
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-1">
                {allRooms.map((room) => {
                  const roomBookings = bookingsByRoom[room.id] || []
                  const statusDot = {
                    available: 'bg-emerald-500',
                    occupied: 'bg-blue-500',
                    maintenance: 'bg-amber-500',
                    out_of_service: 'bg-red-500',
                  }[room.status]

                  return (
                    <div
                      key={room.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedRoomIds.includes(room.id)}
                        onCheckedChange={() => toggleRoom(room.id)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{room.number}</span>
                          <div className={cn('h-2 w-2 rounded-full', statusDot)} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {room.name} · ${room.basePrice}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {roomBookings.length}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {/* Day headers */}
          <div className="sticky top-0 z-10 grid grid-cols-[100px_repeat(7,1fr)] border-b bg-card">
            <div className="p-2">
              <span className="text-xs font-medium text-muted-foreground">Room</span>
            </div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="border-l p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {weeks.map((week, weekIdx) => (
            <div
              key={weekIdx}
              className="grid grid-cols-[100px_repeat(7,1fr)] border-b last:border-b-0"
            >
              {/* Date numbers row */}
              <div className="p-0" />
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={cn(
                    'border-l p-1.5 text-center',
                    !isSameMonth(day, calendarDate) && 'bg-muted/30',
                    isToday(day) && 'bg-emerald-50'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                      isToday(day) && 'bg-emerald-600 text-white',
                      !isSameMonth(day, calendarDate) && 'text-muted-foreground/50'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              ))}

              {/* Room rows */}
              {filteredRooms.map((room) => {
                const roomBookings = bookingsByRoom[room.id] || []
                return (
                  <React.Fragment key={room.id}>
                    {/* Room label */}
                    <div className="flex items-center gap-2 border-t px-2 py-2">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {room.number}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {room.type}
                        </span>
                      </div>
                    </div>

                    {/* Days for this room */}
                    {week.map((day, dayIdx) => {
                      // Find bookings that overlap with this day
                      const dayBookings = roomBookings.filter((b) => {
                        const ci = parseISO(b.checkIn)
                        const co = parseISO(b.checkOut)
                        return (
                          (isSameDay(day, ci) || isAfter(day, ci)) &&
                          isBefore(day, co)
                        )
                      })

                      // Check if this is the START of a booking (for rendering the bar start)
                      const startBookings = roomBookings.filter((b) =>
                        isSameDay(day, parseISO(b.checkIn))
                      )

                      const isAvailable =
                        dayBookings.length === 0 &&
                        isAfter(day, subMonths(today, 1))

                      const isMaintenance = room.status === 'maintenance'

                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            'relative border-l border-t p-0.5',
                            !isSameMonth(day, calendarDate) && 'bg-muted/30',
                            isToday(day) && 'bg-emerald-50/50'
                          )}
                          style={{ minHeight: '40px' }}
                        >
                          {startBookings.length > 0
                            ? startBookings.map((booking) => {
                                const ci = parseISO(booking.checkIn)
                                const co = parseISO(booking.checkOut)
                                const duration = Math.max(
                                  differenceInDays(co, ci),
                                  1
                                )
                                const guest = getGuestById(booking.guestId)
                                const roomData = getRoomById(booking.roomId)

                                // Calculate the span based on how many days are in the current week view
                                const weekEnd = week[6]
                                const visibleEnd =
                                  isBefore(co, addDays(weekEnd, 1))
                                    ? co
                                    : addDays(weekEnd, 1)
                                const visibleDuration = Math.max(
                                  differenceInDays(visibleEnd, ci),
                                  1
                                )

                                const startsInWeek = isAfter(
                                  ci,
                                  subDays(week[0], 1)
                                )
                                const spanStart = startsInWeek
                                  ? dayIdx
                                  : 0

                                // Only render the bar from the first visible day
                                if (!startsInWeek && !isSameDay(day, ci)) return null

                                return (
                                  <Tooltip key={booking.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          'absolute top-0.5 z-10 flex h-[calc(100%-4px)] min-w-[20px] cursor-pointer items-center rounded-sm px-1.5 text-[10px] font-medium text-white transition-opacity hover:opacity-90',
                                          statusBarColors[booking.status],
                                          isSameDay(day, ci) && 'rounded-l-sm',
                                          isSameDay(addDays(co, -1), week[6]) &&
                                            'rounded-r-sm'
                                        )}
                                        style={{
                                          left: isSameDay(day, ci) ? '2px' : '0',
                                          width: `calc(${visibleDuration * 100}% - ${isSameDay(day, ci) ? '4px' : '0'})`,
                                        }}
                                        onClick={() =>
                                          setSelectedBookingId(booking.id)
                                        }
                                      >
                                        <span className="truncate">
                                          {guest?.firstName}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-[250px]"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">
                                            {guest?.firstName} {guest?.lastName}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'text-[10px] capitalize',
                                              statusTextColors[booking.status]
                                            )}
                                          >
                                            {booking.status.replace('_', ' ')}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Room {roomData?.number} · {booking.confirmationCode}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {format(ci, 'MMM d')} → {format(co, 'MMM d')} ({duration} nights)
                                        </div>
                                        <div className="text-xs font-medium">
                                          ${booking.totalPrice}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })
                            : isAvailable &&
                              isSameDay(day, today) &&
                              !isMaintenance && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="absolute inset-0.5 flex items-center justify-center rounded-sm bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200"
                                      onClick={() => setShowNewBookingDialog(true)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Create booking for {room.number}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                          {/* Maintenance indicator */}
                          {isMaintenance && !dayBookings.length && (
                            <div className="absolute inset-0.5 flex items-center justify-center rounded-sm bg-amber-100 text-[10px] font-medium text-amber-700">
                              Maint.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-2 md:px-6">
        <span className="text-xs font-medium text-muted-foreground">Legend:</span>
        {[
          { color: 'bg-emerald-500', label: 'Confirmed' },
          { color: 'bg-blue-500', label: 'Checked In' },
          { color: 'bg-amber-400', label: 'Pending' },
          { color: 'bg-gray-400', label: 'Checked Out' },
          { color: 'bg-red-400', label: 'Cancelled' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn('h-2.5 w-2.5 rounded-sm', item.color)} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
