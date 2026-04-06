'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Percent,
  CalendarDays,
  Users,
  Zap,
  Tag,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateRule {
  id: string
  name: string
  ruleType: string
  adjustmentType: string
  adjustmentValue: number
  roomTypeId: string | null
  channelId: string | null
  validFrom: string | null
  validTo: string | null
  daysOfWeek: string | null
  minOccupancy: number | null
  maxOccupancy: number | null
  priority: number
  isActive: boolean
}

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minStay: number | null
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validTo: string | null
  appliesTo: string | null
  isActive: boolean
  createdAt: string
}

interface PriceCalcResult {
  roomId: string
  date: string
  basePrice: number
  finalPrice: number
  appliedRules: Array<{
    id: string
    name: string
    ruleType: string
    adjustmentType: string
    adjustmentValue: number
    priceBefore: number
    priceAfter: number
  }>
  currentOccupancyPercent: number
}

const RULE_TYPES = [
  { value: 'seasonal', label: 'Seasonal', icon: CalendarDays },
  { value: 'day_of_week', label: 'Day of Week', icon: CalendarDays },
  { value: 'occupancy_based', label: 'Occupancy Based', icon: Users },
  { value: 'last_minute', label: 'Last Minute', icon: Zap },
  { value: 'early_bird', label: 'Early Bird', icon: Tag },
  { value: 'event', label: 'Event', icon: CalendarDays },
]

const RULE_TYPE_COLORS: Record<string, string> = {
  seasonal: 'bg-amber-100 text-amber-700',
  day_of_week: 'bg-blue-100 text-blue-700',
  occupancy_based: 'bg-purple-100 text-purple-700',
  last_minute: 'bg-red-100 text-red-700',
  early_bird: 'bg-emerald-100 text-emerald-700',
  event: 'bg-pink-100 text-pink-700',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueView() {
  const { currentHotelId, hotel, rooms } = useAppStore()
  const [rules, setRules] = useState<RateRule[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  // Rule dialog
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RateRule | null>(null)
  const [ruleForm, setRuleForm] = useState({
    name: '',
    ruleType: 'seasonal',
    adjustmentType: 'percentage',
    adjustmentValue: '',
    validFrom: '',
    validTo: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    minOccupancy: '',
    maxOccupancy: '',
    priority: '0',
    isActive: true,
  })

  // Coupon dialog
  const [showCouponDialog, setShowCouponDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minStay: '',
    maxUses: '',
    validFrom: '',
    validTo: '',
    isActive: true,
  })

  // Price calculator
  const [calcRoomId, setCalcRoomId] = useState('')
  const [calcDate, setCalcDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [calcResult, setCalcResult] = useState<PriceCalcResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)

  // Coupon validator
  const [validateCode, setValidateCode] = useState('')
  const [validateResult, setValidateResult] = useState<{
    valid: boolean
    reason?: string
    code?: string
    type?: string
    value?: number
    remainingUses?: number | null
  } | null>(null)

  const fetchRules = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/revenue/rules?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setRules(json.data)
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    }
  }, [currentHotelId])

  const fetchCoupons = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/coupons?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setCoupons(json.data)
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
    }
  }, [currentHotelId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchRules(), fetchCoupons()])
      setLoading(false)
    }
    load()
  }, [fetchRules, fetchCoupons])

  // ─── Rule Handlers ───────────────────────────────────────────────────────

  const openNewRule = () => {
    setEditingRule(null)
    setRuleForm({
      name: '',
      ruleType: 'seasonal',
      adjustmentType: 'percentage',
      adjustmentValue: '',
      validFrom: '',
      validTo: '',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      minOccupancy: '',
      maxOccupancy: '',
      priority: '0',
      isActive: true,
    })
    setShowRuleDialog(true)
  }

  const openEditRule = (rule: RateRule) => {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      ruleType: rule.ruleType,
      adjustmentType: rule.adjustmentType,
      adjustmentValue: String(rule.adjustmentValue),
      validFrom: rule.validFrom ? format(new Date(rule.validFrom), 'yyyy-MM-dd') : '',
      validTo: rule.validTo ? format(new Date(rule.validTo), 'yyyy-MM-dd') : '',
      daysOfWeek: rule.daysOfWeek ? JSON.parse(rule.daysOfWeek) : [0, 1, 2, 3, 4, 5, 6],
      minOccupancy: rule.minOccupancy !== null ? String(rule.minOccupancy) : '',
      maxOccupancy: rule.maxOccupancy !== null ? String(rule.maxOccupancy) : '',
      priority: String(rule.priority),
      isActive: rule.isActive,
    })
    setShowRuleDialog(true)
  }

  const saveRule = async () => {
    if (!currentHotelId || !ruleForm.name || !ruleForm.adjustmentValue) return

    const url = editingRule
      ? `/api/revenue/rules/${editingRule.id}?hotelId=${currentHotelId}`
      : `/api/revenue/rules?hotelId=${currentHotelId}`
    const method = editingRule ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingRule ? 'Rule updated' : 'Rule created')
        setShowRuleDialog(false)
        await fetchRules()
      } else {
        toast.error(json.error || 'Failed to save rule')
      }
    } catch {
      toast.error('Failed to save rule')
    }
  }

  const deleteRule = async (id: string) => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/revenue/rules/${id}?hotelId=${currentHotelId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Rule deleted')
        await fetchRules()
      }
    } catch {
      toast.error('Failed to delete rule')
    }
  }

  // ─── Coupon Handlers ─────────────────────────────────────────────────────

  const openNewCoupon = () => {
    setEditingCoupon(null)
    setCouponForm({ code: '', type: 'percentage', value: '', minStay: '', maxUses: '', validFrom: '', validTo: '', isActive: true })
    setShowCouponDialog(true)
  }

  const openEditCoupon = (c: Coupon) => {
    setEditingCoupon(c)
    setCouponForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minStay: c.minStay !== null ? String(c.minStay) : '',
      maxUses: c.maxUses !== null ? String(c.maxUses) : '',
      validFrom: c.validFrom ? format(new Date(c.validFrom), 'yyyy-MM-dd') : '',
      validTo: c.validTo ? format(new Date(c.validTo), 'yyyy-MM-dd') : '',
      isActive: c.isActive,
    })
    setShowCouponDialog(true)
  }

  const saveCoupon = async () => {
    if (!currentHotelId || !couponForm.code || !couponForm.value) return

    const url = editingCoupon
      ? `/api/coupons/${editingCoupon.id}?hotelId=${currentHotelId}`
      : `/api/coupons?hotelId=${currentHotelId}`
    const method = editingCoupon ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created')
        setShowCouponDialog(false)
        await fetchCoupons()
      } else {
        toast.error(json.error || 'Failed to save coupon')
      }
    } catch {
      toast.error('Failed to save coupon')
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/coupons/${id}?hotelId=${currentHotelId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Coupon deleted')
        await fetchCoupons()
      }
    } catch {
      toast.error('Failed to delete coupon')
    }
  }

  const validateCoupon = async () => {
    if (!currentHotelId || !validateCode) return
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: currentHotelId, code: validateCode }),
      })
      const json = await res.json()
      if (json.success) setValidateResult(json.data)
    } catch {
      toast.error('Failed to validate coupon')
    }
  }

  // ─── Price Calculator ────────────────────────────────────────────────────

  const calculatePrice = async () => {
    if (!currentHotelId || !calcRoomId || !calcDate) return
    setCalcLoading(true)
    try {
      const res = await fetch(`/api/revenue/calculate?hotelId=${currentHotelId}&roomId=${calcRoomId}&date=${calcDate}`)
      const json = await res.json()
      if (json.success) setCalcResult(json.data)
      else toast.error(json.error || 'Failed to calculate price')
    } catch {
      toast.error('Failed to calculate price')
    } finally {
      setCalcLoading(false)
    }
  }

  const toggleDayOfWeek = (day: number) => {
    setRuleForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }))
  }

  if (!currentHotelId) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Revenue Management</h2>
          <p className="text-sm text-muted-foreground">
            Dynamic pricing rules, coupons & price calculator
          </p>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Rate Rules</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="calculator">Price Calculator</TabsTrigger>
        </TabsList>

        {/* ─── Rate Rules ─────────────────────────────────────────── */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Dynamic Rate Rules</CardTitle>
                <CardDescription>Automated price adjustments based on conditions</CardDescription>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={openNewRule}>
                <Plus className="mr-1 h-4 w-4" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : rules.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No rate rules configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create rules to automate your pricing strategy
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        'flex items-center gap-4 rounded-lg border p-4 transition-colors',
                        !rule.isActive && 'opacity-60',
                      )}
                    >
                      <div className={cn('rounded-lg p-2', RULE_TYPE_COLORS[rule.ruleType] || 'bg-gray-100')}>
                        {(() => {
                          const rt = RULE_TYPES.find((r) => r.value === rule.ruleType)
                          const Icon = rt?.icon || DollarSign
                          return <Icon className="h-4 w-4" />
                        })()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{rule.name}</span>
                          <Badge variant="outline" className={cn('text-[10px]', RULE_TYPE_COLORS[rule.ruleType])}>
                            {rule.ruleType.replace('_', ' ')}
                          </Badge>
                          {!rule.isActive && (
                            <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500">Inactive</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {rule.adjustmentValue > 0 ? '+' : ''}
                            {rule.adjustmentValue}
                            {rule.adjustmentType === 'percentage' ? '%' : ' fixed'}
                          </span>
                          {rule.validFrom && (
                            <span>From {format(new Date(rule.validFrom), 'MMM d')}</span>
                          )}
                          {rule.validTo && (
                            <span>To {format(new Date(rule.validTo), 'MMM d')}</span>
                          )}
                          {rule.minOccupancy !== null && (
                            <span>When occupancy ≥ {rule.minOccupancy}%</span>
                          )}
                          <span>Priority: {rule.priority}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRule(rule)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Coupons ─────────────────────────────────────────────── */}
        <TabsContent value="coupons">
          <div className="space-y-6">
            {/* Coupon validator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validate Coupon</CardTitle>
                <CardDescription>Check if a promo code is valid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code..."
                    value={validateCode}
                    onChange={(e) => setValidateCode(e.target.value.toUpperCase())}
                    className="max-w-xs"
                    onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                  />
                  <Button variant="outline" onClick={validateCoupon}>
                    Validate
                  </Button>
                </div>
                {validateResult && (
                  <div className={cn('mt-3 rounded-lg p-3', validateResult.valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200')}>
                    {validateResult.valid ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">
                          Valid: {validateResult.code} — {validateResult.type === 'percentage' ? `${validateResult.value}% off` : validateResult.type === 'fixed' ? `${formatCurrency(validateResult.value, hotel?.currency)} off` : `${validateResult.value} free night(s)`}
                        </span>
                        {validateResult.remainingUses !== null && validateResult.remainingUses !== undefined && (
                          <span className="text-xs text-emerald-600">({validateResult.remainingUses} uses remaining)</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">{validateResult.reason}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coupon list */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Coupons & Promo Codes</CardTitle>
                  <CardDescription>Manage discount codes for guests</CardDescription>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={openNewCoupon}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Coupon
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="py-12 text-center">
                    <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No coupons created</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className={cn(
                          'flex items-center gap-4 rounded-lg border p-4',
                          !coupon.isActive && 'opacity-60',
                        )}
                      >
                        <div className="rounded-lg bg-emerald-50 px-3 py-1.5 font-mono text-sm font-bold text-emerald-700">
                          {coupon.code}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {coupon.type === 'percentage'
                                ? `${coupon.value}% off`
                                : coupon.type === 'fixed'
                                  ? `${formatCurrency(coupon.value, hotel?.currency)} off`
                                  : `${coupon.value} free night(s)`}
                            </span>
                            {!coupon.isActive && (
                              <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500">Inactive</Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span>Used {coupon.usedCount}/{coupon.maxUses || '∞'}</span>
                            {coupon.minStay && <span>Min stay: {coupon.minStay} nights</span>}
                            {coupon.validFrom && <span>From {format(new Date(coupon.validFrom), 'MMM d')}</span>}
                            {coupon.validTo && <span>To {format(new Date(coupon.validTo), 'MMM d')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(coupon.code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCoupon(coupon)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCoupon(coupon.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Price Calculator ────────────────────────────────────── */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dynamic Price Calculator</CardTitle>
              <CardDescription>Preview the calculated price for any room on any date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select value={calcRoomId} onValueChange={setCalcRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.roomNumber} — {r.name} ({formatCurrency(r.basePrice, hotel?.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={calcDate}
                    onChange={(e) => setCalcDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={calculatePrice}
                    disabled={calcLoading || !calcRoomId || !calcDate}
                  >
                    {calcLoading ? 'Calculating...' : 'Calculate Price'}
                  </Button>
                </div>
              </div>

              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Base Price</p>
                      <p className="text-2xl font-bold">{formatCurrency(calcResult.basePrice, hotel?.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4 text-center border border-emerald-200">
                      <p className="text-sm text-muted-foreground">Final Price</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(calcResult.finalPrice, hotel?.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Current Occupancy</p>
                      <p className="text-2xl font-bold">{calcResult.currentOccupancyPercent}%</p>
                    </div>
                  </div>

                  {calcResult.appliedRules.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Applied Rules</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rule</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Adjustment</TableHead>
                            <TableHead className="text-right">Before</TableHead>
                            <TableHead className="text-right">After</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calcResult.appliedRules.map((rule, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{rule.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn('text-[10px]', RULE_TYPE_COLORS[rule.ruleType] || '')}>
                                  {rule.ruleType.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rule.adjustmentValue > 0 ? '+' : ''}{rule.adjustmentValue}{rule.adjustmentType === 'percentage' ? '%' : ''}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(rule.priceBefore, hotel?.currency)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(rule.priceAfter, hotel?.currency)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {calcResult.appliedRules.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No rate rules applied — price is the base rate.
                    </p>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Rule Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rate Rule' : 'Create Rate Rule'}</DialogTitle>
            <DialogDescription>
              Define conditions for automatic price adjustments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g. High Season Peak"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select value={ruleForm.ruleType} onValueChange={(v) => setRuleForm({ ...ruleForm, ruleType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select value={ruleForm.adjustmentType} onValueChange={(v) => setRuleForm({ ...ruleForm, adjustmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Value ({ruleForm.adjustmentType === 'percentage' ? 'e.g. 15 for +15%, -10 for -10%' : 'e.g. 5000'})</Label>
              <Input
                type="number"
                placeholder={ruleForm.adjustmentType === 'percentage' ? '15' : '5000'}
                value={ruleForm.adjustmentValue}
                onChange={(e) => setRuleForm({ ...ruleForm, adjustmentValue: e.target.value })}
              />
            </div>

            {(ruleForm.ruleType === 'seasonal' || ruleForm.ruleType === 'event') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input type="date" value={ruleForm.validFrom} onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <Input type="date" value={ruleForm.validTo} onChange={(e) => setRuleForm({ ...ruleForm, validTo: e.target.value })} />
                </div>
              </div>
            )}

            {ruleForm.ruleType === 'day_of_week' && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex gap-2">
                  {DAY_NAMES.map((day, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant={ruleForm.daysOfWeek.includes(i) ? 'default' : 'outline'}
                      size="sm"
                      className="w-10"
                      onClick={() => toggleDayOfWeek(i)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {ruleForm.ruleType === 'occupancy_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Occupancy (%)</Label>
                  <Input type="number" placeholder="80" value={ruleForm.minOccupancy} onChange={(e) => setRuleForm({ ...ruleForm, minOccupancy: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Occupancy (%)</Label>
                  <Input type="number" placeholder="100" value={ruleForm.maxOccupancy} onChange={(e) => setRuleForm({ ...ruleForm, maxOccupancy: e.target.value })} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Priority (higher = applied first)</Label>
              <Input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Enable this rule for price calculation</p>
              </div>
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(v) => setRuleForm({ ...ruleForm, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveRule} disabled={!ruleForm.name || !ruleForm.adjustmentValue}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Coupon Dialog ───────────────────────────────────────────── */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              Set up a promo code for discounts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g. SUMMER2026"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={couponForm.type} onValueChange={(v) => setCouponForm({ ...couponForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_nights">Free Nights</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Stay (nights)</Label>
                <Input type="number" placeholder="Optional" value={couponForm.minStay} onChange={(e) => setCouponForm({ ...couponForm, minStay: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input type="number" placeholder="Unlimited" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input type="date" value={couponForm.validFrom} onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <Input type="date" value={couponForm.validTo} onChange={(e) => setCouponForm({ ...couponForm, validTo: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Coupon can be used by guests</p>
              </div>
              <Switch checked={couponForm.isActive} onCheckedChange={(v) => setCouponForm({ ...couponForm, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveCoupon} disabled={!couponForm.code || !couponForm.value}>
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
