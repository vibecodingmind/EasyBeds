'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Hotel, Eye, EyeOff, ArrowRight, Shield, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import PublicLayout from '@/components/layout/public-layout'

export default function LoginPage() {
  const router = useRouter()
  const login = useAppStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        toast.success('Welcome back!')
        router.push('/')
      } else {
        toast.error('Invalid email or password. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    { icon: Zap, label: 'Instant access to all features' },
    { icon: Shield, label: 'Enterprise-grade security' },
    { icon: Clock, label: '24/7 customer support' },
    { icon: CheckCircle2, label: 'Free plan available' },
  ]

  return (
    <PublicLayout>
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-0 h-[600px] w-[400px] rounded-full bg-teal-400/8 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 w-full max-w-5xl grid gap-8 lg:grid-cols-5">
          {/* Left side - Branding & perks */}
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
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                EasyBeds
              </span>
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Sign in to manage your hotel, track bookings, and grow your revenue — all in one place.
            </p>

            <div className="mt-8 space-y-4">
              {perks.map((perk) => (
                <div key={perk.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <perk.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/70">{perk.label}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm italic text-white/60 leading-relaxed">
                &ldquo;EasyBeds transformed how we manage our lodge. OTA sync eliminated double bookings entirely. Our revenue is up 28%.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white">
                  GM
                </div>
                <div>
                  <div className="text-xs font-medium text-white">Grace Mwangi</div>
                  <div className="text-xs text-white/40">Safari Lodge Nairobi</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login form */}
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
                <h2 className="text-2xl font-bold text-white">Log in to your account</h2>
                <p className="mt-1.5 text-sm text-white/50">
                  Enter your credentials to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/70 text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@hotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-white/70 text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      href="/reset-password"
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      autoComplete="current-password"
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
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Logging in...
                    </span>
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  )
}
