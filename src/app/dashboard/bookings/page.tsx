'use client'

import { BookingsView } from '@/components/views/bookings-view'

export default function BookingsPage() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <BookingsView />
    </div>
  )
}
