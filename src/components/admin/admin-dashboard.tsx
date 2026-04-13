'use client'
import React, { useState, useEffect } from 'react'
import {
  Hotel, Users, DollarSign, Activity, TrendingUp, Settings, CreditCard, Shield, Search, ChevronRight, Eye, Ban, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/glass/glass-card'
import { GlassStatCard } from '@/components/glass/glass-stat-card'
import { GlassBadge } from '@/components/glass/glass-badge'
import { api } from '@/lib/api'

interface PlatformStats {
  totalHotels: number
  activeHotels: number
  totalRooms: number
  totalUsers: number
  totalBookings: number
  totalGuests: number
  monthlyBookings: number
  totalRevenue: number
  monthlyRevenue: number
  planDistribution: Record<string, number>
  recentHotels: Array<{
    id: string; name: string; slug: string; city: string; country: string; plan: string
    _count: { rooms: number; bookings: number }
    createdAt: string
  }>
}

const emptyStats: PlatformStats = {
  totalHotels: 0, activeHotels: 0, totalRooms: 0, totalUsers: 0,
  totalBookings: 0, totalGuests: 0, monthlyBookings: 0,
  totalRevenue: 0, monthlyRevenue: 0, planDistribution: {},
  recentHotels: [],
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [hotelSearch, setHotelSearch] = useState('')
  const [stats, setStats] = useState<PlatformStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('easybeds-token')}` },
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success) setStats(json.data)
          else setError(json.error || 'Failed to load')
        } else {
          setError(`HTTP ${res.status}`)
        }
      } catch (e) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const filteredHotels = (stats.recentHotels || []).filter(h =>
    h.name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hotelSearch.toLowerCase())
  )

  const planColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500/15 text-purple-300 border-purple-400/30'
      case 'pro': return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
      case 'starter': return 'bg-blue-500/15 text-blue-300 border-blue-400/30'
      case 'trial': return 'bg-amber-500/15 text-amber-300 border-amber-400/30'
      default: return 'bg-gray-500/15 text-gray-300 border-gray-400/30'
    }
  }

  const pd = stats.planDistribution || {}

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/60">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
        <p className="text-lg font-medium">Failed to load platform data</p>
        <p className="text-sm text-white/40 mt-1">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
          <p className="text-sm text-white/50">Manage all hotels, subscriptions, and platform settings</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassBadge variant="success">System Online</GlassBadge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassStatCard title="Total Hotels" value={stats.totalHotels.toLocaleString()} change={`${stats.activeHotels} active`} changeType="positive" icon={Hotel} />
        <GlassStatCard title="Monthly Revenue" value={formatNumber(stats.monthlyRevenue)} change={`${stats.monthlyBookings} bookings`} changeType="positive" icon={DollarSign} />
        <GlassStatCard title="Total Users" value={stats.totalUsers.toLocaleString()} change={`${stats.totalHotels} hotels`} changeType="positive" icon={Users} />
        <GlassStatCard title="Total Rooms" value={stats.totalRooms.toLocaleString()} change={`${stats.totalBookings} bookings total`} changeType="positive" icon={Activity} />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassStatCard title="Total Bookings" value={stats.totalBookings.toLocaleString()} icon={TrendingUp} />
        <GlassStatCard title="Total Guests" value={stats.totalGuests.toLocaleString()} icon={Users} />
        <GlassStatCard title="Total Revenue" value={formatNumber(stats.totalRevenue)} icon={CreditCard} />
        <GlassStatCard title="Monthly Bookings" value={stats.monthlyBookings.toLocaleString()} icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Overview</TabsTrigger>
          <TabsTrigger value="hotels" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Hotels</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Platform Settings</TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search hotels, cities..."
                className="rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                value={hotelSearch}
                onChange={(e) => setHotelSearch(e.target.value)}
              />
            </div>
            <GlassBadge>{filteredHotels.length} hotels</GlassBadge>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Hotel</TableHead>
                  <TableHead className="text-white/50">Plan</TableHead>
                  <TableHead className="text-white/50 hidden md:table-cell">Rooms</TableHead>
                  <TableHead className="text-white/50 hidden md:table-cell">Bookings</TableHead>
                  <TableHead className="text-white/50">Joined</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">No hotels found</TableCell></TableRow>
                ) : (
                  filteredHotels.map((hotel) => (
                    <TableRow key={hotel.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{hotel.name}</p>
                          <p className="text-xs text-white/40">{hotel.city}, {hotel.country}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${planColor(hotel.plan)}`}>
                          {hotel.plan}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-white/70">{hotel._count.rooms}</TableCell>
                      <TableCell className="hidden md:table-cell text-white/70">{hotel._count.bookings}</TableCell>
                      <TableCell className="text-white/50 text-sm">{new Date(hotel.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <GlassBadge variant="success">Active</GlassBadge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan Distribution */}
            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Plan Distribution</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Enterprise', count: pd.enterprise || 0, color: 'bg-purple-500', colorLight: 'bg-purple-500/20' },
                    { name: 'Pro', count: pd.pro || 0, color: 'bg-emerald-500', colorLight: 'bg-emerald-500/20' },
                    { name: 'Starter', count: pd.starter || 0, color: 'bg-blue-500', colorLight: 'bg-blue-500/20' },
                    { name: 'Trial', count: pd.trial || 0, color: 'bg-amber-500', colorLight: 'bg-amber-500/20' },
                    { name: 'Free', count: pd.free || 0, color: 'bg-gray-500', colorLight: 'bg-gray-500/20' },
                  ].map((plan) => {
                    const pct = stats.totalHotels > 0 ? Math.round((plan.count / stats.totalHotels) * 100) : 0
                    return (
                      <div key={plan.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white">{plan.name}</span>
                          <span className="text-xs text-white/40">{plan.count} hotels ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Platform Summary */}
            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Platform Summary</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total Hotels', value: stats.totalHotels.toLocaleString(), desc: `${stats.activeHotels} active` },
                    { label: 'Total Rooms', value: stats.totalRooms.toLocaleString(), desc: 'Across all hotels' },
                    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), desc: 'Registered users' },
                    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), desc: 'All-time bookings' },
                    { label: 'Monthly Bookings', value: stats.monthlyBookings.toLocaleString(), desc: 'This month' },
                    { label: 'Monthly Revenue', value: formatNumber(stats.monthlyRevenue), desc: 'This month' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                      <span className="text-sm text-emerald-400 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Platform Configuration</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Platform Name', value: 'EasyBeds', description: 'Display name across the platform' },
                    { label: 'Default Currency', value: 'USD', description: 'Fallback currency for new hotels' },
                    { label: 'Trial Period', value: '14 days', description: 'Free trial for new signups' },
                    { label: 'Support Email', value: 'support@easybeds.com', description: 'Customer support contact' },
                    { label: 'Maintenance Mode', value: 'Off', description: 'Disable access for non-admins' },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{setting.label}</p>
                        <p className="text-xs text-white/40">{setting.description}</p>
                      </div>
                      <span className="text-sm text-emerald-400">{setting.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Platform Stats</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total Guests', value: stats.totalGuests.toLocaleString() },
                    { label: 'All-time Revenue', value: formatNumber(stats.totalRevenue) },
                    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString() },
                    { label: 'Registered Hotels', value: stats.totalHotels.toLocaleString() },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <span className="text-sm text-emerald-400 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Need AlertTriangle for error state
function AlertTriangle(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
