'use client'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export function GlassCard({ children, className, hover = true, glow = false }: GlassCardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg',
      glow && 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/15',
      className
    )}>
      {children}
    </div>
  )
}

export function GlassCardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function GlassCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6 pb-0', className)}>{children}</div>
}

export function GlassCardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>
}
