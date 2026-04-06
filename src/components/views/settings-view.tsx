'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Hotel,
  Phone,
  Mail,
  Clock,
  Globe,
  Users,
  Save,
  Plus,
  Crown,
  Check,
  Star,
  ShieldAlert,
  Trash2,
  Edit3,
  Loader2,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Timezone Options ────────────────────────────────────────────────────────

const TIMEZONES = [
  'UTC',
  'Africa/Dar_es_Salaam',
  'Africa/Nairobi',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

// ─── Plan Tiers ──────────────────────────────────────────────────────────────

const PLAN_TIERS = {
  free: {
    name: 'Free',
    price: 'Free',
    priceNum: 0,
    description: 'Get started with essential hotel management',
    features: [
      'Up to 10 rooms',
      'Unlimited bookings',
      '2 channel connections',
      'iCal sync',
      'Guest management',
      'Basic reports',
      'Email support',
    ],
    cta: 'Current Plan',
  },
  professional: {
    name: 'Professional',
    price: '$79',
    priceNum: 79,
    description: 'For growing properties that need more',
    features: [
      'Unlimited rooms',
      'Unlimited bookings',
      '10 channel connections',
      'Two-way sync',
      'Full reports & analytics',
      'Staff management',
      'API access',
      'Priority support',
    ],
    cta: 'Upgrade',
  },
  enterprise: {
    name: 'Enterprise',
    price: '$199',
    priceNum: 199,
    description: 'For hotel groups and chains',
    features: [
      'Everything in Professional',
      'Multi-property support',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'SLA guarantee',
      'Training & onboarding',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
  },
} as const

type PlanKey = keyof typeof PLAN_TIERS

// ─── Cancellation Policy Manager Sub-component ─────────────────────────────

interface CancellationPolicy {
  id: string
  name: string
  description: string | null
  rules: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

function CancellationPolicyManager({ hotelId }: { hotelId: string }) {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<CancellationPolicy | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    rules: [{ hoursBefore: 48, chargePercent: 0 }, { hoursBefore: 0, chargePercent: 100 }],
  })

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch(`/api/cancellation-policies?hotelId=${hotelId}`)
      const json = await res.json()
      if (json.success) setPolicies(json.data)
    } catch {
      toast.error('Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => { fetchPolicies() }, [fetchPolicies])

  const handleSave = async () => {
    if (!form.name || form.rules.length === 0) return
    setSaving(true)
    try {
      const url = editingPolicy
        ? `/api/cancellation-policies/${editingPolicy.id}?hotelId=${hotelId}`
        : `/api/cancellation-policies?hotelId=${hotelId}`
      const res = await fetch(url, {
        method: editingPolicy ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingPolicy ? 'Policy updated' : 'Policy created')
        setShowDialog(false)
        setEditingPolicy(null)
        setForm({
          name: '',
          description: '',
          isDefault: false,
          rules: [{ hoursBefore: 48, chargePercent: 0 }, { hoursBefore: 0, chargePercent: 100 }],
        })
        fetchPolicies()
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cancellation-policies/${id}?hotelId=${hotelId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Policy deleted')
        fetchPolicies()
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete policy')
    }
  }

  const handleEdit = (policy: CancellationPolicy) => {
    let parsedRules: { hoursBefore: number; chargePercent: number }[] = []
    try { parsedRules = JSON.parse(policy.rules) } catch { /* use defaults */ }
    setEditingPolicy(policy)
    setForm({
      name: policy.name,
      description: policy.description || '',
      isDefault: policy.isDefault,
      rules: parsedRules.length > 0 ? parsedRules : [{ hoursBefore: 48, chargePercent: 0 }, { hoursBefore: 0, chargePercent: 100 }],
    })
    setShowDialog(true)
  }

  const addRule = () => {
    setForm({ ...form, rules: [...form.rules, { hoursBefore: 24, chargePercent: 50 }] })
  }

  const removeRule = (index: number) => {
    if (form.rules.length <= 1) return
    setForm({ ...form, rules: form.rules.filter((_, i) => i !== index) })
  }

  const updateRule = (index: number, field: 'hoursBefore' | 'chargePercent', value: number) => {
    const newRules = [...form.rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setForm({ ...form, rules: newRules })
  }

  const parseRules = (rulesStr: string): { hoursBefore: number; chargePercent: number }[] => {
    try { return JSON.parse(rulesStr) } catch { return [] }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Cancellation policies define the fees charged when a booking is cancelled. The default policy
          is automatically applied when calculating cancellation fees.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Policies ({policies.length})</h3>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            setEditingPolicy(null)
            setForm({
              name: '',
              description: '',
              isDefault: false,
              rules: [{ hoursBefore: 48, chargePercent: 0 }, { hoursBefore: 0, chargePercent: 100 }],
            })
            setShowDialog(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Policy
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No cancellation policies</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a policy to manage cancellation fees</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => {
            const rules = parseRules(policy.rules)
            return (
              <Card key={policy.id} className={cn(!policy.isActive && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{policy.name}</h4>
                      {policy.isDefault && (
                        <Badge className="bg-emerald-600 text-white text-[10px]">Default</Badge>
                      )}
                      {!policy.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(policy)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      {!policy.isDefault && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(policy.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {policy.description && (
                    <p className="mb-2 text-xs text-muted-foreground">{policy.description}</p>
                  )}
                  <div className="space-y-1">
                    {rules.map((rule, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                        <span>
                          {rule.hoursBefore > 0
                            ? `${rule.hoursBefore}h+ before check-in`
                            : 'Less than any threshold'}
                        </span>
                        <span className={rule.chargePercent > 0 ? 'font-medium text-destructive' : 'text-emerald-600'}>
                          {rule.chargePercent === 0 ? 'Free' : `${rule.chargePercent}% charge`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingPolicy(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit' : 'Create'} Cancellation Policy</DialogTitle>
            <DialogDescription>Define cancellation fee rules for your bookings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input
                placeholder="e.g., Standard Flexible, Non-Refundable"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Brief description of this policy"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addRule}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Rule
                </Button>
              </div>
              <div className="space-y-2">
                {form.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Hours before</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8"
                        value={rule.hoursBefore}
                        onChange={(e) => updateRule(i, 'hoursBefore', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Charge %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="h-8"
                        value={rule.chargePercent}
                        onChange={(e) => updateRule(i, 'chargePercent', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-3 h-8 w-8 text-destructive"
                      onClick={() => removeRule(i)}
                      disabled={form.rules.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Rules are evaluated top-down. The first matching rule is applied.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-sm">Set as default policy</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingPolicy(null) }}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving || !form.name}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPolicy ? 'Update' : 'Create'} Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsView() {
  const { hotel, fetchHotel, currentHotelId, loading } = useAppStore()
  const [saving, setSaving] = useState(false)

  const [hotelSettings, setHotelSettings] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    checkInTime: '',
    checkOutTime: '',
    currency: '',
    timezone: '',
  })

  // Fetch hotel if not loaded
  useEffect(() => {
    if (currentHotelId && !hotel) {
      fetchHotel()
    }
  }, [currentHotelId, hotel, fetchHotel])

  // Sync hotel data to form
  useEffect(() => {
    if (hotel) {
      setHotelSettings({
        name: hotel.name || '',
        description: hotel.description || '',
        address: hotel.address || '',
        city: hotel.city || '',
        country: hotel.country || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.website || '',
        checkInTime: hotel.checkInTime || '',
        checkOutTime: hotel.checkOutTime || '',
        currency: hotel.currency || 'USD',
        timezone: hotel.timezone || 'UTC',
      })
    }
  }, [hotel])

  const handleSave = async () => {
    if (!currentHotelId) return
    setSaving(true)
    try {
      const response = await api.updateHotel(currentHotelId, hotelSettings)
      if (response.success) {
        toast.success('Settings saved successfully')
        await fetchHotel()
      } else {
        toast.error(response.error || 'Failed to save settings')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Staff dialog state
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Front Desk',
  })

  const isLoadingHotel = loading.hotel && !hotel

  if (!currentHotelId) return null

  const currentPlan = (hotel?.plan || 'free') as PlanKey

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Hotel Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your hotel details and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="cancellation">Cancellation</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        {/* ─── General Settings ────────────────────────────────────────── */}
        <TabsContent value="general">
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoadingHotel ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-64 w-full rounded" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-64 w-full rounded" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Hotel className="h-4 w-4" />
                      Hotel Details
                    </CardTitle>
                    <CardDescription>Basic information about your property</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hotel Name</Label>
                      <Input
                        value={hotelSettings.name}
                        onChange={(e) =>
                          setHotelSettings({ ...hotelSettings, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        value={hotelSettings.description}
                        onChange={(e) =>
                          setHotelSettings({ ...hotelSettings, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={hotelSettings.address}
                        onChange={(e) =>
                          setHotelSettings({ ...hotelSettings, address: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={hotelSettings.city}
                          onChange={(e) =>
                            setHotelSettings({ ...hotelSettings, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={hotelSettings.country}
                          onChange={(e) =>
                            setHotelSettings({ ...hotelSettings, country: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4" />
                      Contact & Locale
                    </CardTitle>
                    <CardDescription>
                      How guests and partners can reach you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={hotelSettings.phone}
                          onChange={(e) =>
                            setHotelSettings({ ...hotelSettings, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          type="email"
                          value={hotelSettings.email}
                          onChange={(e) =>
                            setHotelSettings({ ...hotelSettings, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={hotelSettings.website}
                          placeholder="https://example.com"
                          onChange={(e) =>
                            setHotelSettings({ ...hotelSettings, website: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={hotelSettings.currency}
                          onValueChange={(v) =>
                            setHotelSettings({ ...hotelSettings, currency: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={hotelSettings.timezone}
                          onValueChange={(v) =>
                            setHotelSettings({ ...hotelSettings, timezone: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* ─── Policies ─────────────────────────────────────────────────── */}
        <TabsContent value="policies">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Check-in & Check-out Policies
              </CardTitle>
              <CardDescription>Set default times and rules for your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingHotel ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Check-in Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          className="pl-9"
                          value={hotelSettings.checkInTime}
                          onChange={(e) =>
                            setHotelSettings({
                              ...hotelSettings,
                              checkInTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Check-out Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          className="pl-9"
                          value={hotelSettings.checkOutTime}
                          onChange={(e) =>
                            setHotelSettings({
                              ...hotelSettings,
                              checkOutTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Additional Policies</h4>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Early Check-in Available</p>
                        <p className="text-xs text-muted-foreground">
                          Allow guests to check in before the standard time
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Late Check-out Available</p>
                        <p className="text-xs text-muted-foreground">
                          Allow guests to check out after the standard time
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Auto-confirm Bookings</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically confirm new bookings from OTAs
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Require ID Verification</p>
                        <p className="text-xs text-muted-foreground">
                          Require government ID at check-in
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Policies
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Cancellation Policies ──────────────────────────────────── */}
        <TabsContent value="cancellation">
          <CancellationPolicyManager hotelId={currentHotelId} />
        </TabsContent>

        {/* ─── Staff Management ────────────────────────────────────────── */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Staff Management
                  </CardTitle>
                  <CardDescription>Manage team members and their access</CardDescription>
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                  onClick={() => setShowAddStaffDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingHotel ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : hotel?._count && hotel._count.users > 0 ? (
                  <div className="rounded-lg border">
                    <div className="grid grid-cols-[1fr_1fr_100px] items-center gap-4 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                      <span>Member</span>
                      <span>Role</span>
                      <span className="text-right">Status</span>
                    </div>
                    {/* Placeholder rows for existing team members count */}
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p>
                        {hotel._count.users} active team member
                        {hotel._count.users !== 1 ? 's' : ''}
                      </p>
                      <p className="mt-1 text-xs">
                        Detailed staff list will appear here as members are added.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed py-12 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No team members yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add staff members to help manage your property
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      size="sm"
                      onClick={() => setShowAddStaffDialog(true)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add First Member
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Staff Dialog */}
          <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  Invite a new team member to manage your hotel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jane@hotel.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Desk">Front Desk</SelectItem>
                      <SelectItem value="Housekeeping Lead">Housekeeping Lead</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddStaffDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setShowAddStaffDialog(false)
                    setNewStaff({ name: '', email: '', role: 'Front Desk' })
                    toast.success('Staff invitation sent')
                  }}
                  disabled={!newStaff.name || !newStaff.email}
                >
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── Plan ─────────────────────────────────────────────────────── */}
        <TabsContent value="plan">
          {isLoadingHotel ? (
            <div className="max-w-4xl space-y-4">
              <Skeleton className="h-64 w-full rounded" />
              <Skeleton className="h-48 w-full rounded" />
            </div>
          ) : (
            <div className="max-w-4xl space-y-6">
              {/* Current Plan */}
              <Card
                className={cn(
                  currentPlan === 'professional' && 'border-emerald-200 bg-emerald-50/50',
                  currentPlan === 'enterprise' && 'border-purple-200 bg-purple-50/50',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Crown
                        className={cn(
                          'h-4 w-4',
                          currentPlan === 'enterprise'
                            ? 'text-purple-600'
                            : 'text-emerald-600',
                        )}
                      />
                      {PLAN_TIERS[currentPlan].name} Plan
                    </CardTitle>
                    <Badge
                      className={cn(
                        currentPlan === 'enterprise'
                          ? 'bg-purple-600'
                          : 'bg-emerald-600',
                        'text-white',
                      )}
                    >
                      Current Plan
                    </Badge>
                  </div>
                  <CardDescription>{PLAN_TIERS[currentPlan].description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{PLAN_TIERS[currentPlan].price}</span>
                    {PLAN_TIERS[currentPlan].priceNum > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {PLAN_TIERS[currentPlan].features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  {currentPlan !== 'free' && (
                    <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
                      Manage Subscription
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Other Plans */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Other Plans</CardTitle>
                  <CardDescription>Upgrade to unlock more features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(PLAN_TIERS)
                      .filter(([key]) => key !== currentPlan)
                      .map(([key, tier]) => (
                        <div
                          key={key}
                          className={cn(
                            'rounded-lg border p-5 transition-shadow hover:shadow-md',
                            key === 'enterprise' && 'border-purple-200',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{tier.name}</h4>
                            {key === 'enterprise' && (
                              <Star className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold">{tier.price}</span>
                            {tier.priceNum > 0 && (
                              <span className="text-muted-foreground">/month</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tier.description}
                          </p>
                          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                            {tier.features.slice(0, 5).map((f) => (
                              <li key={f} className="flex items-center gap-1.5">
                                <Check className="h-3 w-3 text-emerald-500" />
                                {f}
                              </li>
                            ))}
                            {tier.features.length > 5 && (
                              <li className="text-xs">+{tier.features.length - 5} more</li>
                            )}
                          </ul>
                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            size="sm"
                            onClick={() => {
                              if (key === 'enterprise') {
                                toast.info('Enterprise sales contact coming soon!')
                              } else {
                                toast.info('Upgrade flow coming soon!')
                              }
                            }}
                          >
                            {tier.cta}
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
