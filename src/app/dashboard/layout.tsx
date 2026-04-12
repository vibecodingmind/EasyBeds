'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { NewBookingDialog } from '@/components/booking/new-booking-dialog'
import { BookingDetailsDialog } from '@/components/booking/booking-details-dialog'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, showNewBookingDialog, selectedBookingId } = useAppStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Global dialogs */}
      {showNewBookingDialog && <NewBookingDialog />}
      {selectedBookingId && <BookingDetailsDialog />}
    </div>
  )
}
