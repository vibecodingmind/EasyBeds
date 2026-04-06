'use client'

import React from 'react'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Bed,
  Users,
  Radio,
  BarChart3,
  Settings,
  LogOut,
  Hotel,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Star,
  MessageCircle,
  Activity,
  TrendingUp,
  Scale,
  PlusCircle,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore, type ViewType } from '@/lib/store'
import { cn } from '@/lib/utils'

interface NavSection {
  label: string
  items: { view: ViewType; label: string; icon: React.ElementType }[]
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { view: 'calendar', label: 'Calendar', icon: Calendar },
      { view: 'bookings', label: 'Bookings', icon: ClipboardList },
      { view: 'rooms', label: 'Rooms', icon: Bed },
    ],
  },
  {
    label: 'Operations',
    items: [
      { view: 'guests', label: 'Guests', icon: Users },
      { view: 'channels', label: 'Channels', icon: Radio },
      { view: 'housekeeping', label: 'Housekeeping', icon: PlusCircle },
      { view: 'activity', label: 'Activity Log', icon: Activity },
      { view: 'night_audit', label: 'Night Audit', icon: Moon },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { view: 'revenue', label: 'Revenue & Pricing', icon: TrendingUp },
      { view: 'analytics', label: 'Analytics', icon: BarChart3 },
      { view: 'rate-parity', label: 'Rate Parity', icon: Scale },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { view: 'concierge', label: 'AI Concierge', icon: Sparkles },
      { view: 'reviews', label: 'Reviews', icon: Star },
      { view: 'loyalty', label: 'Loyalty', icon: ShieldCheck },
      { view: 'messages', label: 'Messages', icon: MessageCircle },
    ],
  },
]

export function AppSidebar() {
  const {
    currentUser,
    userRole,
    hotel,
    currentView,
    sidebarOpen,
    setCurrentView,
    logout,
    toggleSidebar,
  } = useAppStore()

  const initials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const hotelName = hotel?.name || 'EasyBeds'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 md:w-16',
          'md:relative md:z-auto',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Hotel className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-foreground">
                EasyBeds
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {hotelName}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden h-8 w-8 md:flex"
            onClick={toggleSidebar}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                !sidebarOpen && 'rotate-180',
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-4">
            {navSections.map((section) => (
              <div key={section.label}>
                {sidebarOpen && (
                  <div className="mb-1 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const isActive = currentView === item.view
                    const Icon = item.icon

                    if (!sidebarOpen) {
                      return (
                        <Tooltip key={item.view} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              size="icon"
                              className="w-full"
                              onClick={() => setCurrentView(item.view)}
                            >
                              <Icon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return (
                      <Button
                        key={item.view}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 px-3',
                          isActive &&
                            'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700',
                        )}
                        onClick={() => setCurrentView(item.view)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Settings at bottom */}
            {sidebarOpen && (
              <div className="mb-1 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  System
                </span>
              </div>
            )}
            {(() => {
              const isActive = currentView === 'settings'
              const Icon = Settings
              if (!sidebarOpen) {
                return (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        className="w-full"
                        onClick={() => setCurrentView('settings')}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Settings
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 px-3',
                    isActive &&
                      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700',
                  )}
                  onClick={() => setCurrentView('settings')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm">Settings</span>
                </Button>
              )
            })()}
          </nav>
        </ScrollArea>

        {/* User section */}
        <Separator />
        <div className="p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-lg p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-xs text-emerald-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">
                  {currentUser?.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {userRole || 'Staff'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Logout
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  )
}
