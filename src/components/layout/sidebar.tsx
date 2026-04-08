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
  CreditCard,
  LogOut,
  Hotel,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Star,
  Activity,
  TrendingUp,
  Scale,
  PlusCircle,
  Moon,
  Shield,
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
import { canAccessView } from '@/lib/permissions'
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
    ],
  },
]

export function AppSidebar() {
  const {
    currentUser,
    userRole,
    platformRole,
    hotel,
    currentView,
    sidebarOpen,
    navigate,
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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-gray-900/80 backdrop-blur-xl transition-all duration-300 border-white/10',
          sidebarOpen ? 'w-64' : 'w-0 md:w-16',
          'md:relative md:z-auto',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
            <Hotel className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-white">
                EasyBeds
              </span>
              <span className="truncate text-[11px] text-white/50">
                {hotelName}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 md:flex"
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
            {/* Platform Admin - only for platform admins */}
            {platformRole === 'admin' && (
              <div>
                {sidebarOpen && (
                  <div className="mb-1 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Platform
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  {(() => {
                    const isActive = currentView === 'admin'
                    const Icon = Shield
                    if (!sidebarOpen) {
                      return (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              size="icon"
                              className="w-full text-white/70 hover:text-white hover:bg-white/10"
                              onClick={() => navigate('admin')}
                            >
                              <Icon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            Platform Admin
                          </TooltipContent>
                        </Tooltip>
                      )
                    }
                    return (
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 px-3 text-white/70 hover:text-white hover:bg-white/10',
                          isActive &&
                            'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                        )}
                        onClick={() => navigate('admin')}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">Platform Admin</span>
                      </Button>
                    )
                  })()}
                </div>
              </div>
            )}
            {navSections.map((section) => {
              // Filter items based on permissions
              const visibleItems = section.items.filter(item =>
                canAccessView(userRole, platformRole, item.view)
              )
              // Skip section if no items visible
              if (visibleItems.length === 0) return null

              return (
                <div key={section.label}>
                  {sidebarOpen && (
                    <div className="mb-1 px-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        {section.label}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => {
                      const isActive = currentView === item.view
                      const Icon = item.icon

                      if (!sidebarOpen) {
                        return (
                          <Tooltip key={item.view} delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                size="icon"
                                className="w-full text-white/70 hover:text-white hover:bg-white/10"
                                onClick={() => navigate(item.view)}
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
                            'w-full justify-start gap-3 px-3 text-white/70 hover:text-white hover:bg-white/10',
                            isActive &&
                              'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                          )}
                          onClick={() => navigate(item.view)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Settings at bottom */}
            {sidebarOpen && (
              <div className="mb-1 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  System
                </span>
              </div>
            )}
            {(() => {
              const isActive = currentView === 'subscription'
              const Icon = CreditCard
              if (!canAccessView(userRole, platformRole, 'subscription')) return null
              if (!sidebarOpen) {
                return (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        className="w-full text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate('subscription')}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Subscription</TooltipContent>
                  </Tooltip>
                )
              }
              return (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 px-3 text-white/70 hover:text-white hover:bg-white/10',
                    isActive && 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                  )}
                  onClick={() => navigate('subscription')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm">Subscription</span>
                </Button>
              )
            })()}
            {(() => {
              const isActive = currentView === 'settings'
              const Icon = Settings
              if (!canAccessView(userRole, platformRole, 'settings')) return null
              if (!sidebarOpen) {
                return (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        className="w-full text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate('settings')}
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
                    'w-full justify-start gap-3 px-3 text-white/70 hover:text-white hover:bg-white/10',
                    isActive &&
                      'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                  )}
                  onClick={() => navigate('settings')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm">Settings</span>
                </Button>
              )
            })()}
          </nav>
        </ScrollArea>

        {/* User section */}
        <Separator className="bg-white/10" />
        <div className="p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-xl p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-white">
                  {currentUser?.name}
                </span>
                <span className="truncate text-xs text-white/50">
                  {userRole || 'Staff'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-white/10"
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
                  className="w-full text-white/40 hover:text-red-400 hover:bg-white/10"
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
