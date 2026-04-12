'use client'

import { CalendarView } from '@/components/views/calendar-view'

export default function CalendarPage() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <CalendarView />
    </div>
  )
}
