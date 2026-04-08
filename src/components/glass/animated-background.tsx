'use client'
import { cn } from '@/lib/utils'

interface AnimatedBackgroundProps {
  className?: string
  variant?: 'gradient' | 'mesh' | 'aurora'
}

export function AnimatedBackground({ className, variant = 'gradient' }: AnimatedBackgroundProps) {
  if (variant === 'aurora') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] animate-spin-slow">
          <div className="absolute top-0 left-0 h-1/2 w-1/2 rounded-full bg-emerald-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-full bg-teal-500/20 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 h-1/2 w-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Animated gradient orbs */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-teal-500/15 blur-[100px] animate-pulse delay-1000" />
      <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-2000" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
    </div>
  )
}
