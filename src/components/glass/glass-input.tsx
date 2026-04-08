'use client'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from '@/components/ui/input'

interface GlassInputProps extends InputProps {
  glass?: boolean
}

export function GlassInput({ className, glass = true, ...props }: GlassInputProps) {
  if (!glass) return <Input className={className} {...props} />

  return (
    <Input
      className={cn(
        'rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 focus:bg-white/15 transition-all duration-300',
        className
      )}
      {...props}
    />
  )
}
