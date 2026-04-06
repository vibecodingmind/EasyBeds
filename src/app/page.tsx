'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { LoginView } from '@/components/views/login-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { CalendarView } from '@/components/views/calendar-view'
import { BookingsView } from '@/components/views/bookings-view'
import { RoomsView } from '@/components/views/rooms-view'
import { GuestsView } from '@/components/views/guests-view'
import { ChannelsView } from '@/components/views/channels-view'
import { ReportsView } from '@/components/views/reports-view'
import { SettingsView } from '@/components/views/settings-view'
import { HousekeepingView } from '@/components/views/housekeeping-view'
import { ActivityView } from '@/components/views/activity-view'
import { NightAuditView } from '@/components/views/night-audit-view'
import { ConciergeView } from '@/components/views/concierge-view'
import { LoyaltyView } from '@/components/views/loyalty-view'
import { ReviewsView } from '@/components/views/reviews-view'
import { RevenueView } from '@/components/views/revenue-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { RateParityView } from '@/components/views/rate-parity-view'
import { NewBookingDialog } from '@/components/booking/new-booking-dialog'
import { BookingDetailsDialog } from '@/components/booking/booking-details-dialog'
import { cn } from '@/lib/utils'

function ViewRenderer() {
  const { currentView } = useAppStore()

  const viewComponents: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    calendar: <CalendarView />,
    bookings: <BookingsView />,
    rooms: <RoomsView />,
    guests: <GuestsView />,
    channels: <ChannelsView />,
    reports: <ReportsView />,
    settings: <SettingsView />,
    housekeeping: <HousekeepingView />,
    activity: <ActivityView />,
    night_audit: <NightAuditView />,
    revenue: <RevenueView />,
    analytics: <AnalyticsView />,
    'rate-parity': <RateParityView />,
    concierge: <ConciergeView />,
    loyalty: <LoyaltyView />,
    reviews: <ReviewsView />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="flex-1 overflow-auto"
      >
        {viewComponents[currentView] || <DashboardView />}
      </motion.div>
    </AnimatePresence>
  )
}

export default function Home() {
  const { isAuthenticated, sidebarOpen } = useAppStore()

  if (!isAuthenticated) {
    return <LoginView />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main
          className={cn(
            'flex-1 overflow-hidden transition-all duration-300',
            sidebarOpen ? 'md:ml-0' : 'md:ml-0'
          )}
        >
          <ViewRenderer />
        </main>
      </div>

      {/* Global Dialogs */}
      <NewBookingDialog />
      <BookingDetailsDialog />
    </div>
  )
}
