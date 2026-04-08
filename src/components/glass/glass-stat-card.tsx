'use client'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface GlassStatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  className?: string
}

export function GlassStatCard({ title, value, change, changeType = 'neutral', icon: Icon, className }: GlassStatCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/15',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/60">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-medium',
              changeType === 'positive' && 'text-emerald-400',
              changeType === 'negative' && 'text-red-400',
              changeType === 'neutral' && 'text-white/50'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
