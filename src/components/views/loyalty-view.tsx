'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Star, Gift, TrendingUp, Users, Crown, ArrowUpDown,
  Plus, Minus, Search, RefreshCw, Award, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface GuestRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  vip: boolean
  loyaltyPoints: number
  totalStays: number
  totalSpent: number
  createdAt: string
  _count: { bookings: number; loyaltyTransactions: number }
}

interface LoyaltyTransaction {
  id: string
  type: string
  points: number
  balanceAfter: number
  description: string | null
  createdAt: string
  booking?: {
    id: string
    confirmationCode: string
    checkInDate: string
    room?: { name: string; roomNumber: string }
  }
}

interface GuestDetail {
  guest: GuestRow
  transactions: LoyaltyTransaction[]
  summary: { totalEarned: number; totalRedeemed: number; currentBalance: number; transactionCount: number }
}

const typeColors: Record<string, string> = {
  earn: 'bg-green-100 text-green-700',
  redeem: 'bg-red-100 text-red-700',
  expire: 'bg-yellow-100 text-yellow-700',
  bonus: 'bg-purple-100 text-purple-700',
  adjustment: 'bg-blue-100 text-blue-700',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount)
}

export function LoyaltyView() {
  const { currentHotelId } = useAppStore()
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('loyaltyPoints')
  const [selectedGuest, setSelectedGuest] = useState<GuestDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [configEnabled, setConfigEnabled] = useState(false)
  const [configRate, setConfigRate] = useState('1')
  const [configSaving, setConfigSaving] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const fetchGuests = useCallback(async () => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const sp = new URLSearchParams({ hotelId: currentHotelId, limit: '50', sortBy })
      if (search) sp.set('search', search)
      const res = await fetch(`/api/loyalty/guests?${sp}`)
      const json = await res.json()
      if (json.success) setGuests(json.data.guests)
    } catch { console.error('Failed to fetch guests') } finally { setLoading(false) }
  }, [currentHotelId, search, sortBy])

  const fetchConfig = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/loyalty/config?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) {
        setConfigEnabled(json.data.loyaltyEnabled)
        setConfigRate(json.data.loyaltyPointsPerCurrency?.toString() || '1')
      }
    } catch { console.error('Failed to fetch config') }
  }, [currentHotelId])

  useEffect(() => { fetchGuests() }, [fetchGuests])
  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSearch = () => { setSearch(searchInput) }

  const handleSaveConfig = async () => {
    if (!currentHotelId) return
    setConfigSaving(true)
    try {
      const res = await fetch('/api/loyalty/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ hotelId: currentHotelId, loyaltyEnabled: configEnabled, loyaltyPointsPerCurrency: parseFloat(configRate) || 1 }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Loyalty config updated') } else { toast.error(json.error) }
    } catch { toast.error('Failed to update config') } finally { setConfigSaving(false) }
  }

  const handleSelectGuest = async (guestId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/loyalty/guests/${guestId}?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setSelectedGuest(json.data)
    } catch { console.error('Failed to fetch guest detail') } finally { setDetailLoading(false) }
  }

  const handleRedeem = async () => {
    if (!selectedGuest || !redeemPoints) return
    const pts = parseInt(redeemPoints)
    if (isNaN(pts) || pts <= 0) { toast.error('Enter valid points'); return }
    try {
      const res = await fetch(`/api/loyalty/guests/${selectedGuest.guest.id}/redeem?hotelId=${currentHotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ points: pts }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Redeemed ${pts} points for ${formatCurrency(json.data.discountAmount)}`)
        setRedeemOpen(false)
        setRedeemPoints('')
        handleSelectGuest(selectedGuest.guest.id)
        fetchGuests()
      } else { toast.error(json.error) }
    } catch { toast.error('Failed to redeem') }
  }

  const handleAdjust = async () => {
    if (!selectedGuest || !adjustPoints || !adjustReason.trim()) return
    const pts = parseInt(adjustPoints)
    if (isNaN(pts) || pts === 0) { toast.error('Enter valid points (non-zero)'); return }
    try {
      const res = await fetch(`/api/loyalty/guests/${selectedGuest.guest.id}/adjust?hotelId=${currentHotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ points: pts, reason: adjustReason.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Adjusted ${pts > 0 ? '+' : ''}${pts} points`)
        setAdjustOpen(false)
        setAdjustPoints('')
        setAdjustReason('')
        handleSelectGuest(selectedGuest.guest.id)
        fetchGuests()
      } else { toast.error(json.error) }
    } catch { toast.error('Failed to adjust') }
  }

  // Summary stats
  const totalPoints = guests.reduce((sum, g) => sum + g.loyaltyPoints, 0)
  const totalSpent = guests.reduce((sum, g) => sum + g.totalSpent, 0)
  const vipCount = guests.filter(g => g.vip).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" /> Loyalty Program
          </h2>
          <p className="text-muted-foreground">Manage guest loyalty points, redemptions, and program settings.</p>
        </div>
        <Button variant="outline" onClick={() => { fetchGuests(); fetchConfig(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Program Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={configEnabled} onCheckedChange={setConfigEnabled} />
              <Label>{configEnabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="rate">Points per currency unit:</Label>
              <Input id="rate" type="number" step="0.1" min="0" value={configRate}
                onChange={e => setConfigRate(e.target.value)} className="w-28" />
            </div>
            <Button onClick={handleSaveConfig} disabled={configSaving} size="sm">
              {configSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-xl font-bold">{guests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Crown className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">VIP Guests</p>
                <p className="text-xl font-bold">{vipCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Guest Points</CardTitle>
              <div className="flex items-center gap-2">
                <Input placeholder="Search..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-48 h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={handleSearch}><Search className="h-3 w-3" /></Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loyaltyPoints">By Points</SelectItem>
                    <SelectItem value="totalSpent">By Spending</SelectItem>
                    <SelectItem value="totalStays">By Stays</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : guests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No guests found</p>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Stays</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map(g => (
                      <TableRow key={g.id} className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSelectGuest(g.id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {g.firstName[0]}{g.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{g.firstName} {g.lastName}</p>
                              {g.vip && <Badge className="text-[9px] h-4 bg-amber-100 text-amber-700 border-amber-200">VIP</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">{g.loyaltyPoints.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{g.totalStays}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(g.totalSpent)}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Guest Detail Panel */}
        <Card>
          {detailLoading ? (
            <CardContent className="p-6"><div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div></CardContent>
          ) : selectedGuest ? (
            <>
              <CardHeader>
                <CardTitle className="text-sm">
                  {selectedGuest.guest.firstName} {selectedGuest.guest.lastName}
                </CardTitle>
                <CardDescription>{selectedGuest.guest.email || selectedGuest.guest.phone || 'No contact info'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{selectedGuest.summary.currentBalance.toLocaleString()}</p>
                    <p className="text-xs text-amber-600">Current Points</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{selectedGuest.summary.totalEarned.toLocaleString()}</p>
                    <p className="text-xs text-green-600">Total Earned</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1"><Gift className="h-3 w-3 mr-1" /> Redeem</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Redeem Points</DialogTitle>
                        <DialogDescription>Convert points to a discount on a future booking.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <Label>Points to Redeem</Label>
                        <Input type="number" min="1" max={selectedGuest.summary.currentBalance}
                          value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} placeholder="Enter points" />
                        <p className="text-xs text-muted-foreground">Available: {selectedGuest.summary.currentBalance.toLocaleString()} points</p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRedeemOpen(false)}>Cancel</Button>
                        <Button onClick={handleRedeem} disabled={!redeemPoints}>Redeem Points</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1"><ArrowUpDown className="h-3 w-3 mr-1" /> Adjust</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Points</DialogTitle>
                        <DialogDescription>Manually add or remove loyalty points.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <Label>Points (+ to add, - to remove)</Label>
                        <Input type="number" value={adjustPoints} onChange={e => setAdjustPoints(e.target.value)} placeholder="e.g. 100 or -50" />
                        <Label>Reason</Label>
                        <Textarea value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason for adjustment..." rows={2} />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdjust} disabled={!adjustPoints || !adjustReason.trim()}>Apply Adjustment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Transaction History ({selectedGuest.transactions.length})</p>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {selectedGuest.transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No transactions</p>
                      ) : (
                        selectedGuest.transactions.map(t => (
                          <div key={t.id} className="flex items-start gap-2 p-2 rounded border text-xs">
                            <div className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[t.type] || 'bg-gray-100'}`}>
                              {t.type}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{t.description || t.type}</p>
                              {t.booking && (
                                <p className="text-muted-foreground">Booking: {t.booking.confirmationCode}</p>
                              )}
                              <p className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`font-mono font-medium ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {t.points >= 0 ? '+' : ''}{t.points}
                              </p>
                              <p className="text-muted-foreground">Balance: {t.balanceAfter}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a guest to view details</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
