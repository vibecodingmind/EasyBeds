'use client'

import React, { useState } from 'react'
import { Hotel, Eye, EyeOff } from 'lucide-react'
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
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    hotelName: '',
  })
  const [loading, setLoading] = useState(false)

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
        toast.success('Account created successfully!')
        setShowSignup(false)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
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
