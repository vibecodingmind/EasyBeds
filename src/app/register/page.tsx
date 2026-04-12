'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Hotel, Eye, EyeOff, ArrowRight, Shield, Zap, CheckCircle2, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import PublicLayout from '@/components/layout/public-layout'
import { cn } from '@/lib/utils'

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
  if (score <= 4) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
}

const requirements = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
]

export default function RegisterPage() {
  const router = useRouter()
  const register = useAppStore((s) => s.register)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelSlug, setHotelSlug] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  // Auto-generate slug from hotel name
  const handleHotelNameChange = (value: string) => {
    setHotelName(value)
    setHotelSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !email || !password || !confirmPassword || !hotelName || !hotelSlug) {
      toast.error('Please fill in all fields')
      return
    }

    if (passwordStrength.score < 2) {
      toast.error('Password is too weak. Please use a stronger password.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const success = await register({
        name: fullName,
        email,
        password,
        hotelName,
        hotelSlug,
      })
      if (success) {
        toast.success('Account created successfully! Welcome to EasyBeds!')
        router.push('/dashboard')
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Zap, label: 'Instant setup' },
    { icon: Shield, label: 'Bank-level encryption' },
    { icon: Users, label: '2,400+ hotel trust' },
    { icon: CheckCircle2, label: 'No credit card required' },
  ]

  return (
    <PublicLayout>
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 left-0 h-[600px] w-[400px] rounded-full bg-teal-400/8 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 w-full max-w-5xl grid gap-8 lg:grid-cols-5">
          {/* Left side - Branding & features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex lg:col-span-2 flex-col justify-center"
          >
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EasyBeds</span>
            </Link>

            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Start your{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                free trial
              </span>
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Create your account in under 60 seconds. No credit card required.
            </p>

            <div className="mt-8 space-y-4">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/70">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-white mb-3">Trusted by leading hotels</p>
              <div className="flex items-center gap-4">
                {['GM', 'JK', 'AH'].map((initials) => (
                  <div key={initials} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white">
                      {initials}
                    </div>
                  </div>
                ))}
                <span className="text-xs text-white/40">+2,400 more</span>
              </div>
            </div>
          </motion.div>

          {/* Right side - Register form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <div className="w-full max-w-md mx-auto lg:max-w-none rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">EasyBeds</span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Create your account</h2>
                <p className="mt-1.5 text-sm text-white/50">
                  Get started with EasyBeds — it&apos;s free
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-white/70 text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="reg-name"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-white/70 text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@hotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-white/70 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all duration-300',
                              passwordStrength.score >= level ? passwordStrength.color : 'bg-white/10'
                            )}
                          />
                        ))}
                        <span className="ml-2 text-xs text-white/50">{passwordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {requirements.map((req) => (
                          <div key={req.label} className="flex items-center gap-1.5">
                            <Check className={cn('h-3 w-3', req.test(password) ? 'text-emerald-400' : 'text-white/20')} />
                            <span className={cn('text-xs', req.test(password) ? 'text-white/60' : 'text-white/30')}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password" className="text-white/70 text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        'h-11 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20',
                        confirmPassword && confirmPassword !== password && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
                        confirmPassword && confirmPassword === password && 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20',
                      )}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>

                {/* Hotel Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-hotel-name" className="text-white/70 text-sm font-medium">
                      Hotel Name
                    </Label>
                    <Input
                      id="reg-hotel-name"
                      placeholder="e.g. Safari Lodge"
                      value={hotelName}
                      onChange={(e) => handleHotelNameChange(e.target.value)}
                      className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-hotel-slug" className="text-white/70 text-sm font-medium">
                      Hotel Slug
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">easybeds.io/</span>
                      <Input
                        id="reg-hotel-slug"
                        placeholder="safari-lodge"
                        value={hotelSlug}
                        onChange={(e) => setHotelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="h-11 pl-[7.5rem] border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-white/30">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-white/50">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-white/50">Privacy Policy</Link>.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  )
}
