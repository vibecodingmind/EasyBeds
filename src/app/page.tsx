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
import { RevenueView } from '@/components/views/revenue-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { RateParityView } from '@/components/views/rate-parity-view'
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
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">EasyBeds</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" onClick={onLogin} className="text-gray-600">
            Log In
          </Button>
          <Button
            onClick={onSignup}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Start Free Trial
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" onClick={() => { onLogin(); setMobileOpen(false) }}>
              Log In
            </Button>
            <Button
              onClick={() => { onSignup(); setMobileOpen(false) }}
              className="bg-emerald-600 hover:bg-emerald-700"
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
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      {/* Decorative blobs */}
      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-16 text-center sm:px-6 lg:px-8">
        <Badge className="mb-6 border-emerald-300 bg-emerald-500/20 px-4 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/30">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Trusted by 2,400+ hotels across Africa
        </Badge>

        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          The Simple{' '}
          <span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
            Hotel Management
          </span>{' '}
          Platform
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-emerald-100 sm:text-xl">
          Manage bookings, sync OTAs, and grow revenue — all in one place. Built for hotels in Africa and beyond.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={onSignup}
            className="h-13 bg-white px-8 text-base font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50 sm:text-lg"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onLogin}
            className="h-13 border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 sm:text-lg"
          >
            Book a Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-6 sm:gap-8">
          {[
            { label: 'Hotels Managed', value: '2,400+' },
            { label: 'Rooms Connected', value: '48,000+' },
            { label: 'Monthly Bookings', value: '120K+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-emerald-200 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 animate-bounce">
          <ChevronRight className="h-6 w-6 rotate-90 text-emerald-200" />
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
    <section id="features" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3.5 w-3.5" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything your hotel needs
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From bookings to housekeeping, revenue management to guest engagement — we&apos;ve got you covered.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-0 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
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
    <section id="how-it-works" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <ArrowRight className="mr-1 h-3.5 w-3.5" />
            Getting Started
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No complicated setup. No lengthy onboarding. Just three simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, idx) => (
            <div key={item.step} className="relative text-center">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-emerald-200 md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow">
                  {item.step}
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="max-w-xs mx-auto text-gray-600">{item.description}</p>
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
    <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Shield className="mr-1 h-3.5 w-3.5" />
            Simple Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Plans that grow with you
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start free. Upgrade when you&apos;re ready. No hidden fees, ever.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                'relative flex flex-col overflow-hidden border transition-shadow hover:shadow-lg',
                tier.popular
                  ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500'
                  : 'border-gray-200 shadow-sm'
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-emerald-600 px-4 py-1 text-xs font-semibold text-white rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    'w-full',
                    tier.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  )}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
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
    <section id="testimonials" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Star className="mr-1 h-3.5 w-3.5" />
            Testimonials
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by hoteliers across Africa
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See what our customers have to say about EasyBeds.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-24 sm:py-32">
      <div className="absolute inset-0 opacity-[0.05]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to grow your hotel?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
          Join 2,400+ hotels already using EasyBeds to boost revenue, streamline operations, and delight guests.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={onSignup}
            className="h-13 bg-white px-8 text-base font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50 sm:text-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-emerald-200">
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
    <footer className="bg-gray-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <Hotel className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EasyBeds</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Smart hotel management platform for booking management, channel distribution, and guest services.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Integrations', 'Changelog'].map((item) => (
                <li key={item}>
                  <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-emerald-400">
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
                  <a href="#" className="text-sm text-gray-400 transition-colors hover:text-emerald-400">
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
                  <a href="#" className="text-sm text-gray-400 transition-colors hover:text-emerald-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'login'
              ? 'Sign in to your hotel dashboard'
              : 'Set up your hotel on EasyBeds'}
          </p>
        </div>

        {mode === 'login' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="manager@yourhotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              <p className="mb-1 font-medium text-gray-600">Demo accounts:</p>
              <p>Owner: <span className="font-mono">owner@easybeds.com</span> / <span className="font-mono">owner123</span></p>
              <p>Admin: <span className="font-mono">admin@easybeds.com</span> / <span className="font-mono">admin123</span></p>
            </div>
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <button
                className="font-medium text-emerald-600 hover:text-emerald-700"
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                placeholder="John Smith"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="john@hotel.com"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-hotel">Hotel Name</Label>
              <Input
                id="reg-hotel"
                placeholder="My Hotel"
                value={signupData.hotelName}
                onChange={(e) => setSignupData({ ...signupData, hotelName: e.target.value })}
              />
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
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
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <button
                className="font-medium text-emerald-600 hover:text-emerald-700"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  LANDING PAGE (full marketing page shown to visitors)                      */
/* -------------------------------------------------------------------------- */
function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
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
  const { currentView } = useAppStore()

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
  }

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
        {viewComponents[currentView] || <DashboardView />}
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
    <div className="flex h-screen overflow-hidden bg-background">
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
