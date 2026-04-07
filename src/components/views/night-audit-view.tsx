'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Moon,
  Play,
  RefreshCw,
  Bed,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  BarChart3,
  CreditCard,
  Smartphone,
  Banknote,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NightAudit {
  id: string
  hotelId: string
  auditorId: string | null
  auditDate: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  outOfOrderRooms: number
  roomRevenue: number
  fAndBRevenue: number | null
  extraRevenue: number | null
  totalRevenue: number
  occupancyRate: number
  adr: number
  revpar: number
  cashReceived: number
  cardReceived: number
  mobileMoneyReceived: number
  pendingPayments: number
  notes: string | null
  status: string
  createdAt: string
  auditor?: { id: string; name: string; email: string } | null
}

// ─── Component ──────────────────────────────────────────────────────────────

export function NightAuditView() {
  const { currentHotelId, hotel } = useAppStore()
  const [audits, setAudits] = useState<NightAudit[]>([])
  const [latestAudit, setLatestAudit] = useState<NightAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [runDate, setRunDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [runNotes, setRunNotes] = useState('')

  const currency = hotel?.currency || 'USD'

  const fetchAudits = useCallback(async () => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const [auditsRes, latestRes] = await Promise.all([
        api.getNightAudits(currentHotelId),
        api.getLatestNightAudit(currentHotelId),
      ])
      if (auditsRes.success) setAudits(auditsRes.data as NightAudit[])
      if (latestRes.success) setLatestAudit(latestRes.data as NightAudit)
    } catch {
      toast.error('Failed to fetch night audits')
    } finally {
      setLoading(false)
    }
  }, [currentHotelId])

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  const handleRunAudit = async () => {
    if (!currentHotelId) return
    setRunning(true)
    try {
      const res = await api.runNightAudit(currentHotelId, {
        date: runDate,
        notes: runNotes || null,
        auditorId: useAppStore.getState().currentUser?.id,
      })
      if (res.success) {
        toast.success('Night audit completed successfully')
        setShowRunDialog(false)
        setRunNotes('')
        fetchAudits()
      } else {
        toast.error(res.error || 'Failed to run night audit')
      }
    } catch {
      toast.error('Failed to run night audit')
    } finally {
      setRunning(false)
    }
  }

  if (!currentHotelId) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Night Audit</h2>
          <p className="text-sm text-muted-foreground">
            Daily end-of-day summary and revenue reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAudits}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowRunDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Run Night Audit
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : latestAudit ? (
        <>
          {/* Latest Audit Header */}
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <Moon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Audit for {format(parseISO(latestAudit.auditDate), 'MMMM d, yyyy')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Run by {latestAudit.auditor?.name || 'System'} &bull;{' '}
                      {format(parseISO(latestAudit.createdAt), "MMM d 'at' HH:mm")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Bed className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {latestAudit.occupiedRooms}
                  <span className="text-sm font-normal text-muted-foreground">/{latestAudit.totalRooms}</span>
                </p>
                <p className="text-xs text-muted-foreground">Occupied Rooms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Percent className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{latestAudit.occupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Occupancy Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{formatCurrency(latestAudit.adr, currency)}</p>
                <p className="text-xs text-muted-foreground">ADR (Avg Daily Rate)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{formatCurrency(latestAudit.revpar, currency)}</p>
                <p className="text-xs text-muted-foreground">RevPAR</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Room Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Room Revenue</span>
                  <span className="text-sm font-bold">{formatCurrency(latestAudit.roomRevenue, currency)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(latestAudit.totalRevenue, currency)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bed className="h-4 w-4" />
                  Room Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Occupied</span>
                  </div>
                  <span className="text-sm font-bold">{latestAudit.occupiedRooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Available</span>
                  </div>
                  <span className="text-sm font-bold">{latestAudit.availableRooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm">Out of Order</span>
                  </div>
                  <span className="text-sm font-bold">{latestAudit.outOfOrderRooms}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Rooms</span>
                  <span className="text-sm font-bold">{latestAudit.totalRooms}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Breakdown
              </CardTitle>
              <CardDescription>Payments received on this date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <Banknote className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                  <p className="text-lg font-bold">{formatCurrency(latestAudit.cashReceived, currency)}</p>
                  <p className="text-xs text-muted-foreground">Cash</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <CreditCard className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                  <p className="text-lg font-bold">{formatCurrency(latestAudit.cardReceived, currency)}</p>
                  <p className="text-xs text-muted-foreground">Card</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <Smartphone className="mx-auto mb-1 h-5 w-5 text-violet-600" />
                  <p className="text-lg font-bold">{formatCurrency(latestAudit.mobileMoneyReceived, currency)}</p>
                  <p className="text-xs text-muted-foreground">Mobile Money</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <AlertCircle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                  <p className="text-lg font-bold">{formatCurrency(latestAudit.pendingPayments, currency)}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit History */}
          {audits.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Audit History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-64">
                  <div className="divide-y">
                    {audits.slice(1, 20).map((audit) => (
                      <div key={audit.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(parseISO(audit.auditDate), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {audit.auditor?.name || 'System'} &bull; Occupancy: {audit.occupancyRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(audit.totalRevenue, currency)}</p>
                          <p className="text-[10px] text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Moon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">No Night Audit Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first night audit to see daily performance metrics
            </p>
            <Button
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowRunDialog(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Night Audit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Run Audit Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Run Night Audit</DialogTitle>
            <DialogDescription>
              Generate an end-of-day audit report for the selected date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Audit Date</Label>
              <Input
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any notes about this audit..."
                value={runNotes}
                onChange={(e) => setRunNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleRunAudit}
              disabled={running}
            >
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
