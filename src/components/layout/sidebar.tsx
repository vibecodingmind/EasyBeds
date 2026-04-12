'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

// ─── View → URL mapping ──────────────────────────────────────────────────

const VIEW_TO_PATH: Record<ViewType, string> = {
  dashboard: '/dashboard',
  calendar: '/dashboard/calendar',
  bookings: '/dashboard/bookings',
  rooms: '/dashboard/rooms',
  guests: '/dashboard/guests',
  channels: '/dashboard/channels',
  housekeeping: '/dashboard/housekeeping',
  reports: '/dashboard/reports',
  analytics: '/dashboard/analytics',
  revenue: '/dashboard/revenue',
  'rate-parity': '/dashboard/rate-parity',
  loyalty: '/dashboard/loyalty',
  reviews: '/dashboard/reviews',
  concierge: '/dashboard/concierge',
  activity: '/dashboard/activity',
  night_audit: '/dashboard/night-audit',
  settings: '/dashboard/settings',
  subscription: '/dashboard/subscription',
  admin: '/dashboard/admin',
}

// ─── Path → ViewType reverse mapping ─────────────────────────────────────

const PATH_TO_VIEW: Record<string, ViewType> = {
  '/dashboard': 'dashboard',
  '/dashboard/calendar': 'calendar',
  '/dashboard/bookings': 'bookings',
  '/dashboard/rooms': 'rooms',
  '/dashboard/guests': 'guests',
  '/dashboard/channels': 'channels',
  '/dashboard/housekeeping': 'housekeeping',
  '/dashboard/reports': 'reports',
  '/dashboard/analytics': 'analytics',
  '/dashboard/revenue': 'revenue',
  '/dashboard/rate-parity': 'rate-parity',
  '/dashboard/loyalty': 'loyalty',
  '/dashboard/reviews': 'reviews',
  '/dashboard/concierge': 'concierge',
  '/dashboard/activity': 'activity',
  '/dashboard/night-audit': 'night_audit',
  '/dashboard/settings': 'settings',
  '/dashboard/subscription': 'subscription',
  '/dashboard/admin': 'admin',
}

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
  const pathname = usePathname()
  const router = useRouter()
  const {
    currentUser,
    userRole,
    platformRole,
    hotel,
    sidebarOpen,
    logout,
    toggleSidebar,
    setCurrentView,
  } = useAppStore()

  // Sync the store's currentView to the actual pathname
  const activeView = PATH_TO_VIEW[pathname] || 'dashboard'
  const currentView = activeView

  const initials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const hotelName = hotel?.name || 'EasyBeds'

  const handleLogout = () => {
    logout()
    router.push('/')
  }

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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r dark:bg-gray-900/80 dark:border-white/10 bg-white border-gray-200 backdrop-blur-xl transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 md:w-16',
          'md:relative md:z-auto',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b dark:border-white/10 border-gray-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <Hotel className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold tracking-tight dark:text-white text-gray-800">
                  EasyBeds
                </span>
                <span className="truncate text-[11px] dark:text-white/50 text-gray-500">
                  {hotelName}
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto flex h-8 w-8 dark:text-white/50 text-gray-500 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider dark:text-white/40 text-gray-400">
                      Platform
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  {(() => {
                    const isActive = currentView === 'admin'
                    const Icon = Shield
                    const href = VIEW_TO_PATH['admin']
                    if (!sidebarOpen) {
                      return (
                        <Tooltip key="admin" delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Link href={href}>
                              <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                size="icon"
                                className="w-full dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
                              >
                                <Icon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            Platform Admin
                          </TooltipContent>
                        </Tooltip>
                      )
                    }
                    return (
                      <Link key="admin" href={href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3 px-3 dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100',
                            isActive &&
                              'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm">Platform Admin</span>
                        </Button>
                      </Link>
                    )
                  })()}
                </div>
              </div>
            )}
            {navSections.map((section) => {
              const visibleItems = section.items.filter(item =>
                canAccessView(userRole, platformRole, item.view)
              )
              if (visibleItems.length === 0) return null

              return (
                <div key={section.label}>
                  {sidebarOpen && (
                    <div className="mb-1 px-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider dark:text-white/40 text-gray-400">
                        {section.label}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => {
                      const isActive = currentView === item.view
                      const Icon = item.icon
                      const href = VIEW_TO_PATH[item.view]

                      if (!sidebarOpen) {
                        return (
                          <Tooltip key={item.view} delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Link href={href}>
                                <Button
                                  variant={isActive ? 'secondary' : 'ghost'}
                                  size="icon"
                                  className="w-full dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Icon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return (
                        <Link key={item.view} href={href}>
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start gap-3 px-3 dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100',
                              isActive &&
                                'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm">{item.label}</span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* System section */}
            {sidebarOpen && (
              <div className="mb-1 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider dark:text-white/40 text-gray-400">
                  System
                </span>
              </div>
            )}
            {/* Subscription */}
            {canAccessView(userRole, platformRole, 'subscription') && (() => {
              const isActive = currentView === 'subscription'
              const Icon = CreditCard
              const href = VIEW_TO_PATH['subscription']
              if (!sidebarOpen) {
                return (
                  <Tooltip key="subscription" delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link href={href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="icon"
                          className="w-full dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Subscription</TooltipContent>
                  </Tooltip>
                )
              }
              return (
                <Link key="subscription" href={href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 px-3 dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100',
                      isActive && 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">Subscription</span>
                  </Button>
                </Link>
              )
            })()}
            {/* Settings */}
            {canAccessView(userRole, platformRole, 'settings') && (() => {
              const isActive = currentView === 'settings'
              const Icon = Settings
              const href = VIEW_TO_PATH['settings']
              if (!sidebarOpen) {
                return (
                  <Tooltip key="settings" delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link href={href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="icon"
                          className="w-full dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Settings
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return (
                <Link key="settings" href={href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 px-3 dark:text-white/70 text-gray-600 dark:hover:text-white dark:hover:bg-white/10 hover:text-gray-900 hover:bg-gray-100',
                      isActive &&
                        'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </Link>
              )
            })()}
          </nav>
        </ScrollArea>

        {/* User section */}
        <Separator className="dark:bg-white/10 bg-gray-200" />
        <div className="p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-xl p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium dark:text-white text-gray-800">
                  {currentUser?.name}
                </span>
                <span className="truncate text-xs dark:text-white/50 text-gray-500">
                  {userRole || 'Staff'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 dark:text-white/40 text-gray-400 hover:text-red-400 dark:hover:bg-white/10 hover:bg-gray-100"
                onClick={handleLogout}
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
                  className="w-full dark:text-white/40 text-gray-400 hover:text-red-400 dark:hover:bg-white/10 hover:bg-gray-100"
                  onClick={handleLogout}
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
