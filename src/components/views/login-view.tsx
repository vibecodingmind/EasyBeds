'use client'

import React, { useState } from 'react'
import { Hotel, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function LoginView() {
  const { login, register } = useAppStore()
  const [email, setEmail] = useState('owner@easybeds.com')
  const [password, setPassword] = useState('owner123')
  const [showPassword, setShowPassword] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    hotelName: '',
  })
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        toast.success('Welcome back!')
      } else {
        toast.error('Invalid email or password')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password ||
      !signupData.hotelName
    ) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const hotelSlug =
        signupData.hotelName.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
        '-' +
        Date.now().toString(36)
      const success = await register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        hotelName: signupData.hotelName,
        hotelSlug,
      })
      if (success) {
        toast.success('Account created! Please check your email to verify your account.')
        setShowSignup(false)
        setSignupData({ name: '', email: '', password: '', hotelName: '' })
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Please enter your email address')
      return
    }
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()

      // Always show success message (security best practice)
      setForgotSent(true)
      toast.success('Check your email for reset instructions')
    } catch {
      // Even on error, show success to prevent email enumeration
      setForgotSent(true)
    } finally {
      setForgotLoading(false)
    }
  }

  const resetForgotDialog = () => {
    setShowForgotPassword(false)
    setForgotEmail('')
    setForgotSent(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EasyBeds</span>
          </div>
          <p className="mt-2 text-sm text-emerald-100">
            Smart Hotel Management
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Manage your hotel
            <br />
            with confidence.
          </h2>
          <p className="max-w-md text-emerald-100">
            Streamline bookings, manage rooms, connect with channels, and delight
            your guests — all from one powerful dashboard.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Active Hotels', value: '2,400+' },
              { label: 'Rooms Managed', value: '48,000+' },
              { label: 'Bookings/Month', value: '120K+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-emerald-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-emerald-200">
          &copy; 2025 EasyBeds. All rights reserved.
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">EasyBeds</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your hotel management dashboard
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@yourhotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotSent(false)
                    setShowForgotPassword(true)
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Dialog open={showSignup} onOpenChange={setShowSignup}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Create Hotel Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create your hotel account</DialogTitle>
                <DialogDescription>
                  Set up your hotel on EasyBeds and start managing bookings
                  today.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Smith"
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john@hotel.com"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-hotel">Hotel Name</Label>
                  <Input
                    id="signup-hotel"
                    placeholder="My Hotel"
                    value={signupData.hotelName}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        hotelName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSignup(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSignup}
                  disabled={
                    loading ||
                    !signupData.name ||
                    !signupData.email ||
                    !signupData.password ||
                    !signupData.hotelName
                  }
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Forgot Password Dialog */}
          <Dialog open={showForgotPassword} onOpenChange={(open) => {
            if (!open) resetForgotDialog()
            else setShowForgotPassword(open)
          }}>
            <DialogContent className="sm:max-w-md">
              {!forgotSent ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Reset your password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email address</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@hotel.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={resetForgotDialog}
                    >
                      Back to login
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading || !forgotEmail}
                    >
                      {forgotLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Check your email</DialogTitle>
                    <DialogDescription>
                      {/* empty description for layout */}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Reset link sent!</h3>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      If an account exists with <strong className="text-foreground">{forgotEmail}</strong>, you will receive a password reset link shortly.
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Don&apos;t forget to check your spam folder.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={resetForgotDialog}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <button className="text-emerald-600 hover:underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-emerald-600 hover:underline">
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
