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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/glass/glass-card'
import { GlassStatCard } from '@/components/glass/glass-stat-card'
import { GlassBadge } from '@/components/glass/glass-badge'

// Mock data for platform admin
const mockHotels = [
  { id: '1', name: 'Safari Lodge Nairobi', slug: 'safari-lodge', city: 'Nairobi', country: 'Kenya', plan: 'pro', rooms: 32, bookings: 156, revenue: 245000, status: 'active', owner: 'Grace Mwangi', createdAt: '2025-06-15' },
  { id: '2', name: 'Zanzibar Beach Resort', slug: 'zanzibar-beach', city: 'Zanzibar', country: 'Tanzania', plan: 'starter', rooms: 18, bookings: 89, revenue: 132000, status: 'active', owner: 'Joseph Kayombo', createdAt: '2025-08-22' },
  { id: '3', name: 'Kilimanjaro Grand', slug: 'kilimanjaro-grand', city: 'Moshi', country: 'Tanzania', plan: 'enterprise', rooms: 64, bookings: 312, revenue: 890000, status: 'active', owner: 'Amina Hassan', createdAt: '2025-03-10' },
  { id: '4', name: 'Dar es Salaam Business Hotel', slug: 'dar-biz-hotel', city: 'Dar es Salaam', country: 'Tanzania', plan: 'free', rooms: 8, bookings: 23, revenue: 34500, status: 'active', owner: 'Hassan Ali', createdAt: '2025-11-01' },
  { id: '5', name: 'Arusha Safari Camp', slug: 'arusha-camp', city: 'Arusha', country: 'Tanzania', plan: 'pro', rooms: 24, bookings: 67, revenue: 178000, status: 'trial', owner: 'Sarah Johnson', createdAt: '2026-01-15' },
  { id: '6', name: 'Mombasa Beach Villa', slug: 'mombasa-villa', city: 'Mombasa', country: 'Kenya', plan: 'starter', rooms: 12, bookings: 45, revenue: 89000, status: 'cancelled', owner: 'Ahmed Omar', createdAt: '2025-09-05' },
]

const mockPlatformStats = {
  totalHotels: 2847,
  activeHotels: 2634,
  totalRooms: 48200,
  monthlyBookings: 124500,
  monthlyRevenue: 4250000,
  totalUsers: 8920,
  paidSubscriptions: 1456,
  trialUsers: 312,
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [hotelSearch, setHotelSearch] = useState('')

  const filteredHotels = mockHotels.filter(h =>
    h.name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hotelSearch.toLowerCase()) ||
    h.owner.toLowerCase().includes(hotelSearch.toLowerCase())
  )

  const planColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500/15 text-purple-300 border-purple-400/30'
      case 'pro': return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
      case 'starter': return 'bg-blue-500/15 text-blue-300 border-blue-400/30'
      case 'free': return 'bg-gray-500/15 text-gray-300 border-gray-400/30'
      default: return 'bg-gray-500/15 text-gray-300 border-gray-400/30'
    }
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
        <GlassStatCard title="Total Hotels" value={mockPlatformStats.totalHotels.toLocaleString()} change="+23 this month" changeType="positive" icon={Hotel} />
        <GlassStatCard title="Monthly Revenue" value={`$${(mockPlatformStats.monthlyRevenue / 1000).toFixed(0)}K`} change="+12.5% vs last month" changeType="positive" icon={DollarSign} />
        <GlassStatCard title="Active Users" value={mockPlatformStats.totalUsers.toLocaleString()} change="+156 this month" changeType="positive" icon={Users} />
        <GlassStatCard title="Monthly Bookings" value={mockPlatformStats.monthlyBookings.toLocaleString()} change="+8.3% vs last month" changeType="positive" icon={Activity} />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassStatCard title="Paid Subscriptions" value={mockPlatformStats.paidSubscriptions.toLocaleString()} icon={CreditCard} />
        <GlassStatCard title="Free Hotels" value={mockPlatformStats.totalHotels - mockPlatformStats.paidSubscriptions} icon={Hotel} />
        <GlassStatCard title="Total Rooms" value={mockPlatformStats.totalRooms.toLocaleString()} icon={TrendingUp} />
        <GlassStatCard title="Trial Users" value={mockPlatformStats.trialUsers.toString()} change="312 in trial" changeType="neutral" icon={Shield} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Overview</TabsTrigger>
          <TabsTrigger value="hotels" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Hotels</TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Subscriptions</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Platform Settings</TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search hotels, cities, owners..."
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
                  <TableHead className="text-white/50">Revenue</TableHead>
                  <TableHead className="text-white/50 hidden lg:table-cell">Owner</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.map((hotel) => (
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
                    <TableCell className="hidden md:table-cell text-white/70">{hotel.rooms}</TableCell>
                    <TableCell className="hidden md:table-cell text-white/70">{hotel.bookings}</TableCell>
                    <TableCell className="text-white/70">${hotel.revenue.toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell text-white/70">{hotel.owner}</TableCell>
                    <TableCell>
                      {hotel.status === 'active' && <GlassBadge variant="success">Active</GlassBadge>}
                      {hotel.status === 'trial' && <GlassBadge variant="warning">Trial</GlassBadge>}
                      {hotel.status === 'cancelled' && <GlassBadge variant="danger">Cancelled</GlassBadge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Recent Activity</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { action: 'New hotel registered', detail: 'Arusha Safari Camp joined', time: '2 hours ago', type: 'success' },
                    { action: 'Subscription upgraded', detail: 'Safari Lodge → Pro plan', time: '5 hours ago', type: 'success' },
                    { action: 'Payment failed', detail: 'Mombasa Beach Villa - past due', time: '1 day ago', type: 'danger' },
                    { action: 'New trial started', detail: 'Coastal Paradise Hotel - 14 days', time: '2 days ago', type: 'neutral' },
                    { action: 'Hotel suspended', detail: 'Sunset View Lodge - TOS violation', time: '3 days ago', type: 'danger' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-400' : item.type === 'danger' ? 'bg-red-400' : 'bg-white/30'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{item.action}</p>
                        <p className="text-xs text-white/40">{item.detail}</p>
                      </div>
                      <span className="text-xs text-white/30 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Plan Distribution */}
            <GlassCard hover={false}>
              <GlassCardHeader>
                <GlassCardTitle>Plan Distribution</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Enterprise', count: 89, pct: 3, color: 'bg-purple-500', colorLight: 'bg-purple-500/20' },
                    { name: 'Pro', count: 890, pct: 31, color: 'bg-emerald-500', colorLight: 'bg-emerald-500/20' },
                    { name: 'Starter', count: 477, pct: 17, color: 'bg-blue-500', colorLight: 'bg-blue-500/20' },
                    { name: 'Free', count: 1391, pct: 49, color: 'bg-gray-500', colorLight: 'bg-gray-500/20' },
                  ].map((plan) => (
                    <div key={plan.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-white">{plan.name}</span>
                        <span className="text-xs text-white/40">{plan.count} hotels ({plan.pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${plan.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassStatCard title="MRR" value="$156K" change="+14% MoM" changeType="positive" icon={DollarSign} />
            <GlassStatCard title="Active Subs" value="1,456" change="+89 this month" changeType="positive" icon={CreditCard} />
            <GlassStatCard title="Churn Rate" value="2.3%" change="-0.5%" changeType="positive" icon={TrendingUp} />
            <GlassStatCard title="Avg LTV" value="$2,840" change="+$120" changeType="positive" icon={Activity} />
          </div>
          <GlassCard hover={false}>
            <GlassCardHeader>
              <GlassCardTitle>Subscription Events</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {[
                  { hotel: 'Safari Lodge Nairobi', event: 'Upgraded to Pro', amount: '$99/mo', date: 'Today' },
                  { hotel: 'Dar es Salaam Business Hotel', event: 'Trial started', amount: '$0', date: 'Today' },
                  { hotel: 'Kilimanjaro Grand', event: 'Renewed Enterprise', amount: '$249/mo', date: 'Yesterday' },
                  { hotel: 'Mombasa Beach Villa', event: 'Payment failed', amount: '$49/mo', date: '2 days ago' },
                  { hotel: 'Beach Paradise Resort', event: 'Cancelled subscription', amount: '$0', date: '3 days ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{item.hotel}</p>
                      <p className="text-xs text-white/40">{item.event}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{item.amount}</p>
                      <p className="text-xs text-white/30">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
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
                <GlassCardTitle>Payment Gateway (Platform)</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Stripe', status: 'Connected', desc: 'Platform subscription billing' },
                    { name: 'Pesapal', status: 'Connected', desc: 'East Africa payment processing' },
                    { name: 'PayPal', status: 'Connected', desc: 'International payment processing' },
                  ].map((gw, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl bg-white/5 p-3 border border-white/5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/60 text-lg font-bold">
                        {gw.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{gw.name}</p>
                        <p className="text-xs text-white/40">{gw.desc}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-400/30">
                        <CheckCircle className="h-3 w-3" />
                        {gw.status}
                      </span>
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
