'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, CheckCircle2, ArrowRight, Zap, Clock, Users, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

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

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the change takes effect at the start of your next billing cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Both Starter and Pro plans come with a 14-day free trial. No credit card required to start. You\'ll only be charged after the trial ends if you choose to continue.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes! Annual billing comes with a 20% discount. Starter annual is $470/year (save $118) and Pro annual is $950/year (save $238).',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, American Express, bank transfers, and M-Pesa (for East African hotels). All payments are processed securely through Stripe.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No, there are no setup fees for any plan. Simply create your account and start using EasyBeds immediately.',
  },
  {
    q: 'Do you offer enterprise pricing?',
    a: 'Yes, we offer custom enterprise plans for hotel groups and chains with 10+ properties. Contact our sales team for a custom quote.',
  },
]

export default function PricingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/8 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Simple Pricing
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Plans that{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                grow with you
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Start free. Upgrade when you&apos;re ready. No hidden fees, ever. All plans include a 14-day free trial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative overflow-hidden pb-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[400px] w-[600px] rounded-full bg-emerald-500/8 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
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
                <Link href="/contact">
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

      {/* Feature Comparison */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Feature Comparison</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 bg-white/5">
              <div className="text-sm font-semibold text-white">Feature</div>
              <div className="text-sm font-semibold text-white text-center">Free</div>
              <div className="text-sm font-semibold text-white text-center">Starter</div>
              <div className="text-sm font-semibold text-white text-center">Pro</div>
            </div>
            {[
              ['Rooms', '5', '25', 'Unlimited'],
              ['OTA Channels', '—', '3', 'Unlimited'],
              ['Online Booking Page', '—', 'Yes', 'Yes'],
              ['Dynamic Pricing', '—', '—', 'Yes'],
              ['AI Concierge', '—', '100 msg/mo', 'Unlimited'],
              ['Loyalty Program', '—', '—', 'Yes'],
              ['WhatsApp Notifications', '—', '—', 'Yes'],
              ['Priority Support', '—', 'Yes', 'Dedicated'],
            ].map(([feature, free, starter, pro], i) => (
              <div key={feature} className={cn('grid grid-cols-4 gap-4 px-4 py-3', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                <div className="text-sm text-white/70">{feature}</div>
                <div className="text-sm text-white/50 text-center">{free === '—' ? '—' : free}</div>
                <div className="text-sm text-white/50 text-center">{starter === '—' ? '—' : starter}</div>
                <div className="text-sm text-white/50 text-center">{pro}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Pricing FAQ</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 border-0">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-13 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
