'use client'

import React from 'react'
import { Menu, Bell, Search } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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

export function AppHeader() {
  const { currentView, toggleSidebar, setShowNewBookingDialog, currentUser } =
    useAppStore()

  const initials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

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
          Paradise Court Lodge
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings, guests..."
          className="w-64 pl-9"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px]">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="text-sm font-medium">New booking received</span>
            <span className="text-xs text-muted-foreground">
              Sophie Müller - Check-in today
            </span>
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="text-sm font-medium">Check-out reminder</span>
            <span className="text-xs text-muted-foreground">
              Emma Williams - Room 202 checking out today
            </span>
            <span className="text-xs text-muted-foreground">5 hours ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="text-sm font-medium">Room 302 maintenance</span>
            <span className="text-xs text-muted-foreground">
              Maintenance completed, room is available
            </span>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
