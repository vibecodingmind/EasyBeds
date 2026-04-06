'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParityRoom {
  roomId: string
  roomName: string
  roomNumber: string
  roomType: string
  basePrice: number
  channelPrices: Record<string, number>
  directPrice: number
  minPrice: number
  maxPrice: number
  hasDiscrepancies: boolean
  discrepancies: Array<{
    channel: string
    price: number
    difference: number
    percentDifference: number
  }>
}

interface ParityData {
  summary: {
    totalRooms: number
    roomsWithDiscrepancies: number
    parityRate: number
    avgDiscrepancy: number
    totalDiscrepancies: number
  }
  channels: Array<{ id: string; name: string; type: string }>
  rooms: ParityRoom[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RateParityView() {
  const { currentHotelId, hotel } = useAppStore()
  const [data, setData] = useState<ParityData | null>(null)
  const [loading, setLoading] = useState(true)

  const currency = hotel?.currency || 'USD'

  const fetchParity = useCallback(async () => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rate-parity?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error(json.error || 'Failed to load parity data')
    } catch (err) {
      console.error('Failed to fetch parity data:', err)
    } finally {
      setLoading(false)
    }
  }, [currentHotelId])

  useEffect(() => {
    fetchParity()
  }, [fetchParity])

  if (!currentHotelId) return null

  const channelNames = data ? data.rooms.length > 0
    ? Object.keys(data.rooms[0].channelPrices).filter((k) => k !== 'Base Price')
    : []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Rate Parity Checker</h2>
          <p className="text-sm text-muted-foreground">
            Compare prices across channels and identify discrepancies
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchParity} disabled={loading}>
          <RefreshCw className={cn('mr-1 h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 rounded-xl mb-2" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-7 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    data.summary.parityRate >= 90 ? 'bg-emerald-50' : data.summary.parityRate >= 70 ? 'bg-amber-50' : 'bg-red-50',
                  )}>
                    <Shield className={cn(
                      'h-5 w-5',
                      data.summary.parityRate >= 90 ? 'text-emerald-600' : data.summary.parityRate >= 70 ? 'text-amber-600' : 'text-red-600',
                    )} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parity Rate</p>
                    <p className={cn(
                      'text-xl font-bold',
                      data.summary.parityRate >= 90 ? 'text-emerald-600' : data.summary.parityRate >= 70 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {data.summary.parityRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rooms</p>
                    <p className="text-xl font-bold">{data.summary.totalRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    data.summary.roomsWithDiscrepancies === 0 ? 'bg-emerald-50' : 'bg-red-50',
                  )}>
                    <AlertTriangle className={cn(
                      'h-5 w-5',
                      data.summary.roomsWithDiscrepancies === 0 ? 'text-emerald-600' : 'text-red-600',
                    )} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discrepancies</p>
                    <p className={cn(
                      'text-xl font-bold',
                      data.summary.roomsWithDiscrepancies === 0 ? 'text-emerald-600' : 'text-red-600',
                    )}>
                      {data.summary.totalDiscrepancies}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                    <AlertTriangle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Discrepancy</p>
                    <p className="text-xl font-bold">{data.summary.avgDiscrepancy}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Comparison by Room</CardTitle>
              <CardDescription>
                Rooms highlighted in red have prices differing more than 5% from direct price
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.rooms.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No rooms found to compare</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-3 py-2 text-left font-medium">Room</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-right font-medium">Base Price</th>
                        {channelNames.map((ch) => (
                          <th key={ch} className="px-3 py-2 text-right font-medium">{ch}</th>
                        ))}
                        <th className="px-3 py-2 text-right font-medium">Min</th>
                        <th className="px-3 py-2 text-right font-medium">Max</th>
                        <th className="px-3 py-2 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rooms.map((room) => (
                        <tr
                          key={room.roomId}
                          className={cn(
                            'border-b last:border-0 transition-colors',
                            room.hasDiscrepancies && 'bg-red-50/50',
                          )}
                        >
                          <td className="px-3 py-2 font-medium">
                            {room.roomNumber} — {room.roomName}
                          </td>
                          <td className="px-3 py-2 capitalize text-muted-foreground">
                            {room.roomType.replace('_', ' ')}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(room.basePrice, currency)}
                          </td>
                          {channelNames.map((ch) => {
                            const price = room.channelPrices[ch]
                            const isDiscrepant = room.discrepancies.some((d) => d.channel === ch)
                            return (
                              <td
                                key={ch}
                                className={cn(
                                  'px-3 py-2 text-right',
                                  isDiscrepant && 'font-semibold text-red-600',
                                )}
                              >
                                {price ? formatCurrency(price, currency) : '—'}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                            {formatCurrency(room.minPrice, currency)}
                          </td>
                          <td className="px-3 py-2 text-right text-red-600 font-medium">
                            {formatCurrency(room.maxPrice, currency)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {room.hasDiscrepancies ? (
                              <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-red-200">
                                {room.discrepancies.length} issue{room.discrepancies.length !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discrepancy Details */}
          {data.rooms.some((r) => r.hasDiscrepancies) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Discrepancy Details
                </CardTitle>
                <CardDescription>Price differences exceeding 5% threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.rooms.filter((r) => r.hasDiscrepancies).flatMap((room) =>
                    room.discrepancies.map((disc, i) => (
                      <div key={`${room.roomId}-${i}`} className="flex items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Room {room.roomNumber} — {room.roomName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {disc.channel}: {formatCurrency(disc.price, currency)} vs Direct {formatCurrency(room.directPrice, currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-sm font-bold',
                            disc.percentDifference > 0 ? 'text-red-600' : 'text-blue-600',
                          )}>
                            {disc.percentDifference > 0 ? '+' : ''}{disc.percentDifference}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(Math.abs(disc.difference), currency)}
                          </p>
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </motion.div>
  )
}
