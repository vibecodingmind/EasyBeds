'use client'
import React, { useState } from 'react'
import { CheckCircle, Crown, Sparkles, Star, Zap, CreditCard, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/glass/glass-card'
import { GlassBadge } from '@/components/glass/glass-badge'

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Star,
    price: '$0',
    period: 'forever',
    description: 'Get started with basic hotel management',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/15',
    borderColor: 'border-gray-500/20',
    features: [
      'Up to 5 rooms',
      'Basic booking management',
      'Calendar view',
      'Guest management',
      'Email notifications',
      'Community support',
    ],
    limits: { rooms: 5, channels: 0, users: 1 },
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: '$49',
    period: '/month',
    description: 'For growing hotels that need more power',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/20',
    popular: false,
    features: [
      'Up to 25 rooms',
      '3 OTA channel sync',
      'Online booking page',
      'Housekeeping management',
      'Revenue reports',
      'AI Concierge (100 msgs/mo)',
      'Priority email support',
    ],
    limits: { rooms: 25, channels: 3, users: 5 },
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Sparkles,
    price: '$99',
    period: '/month',
    description: 'Full-featured for serious hotel operators',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    popular: true,
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
    limits: { rooms: -1, channels: -1, users: 20 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: '$249',
    period: '/month',
    description: 'For hotel chains and large operations',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    features: [
      'Everything in Pro',
      'Multi-property management',
      'Custom integrations',
      'API access',
      'White-label option',
      'SLA guarantee (99.9%)',
      'Dedicated account manager',
      'Custom onboarding',
      'Priority feature requests',
    ],
    limits: { rooms: -1, channels: -1, users: -1 },
  },
]

// Mock billing history
const billingHistory = [
  { id: '1', date: '2026-04-01', description: 'Pro Plan - Monthly', amount: '$99.00', status: 'paid', method: 'Stripe' },
  { id: '2', date: '2026-03-01', description: 'Pro Plan - Monthly', amount: '$99.00', status: 'paid', method: 'Stripe' },
  { id: '3', date: '2026-02-01', description: 'Pro Plan - Monthly', amount: '$99.00', status: 'paid', method: 'Stripe' },
  { id: '4', date: '2026-01-01', description: 'Starter Plan - Monthly', amount: '$49.00', status: 'paid', method: 'PayPal' },
  { id: '5', date: '2025-12-01', description: 'Free Plan', amount: '$0.00', status: 'paid', method: '-' },
]

export function SubscriptionPage() {
  const { hotel } = useAppStore()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const currentPlan = hotel?.plan || 'free'
  const [showBillingHistory, setShowBillingHistory] = useState(false)

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      toast.info('You are already on this plan')
      return
    }
    if (planId === 'free') {
      toast.info('Downgrading to Free plan')
    } else {
      toast.success(`Redirecting to checkout for ${plans.find(p => p.id === planId)?.name} plan...`)
    }
  }

  const currentPlanData = plans.find(p => p.id === currentPlan)
  const yearlyDiscount = (monthly: string) => {
    const price = parseInt(monthly.replace('$', ''))
    return `$${Math.round(price * 10)}`
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription & Billing</h1>
          <p className="text-sm text-white/50">Manage your plan, view invoices, and update payment methods</p>
        </div>
        {currentPlanData && (
          <div className="flex items-center gap-3">
            <GlassBadge variant={currentPlan === 'free' ? 'default' : 'success'}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              Current: {currentPlanData.name} Plan
            </GlassBadge>
          </div>
        )}
      </div>

      {/* Current Plan Summary */}
      {currentPlanData && (
        <GlassCard className="glow-emerald">
          <GlassCardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', currentPlanData.bgColor)}>
                <currentPlanData.icon className={cn('h-7 w-7', currentPlanData.color)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{currentPlanData.name} Plan</h3>
                <p className="text-sm text-white/50">{currentPlanData.description}</p>
                <p className="text-sm text-white/40 mt-1">
                  {currentPlanData.limits.rooms === -1 ? 'Unlimited rooms' : `Up to ${currentPlanData.limits.rooms} rooms`}
                  {' · '}
                  {currentPlanData.limits.channels === -1 ? 'Unlimited channels' : `${currentPlanData.limits.channels} channels`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{currentPlanData.price}<span className="text-base font-normal text-white/40">{currentPlanData.period}</span></p>
              {currentPlan !== 'free' && (
                <p className="text-xs text-white/30">Next billing: May 1, 2026</p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn('text-sm', billingPeriod === 'monthly' ? 'text-white' : 'text-white/40')}>Monthly</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className={cn(
            'relative h-7 w-14 rounded-full transition-colors',
            billingPeriod === 'yearly' ? 'bg-emerald-500' : 'bg-white/20'
          )}
        >
          <span className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
            billingPeriod === 'yearly' ? 'left-8' : 'left-1'
          )} />
        </button>
        <span className={cn('text-sm', billingPeriod === 'yearly' ? 'text-white' : 'text-white/40')}>
          Yearly <GlassBadge variant="success">Save 17%</GlassBadge>
        </span>
      </div>

      {/* Plan Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-6 transition-all duration-300',
                isCurrent
                  ? 'border-emerald-400/50 bg-emerald-500/10 ring-1 ring-emerald-400/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-1'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-4 flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', plan.bgColor)}>
                  <Icon className={cn('h-5 w-5', plan.color)} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {billingPeriod === 'yearly' && plan.price !== '$0' ? yearlyDiscount(plan.price) : plan.price}
                </span>
                <span className="text-sm text-white/40">
                  {billingPeriod === 'yearly' && plan.price !== '$0' ? '/year' : plan.period}
                </span>
              </div>

              <p className="mb-6 text-sm text-white/50">{plan.description}</p>

              <ul className="mb-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full rounded-xl',
                  isCurrent
                    ? 'bg-white/10 text-white/50 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Billing History */}
      <div>
        <button
          onClick={() => setShowBillingHistory(!showBillingHistory)}
          className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          {showBillingHistory ? 'Hide' : 'Show'} Billing History
          <ArrowRight className={cn('h-4 w-4 transition-transform', showBillingHistory && 'rotate-90')} />
        </button>

        {showBillingHistory && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-white/70">{item.date}</td>
                    <td className="px-4 py-3 text-sm text-white">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-white/50">{item.method}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{item.amount}</td>
                    <td className="px-4 py-3 text-right">
                      <GlassBadge variant="success">Paid</GlassBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
