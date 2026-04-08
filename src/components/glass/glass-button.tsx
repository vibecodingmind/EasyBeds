'use client'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

interface GlassButtonProps extends ButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'glow'
}

export function GlassButton({ className, variant = 'default', children, ...props }: GlassButtonProps) {
  return (
    <Button
      className={cn(
        'rounded-xl transition-all duration-300',
        variant === 'default' && 'bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 hover:shadow-lg',
        variant === 'outline' && 'bg-transparent backdrop-blur-sm border border-white/30 text-white hover:bg-white/10',
        variant === 'ghost' && 'bg-transparent text-white/70 hover:text-white hover:bg-white/10',
        variant === 'glow' && 'bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
