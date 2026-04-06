'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Wrench,
  Home,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import type { ApiAvailabilityBlock } from '@/lib/api'
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
  differenceInDays,
  addDays,
  subDays,
} from 'date-fns'
import { cn } from '@/lib/utils'

// ─── Block Type Colors ───────────────────────────────────────────────────────

const blockTypeColors: Record<string, string> = {
  booking: 'bg-emerald-500',
  maintenance: 'bg-amber-500',
  owner_use: 'bg-purple-500',
  hold: 'bg-gray-400',
}

const blockTypeHover: Record<string, string> = {
  booking: 'hover:bg-emerald-600',
  maintenance: 'hover:bg-amber-600',
  owner_use: 'hover:bg-purple-600',
  hold: 'hover:bg-gray-500',
}

// Booking status overrides — more specific than blockType
const bookingStatusColors: Record<string, string> = {
  confirmed: 'bg-emerald-500',
  checked_in: 'bg-blue-500',
  pending: 'bg-amber-400',
  checked_out: 'bg-gray-400',
  cancelled: 'bg-red-400',
}

const bookingStatusHover: Record<string, string> = {
  confirmed: 'hover:bg-emerald-600',
  checked_in: 'hover:bg-blue-600',
  pending: 'hover:bg-amber-500',
  checked_out: 'hover:bg-gray-500',
  cancelled: 'hover:bg-red-500',
}

const statusBadgeColors: Record<string, string> = {
  confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  checked_in: 'text-blue-700 bg-blue-50 border-blue-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  checked_out: 'text-gray-600 bg-gray-50 border-gray-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
}

const blockTypeLabel: Record<string, string> = {
  booking: 'Booking',
  maintenance: 'Maintenance',
  owner_use: 'Owner Use',
  hold: 'Hold',
}

const blockTypeIcon: Record<string, React.ReactNode> = {
  maintenance: <Wrench className="h-3 w-3" />,
  owner_use: <Home className="h-3 w-3" />,
  hold: <Lock className="h-3 w-3" />,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBlockColor(block: ApiAvailabilityBlock): string {
  if (block.blockType === 'booking' && block.booking) {
    return bookingStatusColors[block.booking.status] || blockTypeColors.booking
  }
  return blockTypeColors[block.blockType] || 'bg-gray-400'
}

function getBlockHover(block: ApiAvailabilityBlock): string {
  if (block.blockType === 'booking' && block.booking) {
    return bookingStatusHover[block.booking.status] || blockTypeHover.booking
  }
  return blockTypeHover[block.blockType] || 'hover:bg-gray-500'
}

function getBlockLabel(block: ApiAvailabilityBlock): string {
  if (block.blockType === 'booking' && block.booking?.guest) {
    return `${block.booking.guest.firstName} ${block.booking.guest.lastName || ''}`.trim()
  }
  if (block.blockType === 'maintenance') return 'Maintenance'
  if (block.blockType === 'owner_use') return 'Owner Use'
  if (block.blockType === 'hold') return 'Hold'
  return block.blockType
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CalendarView() {
  const {
    calendarDate,
    setCalendarDate,
    rooms,
    availabilityData,
    fetchAvailability,
    fetchRooms,
    loading,
    currentHotelId,
    hotel,
    setShowNewBookingDialog,
    setSelectedBookingId,
  } = useAppStore()

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth() + 1

  useEffect(() => {
    if (currentHotelId) {
      fetchAvailability(year, month)
      fetchRooms()
    }
  }, [currentHotelId, year, month, fetchAvailability, fetchRooms])

  // Use availability rooms if available, otherwise fall back to store rooms
  const calRooms = availabilityData?.rooms?.length
    ? availabilityData.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        roomNumber: r.roomNumber,
        type: r.type,
        basePrice: r.basePrice,
      }))
    : rooms.map((r) => ({
        id: r.id,
        name: r.name,
        roomNumber: r.roomNumber,
        type: r.type,
        basePrice: r.basePrice,
      }))

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)

  // Initialize selected room IDs from rooms data
  if (calRooms.length > 0 && !initialized) {
    setInitialized(true)
    setSelectedRoomIds(calRooms.map((r) => r.id))
  }

  const filteredRooms = calRooms.filter((r) => selectedRoomIds.includes(r.id))

  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Build all blocks per room from availability data (non-cancelled bookings + other types)
  const blocksByRoom = useMemo(() => {
    const map: Record<string, ApiAvailabilityBlock[]> = {}

    if (availabilityData?.blocksByRoom) {
      for (const [roomId, blocks] of Object.entries(availabilityData.blocksByRoom)) {
        map[roomId] = blocks.filter((b) => {
          if (b.blockType === 'booking' && b.booking?.status === 'cancelled') return false
          return true
        })
      }
    }

    return map
  }, [availabilityData])

  // Booking-only blocks per room (for sidebar badge counts)
  const bookingsByRoom = useMemo(() => {
    const map: Record<string, ApiAvailabilityBlock[]> = {}
    if (availabilityData?.blocksByRoom) {
      for (const [roomId, blocks] of Object.entries(availabilityData.blocksByRoom)) {
        map[roomId] = blocks.filter(
          (b) => b.blockType === 'booking' && b.booking?.status !== 'cancelled',
        )
      }
    }
    return map
  }, [availabilityData])

  const getRoomBlocks = (roomId: string) => blocksByRoom[roomId] || []
  const getRoomBookings = (roomId: string) => bookingsByRoom[roomId] || []

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const selectAllRooms = () => setSelectedRoomIds(calRooms.map((r) => r.id))
  const deselectAllRooms = () => setSelectedRoomIds([])

  const today = new Date()
  const isLoading = loading.availability
  const currencySymbol =
    hotel?.currency === 'EUR' ? '\u20AC' : hotel?.currency === 'GBP' ? '\u00A3' : '$'

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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={selectAllRooms}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={deselectAllRooms}
                >
                  None
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {isLoading && calRooms.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {calRooms.map((room) => {
                    const roomBookings = getRoomBookings(room.id)
                    const isOccupied = roomBookings.some(
                      (b) => b.booking?.status === 'checked_in',
                    )

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
                            <span className="text-sm font-medium">{room.roomNumber}</span>
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                isOccupied ? 'bg-blue-500' : 'bg-emerald-500',
                              )}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {room.name} &middot; {currencySymbol}
                            {room.basePrice}
                          </span>
                        </div>
                        <Badge variant="secondary" className="px-1.5 text-[10px]">
                          {roomBookings.length}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading && !availabilityData ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
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
                        isToday(day) && 'bg-emerald-50',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                          isToday(day) && 'bg-emerald-600 text-white',
                          !isSameMonth(day, calendarDate) && 'text-muted-foreground/50',
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  ))}

                  {/* Room rows */}
                  {filteredRooms.map((room) => {
                    const roomBlocks = getRoomBlocks(room.id)
                    return (
                      <React.Fragment key={room.id}>
                        {/* Room label */}
                        <div className="flex items-center gap-2 border-t px-2 py-2">
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {room.roomNumber}
                            </span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {room.type}
                            </span>
                          </div>
                        </div>

                        {/* Days for this room */}
                        {week.map((day, dayIdx) => {
                          // Find blocks that overlap with this day
                          const dayBlocks = roomBlocks.filter((block) => {
                            const start = new Date(block.startDate)
                            const end = new Date(block.endDate)
                            return (
                              (isSameDay(day, start) || isAfter(day, start)) &&
                              isBefore(day, end)
                            )
                          })

                          // Check if this is the START of a block within this week
                          const startBlocks = roomBlocks.filter((block) => {
                            const start = new Date(block.startDate)
                            return (
                              isSameDay(day, start) ||
                              (isAfter(day, subDays(week[0], 1)) &&
                                isBefore(start, day) &&
                                isAfter(new Date(block.endDate), day))
                            )
                          })

                          // For blocks that started before this week, only show on first visible day
                          const firstVisibleBlocks = roomBlocks.filter((block) => {
                            const start = new Date(block.startDate)
                            const end = new Date(block.endDate)
                            const overlapsWeek = isBefore(start, addDays(week[0], 1)) && isAfter(end, week[0])
                            if (isSameDay(day, start)) return true
                            if (!overlapsWeek) return false
                            // Show on the first day of this week
                            return isSameDay(day, week[0])
                          })

                          // Pick the first block that starts on or before this day
                          const activeBlocks = roomBlocks.filter((block) => {
                            const start = new Date(block.startDate)
                            const end = new Date(block.endDate)
                            return (
                              (isSameDay(day, start) || isAfter(day, start)) &&
                              isBefore(day, end)
                            )
                          })

                          // Only render block bars on the first day they appear in this week
                          const renderBlocks = firstVisibleBlocks.filter((block) => {
                            const end = new Date(block.endDate)
                            return isAfter(end, week[0])
                          })

                          const isAvailable =
                            dayBlocks.length === 0 && isAfter(day, subMonths(today, 1))

                          return (
                            <div
                              key={dayIdx}
                              className={cn(
                                'relative border-l border-t p-0.5',
                                !isSameMonth(day, calendarDate) && 'bg-muted/30',
                                isToday(day) && 'bg-emerald-50/50',
                              )}
                              style={{ minHeight: '40px' }}
                            >
                              {renderBlocks.map((block) => {
                                const ci = new Date(block.startDate)
                                const co = new Date(block.endDate)
                                const duration = Math.max(differenceInDays(co, ci), 1)

                                // Calculate visible span within this week
                                const weekEnd = endOfWeek(day, { weekStartsOn: 1 })
                                const visibleEnd = isBefore(co, addDays(weekEnd, 1))
                                  ? co
                                  : addDays(weekEnd, 1)
                                const visibleStart = isAfter(ci, subDays(week[0], 1))
                                  ? ci
                                  : week[0]
                                const visibleDuration = Math.max(
                                  differenceInDays(visibleEnd, visibleStart),
                                  1,
                                )

                                const startsOnThisDay = isSameDay(day, visibleStart)
                                const leftOffset = startsOnThisDay ? '2px' : '0'
                                const widthDeduction = startsOnThisDay ? '4px' : '0'

                                const label = getBlockLabel(block)
                                const color = getBlockColor(block)
                                const hover = getBlockHover(block)

                                // Tooltip content
                                const tooltipContent = (
                                  <div className="space-y-1">
                                    {block.blockType === 'booking' && block.booking ? (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">
                                            {block.booking.guest?.firstName}{' '}
                                            {block.booking.guest?.lastName}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'text-[10px] capitalize',
                                              statusBadgeColors[block.booking.status] || '',
                                            )}
                                          >
                                            {block.booking.status.replace('_', ' ')}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {block.room?.roomNumber &&
                                            `Room ${block.room.roomNumber} \u00B7 `}
                                          {block.booking.confirmationCode}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {format(ci, 'MMM d')} \u2192 {format(co, 'MMM d')} (
                                          {duration} nights)
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">
                                            {blockTypeLabel[block.blockType] || block.blockType}
                                          </span>
                                          {block.room && (
                                            <span className="text-xs text-muted-foreground">
                                              Room {block.room.roomNumber}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {format(ci, 'MMM d')} \u2192 {format(co, 'MMM d')} (
                                          {duration} days)
                                        </div>
                                        {block.reason && (
                                          <div className="text-xs text-muted-foreground">
                                            {block.reason}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )

                                return (
                                  <Tooltip key={block.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          'absolute top-0.5 z-10 flex h-[calc(100%-4px)] min-w-[20px] cursor-pointer items-center rounded-sm px-1.5 text-[10px] font-medium text-white transition-opacity hover:opacity-90',
                                          color,
                                          hover,
                                        )}
                                        style={{
                                          left: leftOffset,
                                          width: `calc(${visibleDuration * 100}% - ${widthDeduction})`,
                                        }}
                                        onClick={() => {
                                          if (
                                            block.blockType === 'booking' &&
                                            block.booking?.id
                                          ) {
                                            setSelectedBookingId(block.booking.id)
                                          }
                                        }}
                                      >
                                        <span className="truncate">{label}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[250px]">
                                      {tooltipContent}
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })}

                              {/* Empty cell — show + button on today */}
                              {!renderBlocks.length &&
                                isAvailable &&
                                isSameDay(day, today) && (
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
                                      Create booking for {room.roomNumber}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-2 md:px-6">
        <span className="text-xs font-medium text-muted-foreground">Legend:</span>
        {[
          { color: 'bg-emerald-500', label: 'Confirmed' },
          { color: 'bg-blue-500', label: 'Checked In' },
          { color: 'bg-amber-400', label: 'Pending' },
          { color: 'bg-gray-400', label: 'Checked Out / Hold' },
          { color: 'bg-amber-500', label: 'Maintenance' },
          { color: 'bg-purple-500', label: 'Owner Use' },
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
