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
import { api, type HotelUserItem } from '@/lib/api'
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
  starter: {
    name: 'Starter',
    price: '$49',
    priceNum: 49,
    description: 'For small properties ready to grow',
    features: [
      'Up to 25 rooms',
      'Unlimited bookings',
      '5 channel connections',
      'Two-way iCal sync',
      'Email notifications',
      'Housekeeping management',
      'Staff accounts (up to 3)',
      'Priority support',
    ],
    cta: 'Upgrade',
  },
  pro: {
    name: 'Professional',
    price: '$99',
    priceNum: 99,
    description: 'For growing properties that need the full suite',
    features: [
      'Unlimited rooms',
      'Unlimited bookings',
      'Unlimited channels',
      'Full reports & analytics',
      'Dynamic pricing',
      'AI concierge',
      'Guest portal & self check-in',
      'Loyalty program',
      'API access',
      'Unlimited staff',
      '24/7 support',
    ],
    cta: 'Current Plan',
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
      const res = await api.getCancellationPolicies(hotelId)
      if (res.success) setPolicies(res.data as CancellationPolicy[])
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
      const res = editingPolicy
        ? await api.updateCancellationPolicy(editingPolicy.id, hotelId, form)
        : await api.createCancellationPolicy(hotelId, form)
      if (res.success) {
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
        toast.error(res.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await api.deleteCancellationPolicy(id, hotelId)
      if (res.success) {
        toast.success('Policy deleted')
        fetchPolicies()
      } else {
        toast.error(res.error || 'Failed to delete')
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

// ─── Staff Manager Sub-component ─────────────────────────────────────────

function StaffManager({ hotelId }: { hotelId: string }) {
  const [staffList, setStaffList] = useState<HotelUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  })

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.getHotelUsers(hotelId)
      if (res.success) setStaffList(res.data)
    } catch {
      toast.error('Failed to fetch staff')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleAdd = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      const res = await api.addHotelUser(hotelId, {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        role: form.role as 'manager' | 'staff' | 'housekeeping',
      })
      if (res.success) {
        let msg = `${form.name} added as ${form.role}!`
        if (res.data.defaultPassword) {
          msg += ` Default password: ${res.data.defaultPassword}`
        }
        toast.success(msg, { duration: 6000 })
        setShowDialog(false)
        setForm({ name: '', email: '', password: '', role: 'staff' })
        fetchStaff()
      } else {
        toast.error(res.error || 'Failed to add staff')
      }
    } catch {
      toast.error('Failed to add staff')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.updateHotelUserRole(hotelId, userId, { role: newRole })
      if (res.success) {
        toast.success('Role updated')
        fetchStaff()
      } else {
        toast.error(res.error || 'Failed to update role')
      }
    } catch {
      toast.error('Failed to update role')
    }
  }

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this hotel?`)) return
    try {
      const res = await api.removeHotelUser(hotelId, userId)
      if (res.success) {
        toast.success(`${name} removed`)
        fetchStaff()
      } else {
        toast.error(res.error || 'Failed to remove')
      }
    } catch {
      toast.error('Failed to remove staff')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-600 text-white'
      case 'manager': return 'bg-blue-600 text-white'
      case 'staff': return 'bg-emerald-600 text-white'
      case 'housekeeping': return 'bg-amber-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Team Members ({staffList.length})</h3>
          <p className="text-xs text-muted-foreground">Manage who has access to your hotel</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          size="sm"
          onClick={() => {
            setForm({ name: '', email: '', password: '', role: 'staff' })
            setShowDialog(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Staff
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No team members yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add staff members to help manage your property</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_1fr_100px_80px] items-center gap-4 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {staffList.map((member) => (
            <div key={member.id} className="grid grid-cols-[1fr_1fr_100px_80px] items-center gap-4 border-b px-4 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div>
                {member.role === 'owner' ? (
                  <Badge className={cn('text-[10px]', getRoleBadgeColor(member.role))}>
                    <Crown className="mr-1 h-3 w-3" /> Owner
                  </Badge>
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.userId, v)}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Front Desk</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                {member.isActive ? (
                  <Badge variant="secondary" className="text-[10px] text-emerald-600">
                    <Check className="mr-1 h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] text-gray-500">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex justify-end">
                {member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(member.userId, member.user.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new team member to manage your hotel. They will receive a default password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="jane@hotel.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password (optional)</Label>
              <Input
                type="password"
                placeholder="Leave blank for default: changeme123"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">If left blank, a default password will be assigned</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white text-[10px]">Manager</Badge>
                      <span className="text-xs text-muted-foreground">Full operations access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-[10px]">Staff</Badge>
                      <span className="text-xs text-muted-foreground">Bookings, guests, check-in</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="housekeeping">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600 text-white text-[10px]">Housekeeping</Badge>
                      <span className="text-xs text-muted-foreground">Room tasks only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAdd}
              disabled={saving || !form.name || !form.email}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
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
          <StaffManager hotelId={currentHotelId} />
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
                  currentPlan === 'pro' && 'border-emerald-200 bg-emerald-50/50',
                  currentPlan === 'starter' && 'border-blue-200 bg-blue-50/50',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Crown
                        className={cn(
                          'h-4 w-4',
                          currentPlan === 'pro'
                            ? 'text-emerald-600'
                            : currentPlan === 'starter'
                              ? 'text-blue-600'
                              : 'text-gray-600',
                        )}
                      />
                      {PLAN_TIERS[currentPlan].name} Plan
                    </CardTitle>
                    <Badge
                      className={cn(
                        currentPlan === 'pro'
                          ? 'bg-emerald-600'
                          : currentPlan === 'starter'
                            ? 'bg-blue-600'
                            : 'bg-gray-600',
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
