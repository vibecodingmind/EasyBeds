'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Hotel, Calendar, RefreshCw, Globe, Sparkles, Bot, TrendingUp,
  Users, BarChart3, CheckCircle2, ArrowRight, Star,
  ChevronRight, Shield, Zap, Clock, LayoutDashboard,
  MessageSquare, Phone, Mail, MapPin, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import PublicLayout from '@/components/layout/public-layout'

/* -------------------------------------------------------------------------- */
/*  CONTACT SECTION                                                           */
/* -------------------------------------------------------------------------- */

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Message sent! We'll get back to you within 24 hours.")
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    setLoading(false)
  }

  const contactMethods = [
    { icon: Mail, title: 'Email Us', value: 'hello@easybeds.io', secondary: 'support@easybeds.io' },
    { icon: Phone, title: 'Call Us', value: '+254 700 123 456', secondary: 'Mon-Fri 8am-6pm EAT' },
    { icon: MessageSquare, title: 'Live Chat', value: 'Available 24/7', secondary: 'Avg. response: 2 min' },
    { icon: MapPin, title: 'Visit Us', value: 'Westlands, Nairobi', secondary: 'Kenya' },
  ]

  return (
    <section id="contact" className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[60px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/5 blur-[50px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
            Get In Touch
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Reach out and our team will help you find the perfect plan for your hotel.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-name" className="text-white/70 text-sm font-medium">Full Name <span className="text-red-400">*</span></Label>
                  <Input
                    id="c-name" placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email" className="text-white/70 text-sm font-medium">Email <span className="text-red-400">*</span></Label>
                  <Input
                    id="c-email" type="email" placeholder="john@hotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-phone" className="text-white/70 text-sm font-medium">Phone</Label>
                  <Input
                    id="c-phone" type="tel" placeholder="+254 700 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-subject" className="text-white/70 text-sm font-medium">Subject <span className="text-red-400">*</span></Label>
                  <Input
                    id="c-subject" placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-message" className="text-white/70 text-sm font-medium">Message <span className="text-red-400">*</span></Label>
                <Textarea
                  id="c-message" placeholder="Tell us about your hotel and needs..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </div>
              <Button
                type="submit" disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  <>
                    Send Message <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {contactMethods.map((method) => (
                <div
                  key={method.title}
                  className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10 hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{method.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{method.value}</p>
                  <p className="text-xs text-white/40">{method.secondary}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-gray-900/80 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-2">Schedule a Demo</h3>
              <p className="text-sm text-white/60 mb-4">
                See EasyBeds in action with a personalized walkthrough for your hotel.
              </p>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0">
                  Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  FEATURES SECTION                                                          */
/* -------------------------------------------------------------------------- */
const features = [
  { icon: Calendar, title: 'Unified Calendar', description: 'See all bookings across channels in one view. Drag, drop, and manage with ease.' },
  { icon: RefreshCw, title: 'OTA Sync', description: 'Two-way iCal sync with Booking.com, Airbnb, and more. No more double bookings.' },
  { icon: Globe, title: 'Online Bookings', description: 'Your own branded booking page, zero commission. Guests book directly with you.' },
  { icon: Sparkles, title: 'Housekeeping', description: 'Auto-generated tasks, Kanban board for staff. Keep every room guest-ready.' },
  { icon: Bot, title: 'AI Concierge', description: '24/7 guest support powered by AI. Answer questions, handle requests automatically.' },
  { icon: TrendingUp, title: 'Dynamic Pricing', description: 'Automatic rate adjustments based on demand, seasonality, and competitor rates.' },
  { icon: Users, title: 'Guest Portal', description: 'Self-service check-in, booking management, and messaging — all from their phone.' },
  { icon: BarChart3, title: 'Revenue Analytics', description: 'ADR, RevPAR, occupancy forecasts at a glance. Data-driven decisions made simple.' },
]

function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gray-950/50 py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[50px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/5 blur-[50px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
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
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500/30">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
            </motion.div>
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
  { step: '01', title: 'Sign Up', description: 'Create your account in under 60 seconds. No credit card required.', icon: Clock },
  { step: '02', title: 'Add Rooms', description: 'Configure your room types, set rates, and upload photos.', icon: Hotel },
  { step: '03', title: 'Start Booking', description: 'Accept reservations from all channels — direct, OTAs, walk-ins.', icon: CheckCircle2 },
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
              {idx < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full border-t border-emerald-500/20 md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-white/5 backdrop-blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
                  <item.icon className="h-7 w-7" />
                </div>
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
    name: 'Free', price: '$0', period: 'forever',
    description: 'Perfect for small hotels getting started.',
    features: ['Up to 5 rooms', 'Basic booking management', 'Calendar view', 'Guest management', 'Email support'],
    cta: 'Get Started Free', popular: false,
  },
  {
    name: 'Starter', price: '$49', period: '/month',
    description: 'For growing hotels that need more power.',
    features: ['Up to 25 rooms', 'OTA channel sync (3 channels)', 'Online booking page', 'Housekeeping management', 'Revenue reports', 'AI Concierge (100 messages/mo)', 'Priority email support'],
    cta: 'Start Starter Plan', popular: false,
  },
  {
    name: 'Pro', price: '$99', period: '/month',
    description: 'Full-featured platform for serious operators.',
    features: ['Unlimited rooms', 'Unlimited OTA channels', 'Dynamic pricing engine', 'Advanced analytics & forecasts', 'Loyalty program', 'Guest portal & self check-in', 'AI Concierge (unlimited)', 'Coupons & promotions', 'WhatsApp notifications', 'Dedicated support'],
    cta: 'Start Pro Plan', popular: true,
  },
]

function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gray-950/70 py-24 sm:py-32">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[400px] w-[600px] rounded-full bg-emerald-500/8 blur-[60px]" />
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
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
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
              <Link href="/register">
                <Button
                  className={cn(
                    'w-full transition-all duration-300',
                    tier.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border-0'
                      : 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
                  )}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </motion.div>
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
    name: 'Grace Mwangi', role: 'General Manager, Safari Lodge Nairobi',
    content: 'EasyBeds transformed how we manage our 32-room lodge. OTA sync eliminated double bookings entirely, and the AI concierge handles 80% of guest queries automatically. Our revenue is up 28% in 6 months.',
    rating: 5,
  },
  {
    name: 'Joseph Kayombo', role: 'Owner, Zanzibar Beach Resort',
    content: 'We switched from three different tools to just EasyBeds. The unified calendar alone saves us 2 hours daily. Dynamic pricing helped us increase ADR by 15% during peak season. Incredible value.',
    rating: 5,
  },
  {
    name: 'Amina Hassan', role: 'Operations Manager, Kilimanjaro Grand Hotel',
    content: 'The housekeeping Kanban board is a game changer. Our staff knows exactly what to do, room turnover is 30% faster, and guest complaints about cleanliness dropped to near zero. EasyBeds just works.',
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
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
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
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/50">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  CTA SECTION                                                               */
/* -------------------------------------------------------------------------- */
function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-20 -right-20 h-[500px] w-[400px] rounded-full bg-teal-400/15 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to grow your hotel?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
          Join 2,400+ hotels already using EasyBeds to boost revenue, streamline operations, and delight guests.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button
              size="lg"
              className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 sm:text-lg border-0"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-white/40">
            No credit card required · Free plan available
          </p>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  LANDING PAGE                                                              */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const { isAuthenticated, currentUser, logout } = useAppStore()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarDropdown, setAvatarDropdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
      if (avatarDropdown && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileOpen, avatarDropdown])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/4 right-0 h-[600px] w-[400px] rounded-full bg-teal-400/10 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[60px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
          <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-400/8 blur-[40px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
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
            {isAuthenticated && currentUser ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 sm:text-lg border-0"
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 sm:text-lg border-0"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-13 border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 sm:text-lg"
                  >
                    Book a Demo
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Stats */}
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

          <div className="mt-12 animate-bounce">
            <ChevronRight className="h-6 w-6 rotate-90 text-white/30" />
          </div>
        </div>
      </section>

      {/* Page Sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
    </PublicLayout>
  )
}
