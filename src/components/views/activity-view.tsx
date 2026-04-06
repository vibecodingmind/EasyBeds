'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  FileText,
  CreditCard,
  Bed,
  XCircle,
  CheckCircle2,
  Edit3,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  hotelId: string
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  userAgent: string | null
  description: string | null
  createdAt: string
  user?: { id: string; name: string; email: string; avatarUrl: string | null } | null
}

interface AuditLogDetail extends AuditLog {
  parsedOldValue: unknown
  parsedNewValue: unknown
}

const actionIcons: Record<string, React.ElementType> = {
  create: CheckCircle2,
  update: Edit3,
  delete: XCircle,
  status_change: ArrowRightLeft,
  login: LogIn,
  logout: LogOut,
  payment: CreditCard,
  refund: CreditCard,
}

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  status_change: 'bg-amber-100 text-amber-700 border-amber-200',
  login: 'bg-violet-100 text-violet-700 border-violet-200',
  logout: 'bg-gray-100 text-gray-600 border-gray-200',
  payment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  refund: 'bg-orange-100 text-orange-700 border-orange-200',
}

const entityIcons: Record<string, React.ElementType> = {
  booking: FileText,
  room: Bed,
  guest: User,
  payment: CreditCard,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ActivityView() {
  const { currentHotelId } = useAppStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchLogs = useCallback(async (newOffset = 0) => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        hotelId: currentHotelId,
        limit: String(limit),
        offset: String(newOffset),
      })
      if (entityFilter !== 'all') params.set('entityType', entityFilter)
      if (actionFilter !== 'all') params.set('action', actionFilter)

      const res = await fetch(`/api/audit-logs?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setLogs(json.data.logs)
        setTotal(json.data.pagination.total)
        setOffset(newOffset)
      }
    } catch {
      toast.error('Failed to fetch activity logs')
    } finally {
      setLoading(false)
    }
  }, [currentHotelId, entityFilter, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleViewDetail = async (log: AuditLog) => {
    if (!currentHotelId) return
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/audit-logs/${log.id}?hotelId=${currentHotelId}`)
      const json = await res.json()
      if (json.success) {
        setSelectedLog(json.data)
      }
    } catch {
      toast.error('Failed to fetch log detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const userName = log.user?.name?.toLowerCase() || ''
    const entityType = log.entityType.toLowerCase()
    const entityId = log.entityId?.toLowerCase() || ''
    const description = log.description?.toLowerCase() || ''
    return (
      userName.includes(q) ||
      entityType.includes(q) ||
      entityId.includes(q) ||
      description.includes(q) ||
      log.action.includes(q)
    )
  })

  const hasMore = offset + limit < total

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
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-sm text-muted-foreground">
            Track all changes and actions across your hotel
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchLogs(offset)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, entity, action..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setOffset(0) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setOffset(0) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="status_change">Status Change</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No activity logs found</p>
              <p className="text-xs">Actions will appear here as they happen</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="divide-y">
                {filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || Activity
                  const EntityIcon = entityIcons[log.entityType] || FileText
                  const colorClass = actionColors[log.action] || 'bg-gray-100 text-gray-600 border-gray-200'

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetail(log)}
                    >
                      <div className="mt-0.5">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border', colorClass)}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {log.user?.name || 'System'}
                          </span>
                          <Badge variant="outline" className={cn('text-[10px] capitalize', colorClass)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            <EntityIcon className="mr-1 h-2.5 w-2.5" />
                            {log.entityType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.description || `${log.action} on ${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ''}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(log.createdAt), 'MMM d')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(log.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {hasMore && (
                <div className="border-t p-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(offset + limit)}
                  >
                    Load More ({total - offset - limit} remaining)
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          {loadingDetail ? (
            <div className="py-8 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedLog ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLog.action.replace(/_/g, ' ')}
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedLog.entityType}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedLog.createdAt), "MMMM d, yyyy 'at' HH:mm")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">User</span>
                    <p className="font-medium">{selectedLog.user?.name || 'System'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Action</span>
                    <p className="font-medium capitalize">{selectedLog.action.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entity</span>
                    <p className="font-medium">{selectedLog.entityType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entity ID</span>
                    <p className="font-mono text-xs">{selectedLog.entityId || '—'}</p>
                  </div>
                </div>

                {selectedLog.description && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    {selectedLog.description}
                  </div>
                )}

                {/* Diff View */}
                {(selectedLog.parsedOldValue || selectedLog.parsedNewValue) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      Changes
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedLog.parsedOldValue && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-1 text-[10px] font-medium text-red-600">Before</p>
                          <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                            {typeof selectedLog.parsedOldValue === 'object'
                              ? JSON.stringify(selectedLog.parsedOldValue, null, 2)
                              : String(selectedLog.parsedOldValue)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.parsedNewValue && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="mb-1 text-[10px] font-medium text-emerald-600">After</p>
                          <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                            {typeof selectedLog.parsedNewValue === 'object'
                              ? JSON.stringify(selectedLog.parsedNewValue, null, 2)
                              : String(selectedLog.parsedNewValue)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.ipAddress && (
                  <div className="text-xs text-muted-foreground">
                    IP: {selectedLog.ipAddress}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
