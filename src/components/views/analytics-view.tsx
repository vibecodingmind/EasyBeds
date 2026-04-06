'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Bed,
  Users,
  BarChart3,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiData {
  date: string
  today: {
    occupancyRate: number
    occupiedRooms: number
    totalRooms: number
    checkIns: number
    checkOuts: number
    revenue: number
  }
  month: {
    totalBookings: number
    totalRevenue: number
    occupancyRate: number
    adr: number
    revpar: number
    goppar: number
    avgStayLength: number
    cancellationRate: number
    newGuestRevenue: number
    returningGuestRevenue: number
  }
  sourceBreakdown: Record<string, { count: number; revenue: number }>
}

interface TrendsData {
  period: string
  days: number
  from: string
  to: string
  totalRooms: number
  occupancyTrend: Array<{
    date: string
    occupancy: number
    occupiedRooms: number
    revenue: number
    bookings: number
  }>
  revenueTrend: Array<{ date: string; revenue: number }>
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>
}

interface ChannelData {
  period: { from: string; to: string }
  summary: {
    totalRevenue: number
    totalCommission: number
    netRevenue: number
    totalChannels: number
  }
  channels: Array<{
    channelId: string
    channelName: string
    channelType: string
    totalBookings: number
    activeBookings: number
    cancelledBookings: number
    totalRevenue: number
    totalNights: number
    avgBookingValue: number
    avgNights: number
    commission: number
    netRevenue: number
  }>
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316']
const CHANNEL_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899']

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsView() {
  const { currentHotelId, hotel } = useAppStore()
  const [kpiData, setKpiData] = useState<KpiData | null>(null)
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [channelData, setChannelData] = useState<ChannelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendPeriod, setTrendPeriod] = useState('30d')

  const currency = hotel?.currency || 'USD'

  const fetchKpis = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/analytics/kpis?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setKpiData(json.data)
    } catch (err) {
      console.error('Failed to fetch KPIs:', err)
    }
  }, [currentHotelId])

  const fetchTrends = useCallback(async (period: string) => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/analytics/trends?hotelId=${currentHotelId}&period=${period}`)
      const json = await res.json()
      if (json.success) setTrendsData(json.data)
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }, [currentHotelId])

  const fetchChannels = useCallback(async () => {
    if (!currentHotelId) return
    try {
      const res = await fetch(`/api/analytics/channels?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setChannelData(json.data)
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    }
  }, [currentHotelId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchKpis(), fetchTrends(trendPeriod), fetchChannels()])
      setLoading(false)
    }
    load()
  }, [fetchKpis, fetchTrends, fetchChannels, trendPeriod])

  // ─── Chart Data ──────────────────────────────────────────────────────────

  const revenuePieData = useMemo(() => {
    if (!channelData) return []
    return channelData.channels.map((ch, i) => ({
      name: ch.channelName,
      value: ch.totalRevenue,
      fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))
  }, [channelData])

  const sourceBreakdownData = useMemo(() => {
    if (!kpiData) return []
    return Object.entries(kpiData.sourceBreakdown).map(([source, data], i) => ({
      name: source,
      bookings: data.count,
      revenue: data.revenue,
      fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))
  }, [kpiData])

  const guestTypeData = useMemo(() => {
    if (!kpiData) return []
    return [
      { name: 'New Guests', value: kpiData.month.newGuestRevenue, fill: '#3B82F6' },
      { name: 'Returning', value: kpiData.month.returningGuestRevenue, fill: '#10B981' },
    ]
  }, [kpiData])

  if (!currentHotelId) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Revenue KPIs, trends, and channel performance
          </p>
        </div>
        <div className="flex gap-1">
          {['7d', '30d', '90d'].map((p) => (
            <Badge
              key={p}
              variant={trendPeriod === p ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer',
                trendPeriod === p && 'bg-emerald-600 hover:bg-emerald-700',
              )}
              onClick={() => setTrendPeriod(p)}
            >
              {p.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-10 rounded-xl mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))
        ) : kpiData ? (
          [
            { title: 'ADR', value: formatCurrency(kpiData.month.adr, currency), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Avg Daily Rate' },
            { title: 'RevPAR', value: formatCurrency(kpiData.month.revpar, currency), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Rev/Available Room' },
            { title: 'GOPPAR', value: formatCurrency(kpiData.month.goppar, currency), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Gross Op Profit/Room' },
            { title: 'Occupancy', value: `${kpiData.month.occupancyRate}%`, icon: Bed, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Monthly rate' },
            { title: 'Total Revenue', value: formatCurrency(kpiData.month.totalRevenue, currency), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'This month' },
            { title: 'Avg Stay', value: `${kpiData.month.avgStayLength} nights`, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Length of stay' },
            { title: 'Cancellation', value: `${kpiData.month.cancellationRate}%`, icon: ArrowDownRight, color: kpiData.month.cancellationRate > 10 ? 'text-red-600' : 'text-emerald-600', bg: kpiData.month.cancellationRate > 10 ? 'bg-red-50' : 'bg-emerald-50', sub: 'Cancel rate' },
            { title: 'Total Bookings', value: String(kpiData.month.totalBookings), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'This month' },
          ].map((stat) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', stat.bg)}>
                      <stat.icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      <p className="text-lg font-bold leading-tight">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : null}
      </div>

      {/* ─── Charts Grid ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy Trend */}
        {trendsData && trendsData.occupancyTrend.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Occupancy Trend</CardTitle>
              <CardDescription>
                {trendsData.from} to {trendsData.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData.occupancyTrend.slice(-trendsData.days)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" tickFormatter={(v) => v.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Occupancy']} labelFormatter={(label) => `Date: ${label}`} />
                    <Area type="monotone" dataKey="occupancy" stroke="#10B981" strokeWidth={2} fill="url(#occupancyGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue by Channel Pie */}
        {revenuePieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by Channel</CardTitle>
              <CardDescription>Distribution of revenue across booking sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenuePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {revenuePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue vs Guest Type */}
        {guestTypeData.length > 0 && guestTypeData.some((d) => d.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue: New vs Returning Guests</CardTitle>
              <CardDescription>Breakdown by guest loyalty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={guestTypeData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {guestTypeData.filter((d) => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Trend (Monthly) */}
        {trendsData && trendsData.monthlyRevenue.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue (Last 12 Months)</CardTitle>
              <CardDescription>Revenue trend over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendsData.monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} className="text-muted-foreground" />
                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Source Breakdown */}
        {sourceBreakdownData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Booking Source Breakdown</CardTitle>
              <CardDescription>Bookings and revenue by source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceBreakdownData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} className="text-muted-foreground" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Channel Performance Table ───────────────────────────────── */}
      {channelData && channelData.channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Performance</CardTitle>
            <CardDescription>
              Detailed breakdown by channel — Commission: {formatCurrency(channelData.summary.totalCommission, currency)} |
              Net Revenue: {formatCurrency(channelData.summary.netRevenue, currency)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium">Channel</th>
                    <th className="px-3 py-2 text-right font-medium">Bookings</th>
                    <th className="px-3 py-2 text-right font-medium">Nights</th>
                    <th className="px-3 py-2 text-right font-medium">Revenue</th>
                    <th className="px-3 py-2 text-right font-medium">Commission</th>
                    <th className="px-3 py-2 text-right font-medium">Net Revenue</th>
                    <th className="px-3 py-2 text-right font-medium">Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.channels.map((ch, i) => (
                    <tr key={ch.channelId} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                          {ch.channelName}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{ch.totalBookings}</td>
                      <td className="px-3 py-2 text-right">{ch.totalNights}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(ch.totalRevenue, currency)}</td>
                      <td className="px-3 py-2 text-right text-red-600">{ch.commission > 0 ? formatCurrency(ch.commission, currency) : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(ch.netRevenue, currency)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(ch.avgBookingValue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── No data ─────────────────────────────────────────────────── */}
      {!loading && !kpiData && !trendsData && !channelData && (
        <div className="py-16 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No analytics data available.</p>
        </div>
      )}
    </motion.div>
  )
}
