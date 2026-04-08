'use client'

import React, { useState, useEffect } from 'react'
import {
  Hotel, Calendar, RefreshCw, Globe, Sparkles, Bot, TrendingUp,
  Users, BarChart3, CheckCircle2, ArrowRight, Star, Menu, X,
  Eye, EyeOff, ChevronRight, Shield, Zap, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { canAccessView, getDefaultView } from '@/lib/permissions'
import { initRouter, getViewTitle } from '@/lib/router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { DashboardView } from '@/components/views/dashboard-view'
import { CalendarView } from '@/components/views/calendar-view'
import { BookingsView } from '@/components/views/bookings-view'
import { RoomsView } from '@/components/views/rooms-view'
import { GuestsView } from '@/components/views/guests-view'
import { ChannelsView } from '@/components/views/channels-view'
import { ReportsView } from '@/components/views/reports-view'
import { SettingsView } from '@/components/views/settings-view'
import { HousekeepingView } from '@/components/views/housekeeping-view'
import { ActivityView } from '@/components/views/activity-view'
import { NightAuditView } from '@/components/views/night-audit-view'
import { ConciergeView } from '@/components/views/concierge-view'
import { LoyaltyView } from '@/components/views/loyalty-view'
import { ReviewsView } from '@/components/views/reviews-view'
import { SubscriptionPage } from '@/components/payments/subscription-page'
import { RevenueView } from '@/components/views/revenue-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { RateParityView } from '@/components/views/rate-parity-view'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { NewBookingDialog } from '@/components/booking/new-booking-dialog'
import { BookingDetailsDialog } from '@/components/booking/booking-details-dialog'

/* -------------------------------------------------------------------------- */
/*  NAVIGATION                                                                */
/* -------------------------------------------------------------------------- */
function Navbar({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">EasyBeds</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            onClick={onLogin}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Log In
          </Button>
          <Button
            onClick={onSignup}
            className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 text-white"
          >
            Start Free Trial
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-gray-950/95 backdrop-blur-2xl px-4 pb-4 pt-2 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => { onLogin(); setMobileOpen(false) }}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Log In
            </Button>
            <Button
              onClick={() => { onSignup(); setMobileOpen(false) }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/*  HERO SECTION                                                              */
/* -------------------------------------------------------------------------- */
function HeroSection({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Aurora orb 1 */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Aurora orb 2 */}
        <div className="absolute top-1/4 right-0 h-[600px] w-[400px] rounded-full bg-teal-400/10 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        {/* Aurora orb 3 */}
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        {/* Aurora orb 4 - teal accent */}
        <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-400/8 blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-300 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Trusted by 2,400+ hotels across Africa
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          The Simple{' '}
          <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            Hotel Management
          </span>{' '}
          Platform
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl"
        >
          Manage bookings, sync OTAs, and grow revenue — all in one place. Built for hotels in Africa and beyond.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          {/* Primary CTA - glow glass button */}
          <Button
            size="lg"
            onClick={onSignup}
            className="h-13 relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 sm:text-lg border-0"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
            {/* Glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 hover:opacity-100 transition-opacity" />
          </Button>
          {/* Secondary CTA - glass button */}
          <Button
            size="lg"
            variant="outline"
            onClick={onLogin}
            className="h-13 border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 sm:text-lg"
          >
            Book a Demo
          </Button>
        </motion.div>

        {/* Stats - Glass Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-4 sm:gap-6"
        >
          {[
            { label: 'Hotels Managed', value: '2,400+' },
            { label: 'Rooms Connected', value: '48,000+' },
            { label: 'Monthly Bookings', value: '120K+' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10 sm:p-6"
            >
              <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-white/50 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <div className="mt-12 animate-bounce">
          <ChevronRight className="h-6 w-6 rotate-90 text-white/30" />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  FEATURES SECTION                                                          */
/* -------------------------------------------------------------------------- */
const features = [
  {
    icon: Calendar,
    title: 'Unified Calendar',
    description: 'See all bookings across channels in one view. Drag, drop, and manage with ease.',
  },
  {
    icon: RefreshCw,
    title: 'OTA Sync',
    description: 'Two-way iCal sync with Booking.com, Airbnb, and more. No more double bookings.',
  },
  {
    icon: Globe,
    title: 'Online Bookings',
    description: 'Your own branded booking page, zero commission. Guests book directly with you.',
  },
  {
    icon: Sparkles,
    title: 'Housekeeping',
    description: 'Auto-generated tasks, Kanban board for staff. Keep every room guest-ready.',
  },
  {
    icon: Bot,
    title: 'AI Concierge',
    description: '24/7 guest support powered by AI. Answer questions, handle requests automatically.',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing',
    description: 'Automatic rate adjustments based on demand, seasonality, and competitor rates.',
  },
  {
    icon: Users,
    title: 'Guest Portal',
    description: 'Self-service check-in, booking management, and messaging — all from their phone.',
  },
  {
    icon: BarChart3,
    title: 'Revenue Analytics',
    description: 'ADR, RevPAR, occupancy forecasts at a glance. Data-driven decisions made simple.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gray-950/50 py-24 sm:py-32">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/5 blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            Powerful Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything your hotel needs
          </h2>
          <p className="mt-4 text-lg text-white/60">
            From bookings to housekeeping, revenue management to guest engagement — we&apos;ve got you covered.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500/30">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  HOW IT WORKS                                                              */
/* -------------------------------------------------------------------------- */
const steps = [
  {
    step: '01',
    title: 'Sign Up',
    description: 'Create your account in under 60 seconds. No credit card required.',
    icon: Clock,
  },
  {
    step: '02',
    title: 'Add Rooms',
    description: 'Configure your room types, set rates, and upload photos.',
    icon: Hotel,
  },
  {
    step: '03',
    title: 'Start Booking',
    description: 'Accept reservations from all channels — direct, OTAs, walk-ins.',
    icon: CheckCircle2,
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
            Getting Started
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-white/60">
            No complicated setup. No lengthy onboarding. Just three simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, idx) => (
            <div key={item.step} className="relative text-center">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full border-t border-emerald-500/20 md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                {/* Outer glass ring */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-white/5 backdrop-blur-xl" />
                {/* Inner icon circle */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
                  <item.icon className="h-7 w-7" />
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-emerald-600/30">
                  {item.step}
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
              <p className="max-w-xs mx-auto text-white/60">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  PRICING SECTION                                                           */
/* -------------------------------------------------------------------------- */
const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small hotels getting started.',
    features: [
      'Up to 5 rooms',
      'Basic booking management',
      'Calendar view',
      'Guest management',
      'Email support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For growing hotels that need more power.',
    features: [
      'Up to 25 rooms',
      'OTA channel sync (3 channels)',
      'Online booking page',
      'Housekeeping management',
      'Revenue reports',
      'AI Concierge (100 messages/mo)',
      'Priority email support',
    ],
    cta: 'Start Starter Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'Full-featured platform for serious operators.',
    features: [
      'Unlimited rooms',
      'Unlimited OTA channels',
      'Dynamic pricing engine',
      'Advanced analytics & forecasts',
      'Loyalty program',
      'Guest portal & self check-in',
      'AI Concierge (unlimited)',
      'Coupons & promotions',
      'WhatsApp notifications',
      'Dedicated support',
    ],
    cta: 'Start Pro Plan',
    popular: true,
  },
]

function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gray-950/70 py-24 sm:py-32">
      {/* Background glow for popular card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[400px] w-[600px] rounded-full bg-emerald-500/8 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Simple Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Plans that grow with you
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Start free. Upgrade when you&apos;re ready. No hidden fees, ever.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300',
                tier.popular
                  ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 lg:scale-105'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-white/60">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-sm text-white/50">{tier.period}</span>
                </div>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  'w-full transition-all duration-300',
                  tier.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                    : 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
                )}
                variant={tier.popular ? 'default' : 'outline'}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  TESTIMONIALS                                                              */
/* -------------------------------------------------------------------------- */
const testimonials = [
  {
    name: 'Grace Mwangi',
    role: 'General Manager, Safari Lodge Nairobi',
    content:
      'EasyBeds transformed how we manage our 32-room lodge. OTA sync eliminated double bookings entirely, and the AI concierge handles 80% of guest queries automatically. Our revenue is up 28% in 6 months.',
    rating: 5,
  },
  {
    name: 'Joseph Kayombo',
    role: 'Owner, Zanzibar Beach Resort',
    content:
      'We switched from three different tools to just EasyBeds. The unified calendar alone saves us 2 hours daily. Dynamic pricing helped us increase ADR by 15% during peak season. Incredible value.',
    rating: 5,
  },
  {
    name: 'Amina Hassan',
    role: 'Operations Manager, Kilimanjaro Grand Hotel',
    content:
      'The housekeeping Kanban board is a game changer. Our staff knows exactly what to do, room turnover is 30% faster, and guest complaints about cleanliness dropped to near zero. EasyBeds just works.',
    rating: 5,
  },
]

function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Loved by hoteliers across Africa
          </h2>
          <p className="mt-4 text-lg text-white/60">
            See what our customers have to say about EasyBeds.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-white/70">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-emerald-400 backdrop-blur-sm">
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/50">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  CTA SECTION                                                               */
/* -------------------------------------------------------------------------- */
function CTASection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-20 -right-20 h-[500px] w-[400px] rounded-full bg-teal-400/15 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />
      </div>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to grow your hotel?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
          Join 2,400+ hotels already using EasyBeds to boost revenue, streamline operations, and delight guests.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={onSignup}
            className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 sm:text-lg border-0"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-white/40">
            No credit card required · Free plan available
          </p>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  FOOTER                                                                    */
/* -------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/10 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/20">
                <Hotel className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EasyBeds</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Smart hotel management platform for booking management, channel distribution, and guest services.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Integrations', 'Changelog'].map((item) => (
                <li key={item}>
                  <a href="#features" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} EasyBeds. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*  LOGIN / REGISTER MODAL                                                    */
/* -------------------------------------------------------------------------- */
function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { login, register } = useAppStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('owner@easybeds.com')
  const [password, setPassword] = useState('owner123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    hotelName: '',
  })

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
        onClose()
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
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.hotelName) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const hotelSlug = signupData.hotelName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36)
      const success = await register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        hotelName: signupData.hotelName,
        hotelSlug,
      })
      if (success) {
        toast.success('Account created successfully!')
        onClose()
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-gray-900/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            {mode === 'login'
              ? 'Sign in to your hotel dashboard'
              : 'Set up your hotel on EasyBeds'}
          </p>
        </div>

        {mode === 'login' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-white/70">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="manager@yourhotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-white/70">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
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
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
              <p className="mb-1 font-medium text-white/70">Demo accounts:</p>
              <p>Owner: <span className="font-mono text-emerald-400/80">owner@easybeds.com</span> / <span className="font-mono text-emerald-400/80">owner123</span></p>
              <p>Admin: <span className="font-mono text-emerald-400/80">admin@easybeds.com</span> / <span className="font-mono text-emerald-400/80">admin123</span></p>
            </div>
            <p className="text-center text-sm text-white/50">
              Don&apos;t have an account?{' '}
              <button
                className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-white/70">Full Name</Label>
              <Input
                id="reg-name"
                placeholder="John Smith"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-white/70">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="john@hotel.com"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-white/70">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-hotel" className="text-white/70">Hotel Name</Label>
              <Input
                id="reg-hotel"
                placeholder="My Hotel"
                value={signupData.hotelName}
                onChange={(e) => setSignupData({ ...signupData, hotelName: e.target.value })}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
              onClick={handleSignup}
              disabled={loading || !signupData.name || !signupData.email || !signupData.password || !signupData.hotelName}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <button
                className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  LANDING PAGE (full marketing page shown to visitors)                      */
/* -------------------------------------------------------------------------- */
function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar
        onLogin={() => setAuthOpen(true)}
        onSignup={() => setAuthOpen(true)}
      />
      <HeroSection
        onSignup={() => setAuthOpen(true)}
        onLogin={() => setAuthOpen(true)}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection onSignup={() => setAuthOpen(true)} />
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  VIEW RENDERER (authenticated dashboard)                                   */
/* -------------------------------------------------------------------------- */
function ViewRenderer() {
  const { currentView, userRole, platformRole, isAuthenticated } = useAppStore()

  // Initialise hash-based router and sync document title
  useEffect(() => {
    const cleanup = initRouter(
      (view) => useAppStore.getState().setCurrentView(view),
      (view) => { document.title = getViewTitle(view) },
    )
    return cleanup
  }, [])

  // Keep document title in sync when currentView changes
  useEffect(() => {
    document.title = getViewTitle(currentView)
  }, [currentView])

  // Redirect if user doesn't have permission for current view
  useEffect(() => {
    if (!isAuthenticated) return
    if (!canAccessView(userRole, platformRole, currentView)) {
      const defaultView = getDefaultView(userRole, platformRole)
      useAppStore.getState().navigate(defaultView)
    }
  }, [currentView, userRole, platformRole, isAuthenticated])

  const viewComponents: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    calendar: <CalendarView />,
    bookings: <BookingsView />,
    rooms: <RoomsView />,
    guests: <GuestsView />,
    channels: <ChannelsView />,
    reports: <ReportsView />,
    settings: <SettingsView />,
    housekeeping: <HousekeepingView />,
    activity: <ActivityView />,
    night_audit: <NightAuditView />,
    revenue: <RevenueView />,
    analytics: <AnalyticsView />,
    'rate-parity': <RateParityView />,
    concierge: <ConciergeView />,
    loyalty: <LoyaltyView />,
    reviews: <ReviewsView />,
    subscription: <SubscriptionPage />,
    admin: <AdminDashboard />,
  }

  const hasAccess = canAccessView(userRole, platformRole, currentView)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="flex-1 overflow-auto"
      >
        {!hasAccess ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have permission to view this page.
              </p>
            </div>
          </div>
        ) : (
          viewComponents[currentView] || <DashboardView />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */
export default function Home() {
  const { isAuthenticated, sidebarOpen } = useAppStore()

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main
          className={cn(
            'flex-1 overflow-hidden transition-all duration-300',
            sidebarOpen ? 'md:ml-0' : 'md:ml-0'
          )}
        >
          <ViewRenderer />
        </main>
      </div>
      <NewBookingDialog />
      <BookingDetailsDialog />
    </div>
  )
}
