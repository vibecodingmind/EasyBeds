'use client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface GlassBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function GlassBadge({ children, variant = 'default', className }: GlassBadgeProps) {
  return (
    <Badge className={cn(
      'rounded-full border backdrop-blur-sm px-3 py-1 text-xs font-medium',
      variant === 'default' && 'border-white/20 bg-white/10 text-white',
      variant === 'success' && 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      variant === 'warning' && 'border-amber-400/30 bg-amber-500/15 text-amber-300',
      variant === 'danger' && 'border-red-400/30 bg-red-500/15 text-red-300',
      className
    )}>
      {children}
    </Badge>
  )
}
