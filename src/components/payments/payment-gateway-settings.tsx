'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface StripeConfig {
  publicKey: string
  secretKey: string
  webhookSecret: string
}

interface PesapalConfig {
  consumerKey: string
  consumerSecret: string
  apiKey: string
  isLive: boolean
}

interface PayPalConfig {
  clientId: string
  clientSecret: string
  isLive: boolean
}

type GatewayType = 'stripe' | 'pesapal' | 'paypal'

interface GatewayInfo {
  type: GatewayType
  name: string
  icon: React.ReactNode
  desc: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJsonConfig(json: string | null | undefined): Record<string, unknown> {
  try {
    return json ? JSON.parse(json) : {}
  } catch {
    return {}
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PaymentGatewaySettings({ hotelId }: { hotelId: string }) {
  const { hotel, fetchHotel } = useAppStore()
  const [activeGateway, setActiveGateway] = useState<GatewayType>(
    (hotel?.paymentGateway as GatewayType) || 'stripe'
  )
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  // Parse existing configs from hotel data
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>(
    parseJsonConfig(hotel?.stripeConfig as string | null) as StripeConfig
  )
  const [pesapalConfig, setPesapalConfig] = useState<PesapalConfig>(
    parseJsonConfig(hotel?.pesapalConfig as string | null) as PesapalConfig
  )
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig>(
    parseJsonConfig(hotel?.paypalConfig as string | null) as PayPalConfig
  )

  // Sync when hotel data changes
  useEffect(() => {
    if (hotel) {
      setStripeConfig(parseJsonConfig(hotel.stripeConfig as string | null) as StripeConfig)
      setPesapalConfig(parseJsonConfig(hotel.pesapalConfig as string | null) as PesapalConfig)
      setPaypalConfig(parseJsonConfig(hotel.paypalConfig as string | null) as PayPalConfig)
      if (hotel.paymentGateway) {
        setActiveGateway(hotel.paymentGateway as GatewayType)
      }
    }
  }, [hotel])

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/hotel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          paymentGateway: activeGateway,
          stripeConfig: JSON.stringify(stripeConfig),
          pesapalConfig: JSON.stringify(pesapalConfig),
          paypalConfig: JSON.stringify(paypalConfig),
        }),
      })
      if (response.ok) {
        const json = await response.json()
        if (json.success) {
          toast.success(
            `${activeGateway.charAt(0).toUpperCase() + activeGateway.slice(1)} settings saved successfully`
          )
          await fetchHotel()
        } else {
          toast.error(json.error || 'Failed to save settings')
        }
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isConfigured = (type: GatewayType) => {
    if (type === 'stripe') return !!(stripeConfig?.publicKey && stripeConfig?.secretKey)
    if (type === 'pesapal') return !!(pesapalConfig?.consumerKey && pesapalConfig?.consumerSecret)
    if (type === 'paypal') return !!(paypalConfig?.clientId && paypalConfig?.clientSecret)
    return false
  }

  const gateways: GatewayInfo[] = [
    {
      type: 'stripe',
      name: 'Stripe',
      icon: <CreditCard className="h-5 w-5" />,
      desc: 'Accept credit/debit cards, Apple Pay, Google Pay',
    },
    {
      type: 'pesapal',
      name: 'Pesapal',
      icon: <span className="text-lg font-bold">P</span>,
      desc: 'Mobile money, bank transfers in East Africa',
    },
    {
      type: 'paypal',
      name: 'PayPal',
      icon: <span className="text-lg font-bold text-blue-600">PP</span>,
      desc: 'International payments, PayPal balance',
    },
  ]

  const activeGw = gateways.find((g) => g.type === activeGateway) ?? gateways[0]

  return (
    <div className="space-y-6 max-w-2xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Configure your payment gateway to accept online payments from guests. Your API keys are
          encrypted and stored securely. Only one gateway can be active at a time.
        </AlertDescription>
      </Alert>

      {/* Gateway Selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        {gateways.map((gw) => (
          <button
            key={gw.type}
            onClick={() => setActiveGateway(gw.type)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              activeGateway === gw.type
                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30'
                : 'border-border bg-card hover:bg-accent/50'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                activeGateway === gw.type
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {gw.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{gw.name}</p>
                {isConfigured(gw.type) && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{gw.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active gateway indicator */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <p className="text-sm text-muted-foreground">
          Active gateway:{' '}
          <span className="font-medium text-foreground">{activeGw.name}</span>
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              {activeGw.icon}
            </div>
            <div>
              <CardTitle className="text-base">{activeGw.name} Configuration</CardTitle>
              <CardDescription>{activeGw.desc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stripe Form */}
          {activeGateway === 'stripe' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-pk">Publishable Key</Label>
                <Input
                  id="stripe-pk"
                  placeholder="pk_live_..."
                  value={stripeConfig?.publicKey || ''}
                  onChange={(e) =>
                    setStripeConfig((prev) => ({ ...prev, publicKey: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Found in your Stripe Dashboard &rarr; Developers &rarr; API Keys
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-sk">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="stripe-sk"
                    className="pr-10"
                    type={showSecrets['stripe_secret'] ? 'text' : 'password'}
                    placeholder="sk_live_..."
                    value={stripeConfig?.secretKey || ''}
                    onChange={(e) =>
                      setStripeConfig((prev) => ({ ...prev, secretKey: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSecret('stripe_secret')}
                  >
                    {showSecrets['stripe_secret'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-wh">Webhook Secret</Label>
                <div className="relative">
                  <Input
                    id="stripe-wh"
                    className="pr-10"
                    type={showSecrets['stripe_webhook'] ? 'text' : 'password'}
                    placeholder="whsec_..."
                    value={stripeConfig?.webhookSecret || ''}
                    onChange={(e) =>
                      setStripeConfig((prev) => ({ ...prev, webhookSecret: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSecret('stripe_webhook')}
                  >
                    {showSecrets['stripe_webhook'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used to verify webhook events from Stripe
                </p>
              </div>
            </div>
          )}

          {/* Pesapal Form */}
          {activeGateway === 'pesapal' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pesapal-ck">Consumer Key</Label>
                <Input
                  id="pesapal-ck"
                  placeholder="Your Pesapal consumer key"
                  value={pesapalConfig?.consumerKey || ''}
                  onChange={(e) =>
                    setPesapalConfig((prev) => ({ ...prev, consumerKey: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesapal-cs">Consumer Secret</Label>
                <div className="relative">
                  <Input
                    id="pesapal-cs"
                    className="pr-10"
                    type={showSecrets['pesapal_secret'] ? 'text' : 'password'}
                    placeholder="Your Pesapal consumer secret"
                    value={pesapalConfig?.consumerSecret || ''}
                    onChange={(e) =>
                      setPesapalConfig((prev) => ({ ...prev, consumerSecret: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSecret('pesapal_secret')}
                  >
                    {showSecrets['pesapal_secret'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesapal-ak">API Key</Label>
                <Input
                  id="pesapal-ak"
                  placeholder="Your Pesapal API key"
                  value={pesapalConfig?.apiKey || ''}
                  onChange={(e) =>
                    setPesapalConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="pesapal-live" className="cursor-pointer">
                    Enable Live Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Uncheck to use Pesapal sandbox for testing
                  </p>
                </div>
                <Switch
                  id="pesapal-live"
                  checked={pesapalConfig?.isLive || false}
                  onCheckedChange={(checked) =>
                    setPesapalConfig((prev) => ({ ...prev, isLive: checked }))
                  }
                />
              </div>
            </div>
          )}

          {/* PayPal Form */}
          {activeGateway === 'paypal' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paypal-cid">Client ID</Label>
                <Input
                  id="paypal-cid"
                  placeholder="Your PayPal Client ID"
                  value={paypalConfig?.clientId || ''}
                  onChange={(e) =>
                    setPaypalConfig((prev) => ({ ...prev, clientId: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypal-cs">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="paypal-cs"
                    className="pr-10"
                    type={showSecrets['paypal_secret'] ? 'text' : 'password'}
                    placeholder="Your PayPal Client Secret"
                    value={paypalConfig?.clientSecret || ''}
                    onChange={(e) =>
                      setPaypalConfig((prev) => ({ ...prev, clientSecret: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSecret('paypal_secret')}
                  >
                    {showSecrets['paypal_secret'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="paypal-live" className="cursor-pointer">
                    Enable Live Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Uncheck to use PayPal sandbox for testing
                  </p>
                </div>
                <Switch
                  id="paypal-live"
                  checked={paypalConfig?.isLive || false}
                  onCheckedChange={(checked) =>
                    setPaypalConfig((prev) => ({ ...prev, isLive: checked }))
                  }
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <Separator className="my-6" />
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => toast.info('Test connection coming soon!')}>
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
