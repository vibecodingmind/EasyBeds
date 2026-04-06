'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import {
  BarChart3,
  TrendingUp,
  Bed,
  DollarSign,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api, type OccupancyReportData, type RevenueReportData } from '@/lib/api'
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
} from 'recharts'

// ─── Chart Colors ────────────────────────────────────────────────────────────

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899']

const statusColors: Record<string, string> = {
  confirmed: '#10B981',
  pending: '#F59E0B',
  checked_in: '#3B82F6',
  checked_out: '#9CA3AF',
  cancelled: '#EF4444',
  no_show: '#F97316',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportsView() {
  const { currentHotelId, hotel } = useAppStore()
  const [occupancyData, setOccupancyData] = useState<OccupancyReportData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null)
  const [loading, setLoading] = useState(true)

  // Date range — default to current month
  const now = new Date()
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))

  const fetchReports = useCallback(
    async (from?: string, to?: string) => {
      if (!currentHotelId) return
      setLoading(true)
      try {
        const [occRes, revRes] = await Promise.all([
          api.getOccupancyReport(currentHotelId, from, to),
          api.getRevenueReport(currentHotelId, from, to),
        ])

        if (occRes.success) setOccupancyData(occRes.data)
        if (revRes.success) setRevenueData(revRes.data)
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    },
    [currentHotelId],
  )

  useEffect(() => {
    fetchReports(fromDate, toDate)
  }, [fetchReports, fromDate, toDate])

  const handleApplyRange = () => {
    fetchReports(fromDate, toDate)
  }

  const formatCurrency = (amount: number) => {
    const currency = hotel?.currency || 'USD'
    try {
      return amount.toLocaleString(undefined, { style: 'currency', currency })
    } catch {
      return `${currency} ${amount.toLocaleString()}`
    }
  }

  // ─── Metrics Cards ────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    if (!occupancyData || !revenueData) return []
    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(revenueData.summary.totalRevenue),
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        title: 'Total Bookings',
        value: occupancyData.summary.totalBookings.toString(),
        icon: BarChart3,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'Avg. Daily Rate',
        value: formatCurrency(Math.round(occupancyData.summary.avgDailyRate)),
        icon: TrendingUp,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
      {
        title: 'Occupancy Rate',
        value: `${Math.round(occupancyData.summary.occupancyRate)}%`,
        icon: Bed,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ]
  }, [occupancyData, revenueData, formatCurrency])

  // ─── Chart Data Preps ──────────────────────────────────────────────────────

  // Bookings by status → pie chart data
  const statusPieData = useMemo(() => {
    if (!occupancyData) return []
    return Object.entries(occupancyData.bookingsByStatus).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      fill: statusColors[status] || '#9CA3AF',
    }))
  }, [occupancyData])

  // Revenue by channel → bar chart data
  const channelBarData = useMemo(() => {
    if (!revenueData) return []
    return revenueData.revenueByChannel.map((ch) => ({
      name: ch.channelName,
      revenue: Math.round(ch.totalRevenue),
      bookings: ch.totalBookings,
    }))
  }, [revenueData])

  // Daily revenue → line chart data
  const dailyLineData = useMemo(() => {
    if (!revenueData) return []
    return revenueData.dailyRevenue.map((d) => ({
      date: d.date.slice(5), // MM-DD
      revenue: Math.round(d.revenue * 100) / 100,
    }))
  }, [revenueData])

  // Revenue by room type → bar chart data
  const roomTypeBarData = useMemo(() => {
    if (!revenueData) return []
    return revenueData.revenueByRoomType.map((rt) => ({
      name: rt.roomType,
      revenue: Math.round(rt.totalRevenue),
      bookings: rt.totalBookings,
    }))
  }, [revenueData])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Performance insights and trends
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button
            className="mb-0.5 bg-emerald-600 hover:bg-emerald-700"
            size="sm"
            onClick={handleApplyRange}
            disabled={loading}
          >
            <CalendarDays className="mr-1 h-3.5 w-3.5" />
            Apply
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        metric.bg,
                      )}
                    >
                      <metric.icon className={cn('h-5 w-5', metric.color)} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="text-xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Chart 1: Bookings by Status (Pie) ────────────────────────── */}
        {occupancyData && statusPieData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bookings by Status</CardTitle>
                <CardDescription>Distribution of booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={true}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [`${value} bookings`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Chart 2: Revenue by Channel (Bar) ────────────────────────── */}
        {revenueData && channelBarData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Channel</CardTitle>
                <CardDescription>Revenue distribution across channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                        className="text-muted-foreground"
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Chart 3: Daily Revenue Trend (Line) ──────────────────────── */}
        {revenueData && dailyLineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue per day over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyLineData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        className="text-muted-foreground"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                        className="text-muted-foreground"
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Chart 4: Revenue by Room Type (Bar) ──────────────────────── */}
        {revenueData && roomTypeBarData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Room Type</CardTitle>
                <CardDescription>Revenue breakdown per room type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roomTypeBarData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                        className="text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        width={80}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Performance Summary ──────────────────────────────────────── */}
        {occupancyData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {Math.round(occupancyData.summary.occupancyRate)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Occupancy Rate</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {occupancyData.summary.activeBookings}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Bookings</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.round(occupancyData.summary.avgDailyRate))}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Daily Rate</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {occupancyData.summary.avgStayLength}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Stay (nights)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── No Data States ───────────────────────────────────────────── */}
        {!loading && !occupancyData && !revenueData && (
          <div className="py-16 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No report data available for this period.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try selecting a different date range.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
