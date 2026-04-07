'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Globe,
  Phone,
  UserCheck,
  RefreshCw,
  Copy,
  Plus,
  ExternalLink,
  Link,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Percent,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { api, type ApiChannel } from '@/lib/api'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Constants ──────────────────────────────────────────────────────────────────

const typeIcons: Record<string, React.ElementType> = {
  ota: Globe,
  direct: Globe,
  walkin: UserCheck,
  walk_in: UserCheck,
  website: Globe,
  phone: Phone,
  email: MailIcon,
  agent: UserCheck,
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

const syncMethodLabels: Record<string, string> = {
  ical: 'iCal Sync',
  api: 'API Integration',
  manual: 'Manual',
  none: 'None',
}

const channelTypeLabels: Record<string, string> = {
  ota: 'OTA',
  direct: 'Direct',
  walkin: 'Walk-in',
  walk_in: 'Walk-in',
  website: 'Website',
  phone: 'Phone',
  email: 'Email',
  agent: 'Agent',
}

// ─── Form Data Types ────────────────────────────────────────────────────────────

interface ChannelFormData {
  name: string
  type: string
  syncMethod: string
  icalUrl: string
  commission: number
  isActive: boolean
}

const emptyFormData: ChannelFormData = {
  name: '',
  type: 'ota',
  syncMethod: 'ical',
  icalUrl: '',
  commission: 0,
  isActive: true,
}

function channelToFormData(channel: ApiChannel): ChannelFormData {
  return {
    name: channel.name,
    type: channel.type,
    syncMethod: channel.syncMethod || 'manual',
    icalUrl: channel.icalUrl || '',
    commission: channel.commission || 0,
    isActive: channel.isActive,
  }
}

// ─── Reusable Form Fields ──────────────────────────────────────────────────────

function ChannelFormFields({
  formData,
  setFormData,
}: {
  formData: ChannelFormData
  setFormData: React.Dispatch<React.SetStateAction<ChannelFormData>>
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="channel-name">Channel Name</Label>
        <Input
          id="channel-name"
          placeholder="e.g., Expedia, Hotels.com"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="channel-type">Channel Type</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger id="channel-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ota">OTA (Online Travel Agency)</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="walkin">Walk-in</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="channel-sync">Sync Method</Label>
          <Select
            value={formData.syncMethod}
            onValueChange={(v) => setFormData({ ...formData, syncMethod: v })}
          >
            <SelectTrigger id="channel-sync">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ical">iCal Sync</SelectItem>
              <SelectItem value="api">API Integration</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <AnimatePresence>
        {formData.syncMethod === 'ical' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <Label htmlFor="channel-ical">iCal URL</Label>
              <Input
                id="channel-ical"
                placeholder="https://example.com/calendar.ics"
                value={formData.icalUrl}
                onChange={(e) => setFormData({ ...formData, icalUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Required for iCal sync method
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-2">
        <Label htmlFor="channel-commission">Commission (%)</Label>
        <Input
          id="channel-commission"
          type="number"
          placeholder="15"
          value={formData.commission || ''}
          onChange={(e) => setFormData({ ...formData, commission: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ChannelsView() {
  const { channels, createChannel, updateChannel, deleteChannel, fetchChannels, loading, currentHotelId } = useAppStore()

  useEffect(() => {
    if (currentHotelId) {
      fetchChannels()
    }
  }, [currentHotelId, fetchChannels])

  // ── Dialog State ──
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importChannelId, setImportChannelId] = useState<string | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Form State ──
  const [submitting, setSubmitting] = useState(false)
  const [newChannel, setNewChannel] = useState<ChannelFormData>({ ...emptyFormData })
  const [editChannel, setEditChannel] = useState<ChannelFormData>({ ...emptyFormData })
  const [editChannelId, setEditChannelId] = useState<string | null>(null)
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Sync State ──
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null)
  const [importSubmitting, setImportSubmitting] = useState(false)

  // ── Derived ──
  const deleteChannelData = channels.find((c) => c.id === deleteChannelId)
  const editChannelData = channels.find((c) => c.id === editChannelId)

  // ── Handlers ──
  const handleCopy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddChannel = async () => {
    if (!newChannel.name) return
    setSubmitting(true)
    try {
      const result = await createChannel({
        name: newChannel.name,
        type: newChannel.type,
        syncMethod: newChannel.syncMethod,
        icalUrl: newChannel.icalUrl || undefined,
        commission: newChannel.commission || undefined,
        isActive: true,
      })

      if (result) {
        toast.success('Channel added successfully')
        setShowAddDialog(false)
        setNewChannel({ ...emptyFormData })
      } else {
        toast.error('Failed to add channel. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add channel')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = useCallback((channel: ApiChannel) => {
    setEditChannelId(channel.id)
    setEditChannel(channelToFormData(channel))
    setShowEditDialog(true)
  }, [])

  const handleUpdateChannel = async () => {
    if (!editChannelId || !editChannel.name) return
    setSubmitting(true)
    try {
      const result = await updateChannel(editChannelId, {
        name: editChannel.name,
        type: editChannel.type,
        syncMethod: editChannel.syncMethod,
        icalUrl: editChannel.icalUrl || undefined,
        commission: editChannel.commission || undefined,
        isActive: editChannel.isActive,
      })

      if (result) {
        toast.success('Channel updated successfully')
        setShowEditDialog(false)
        setEditChannelId(null)
        setEditChannel({ ...emptyFormData })
      } else {
        toast.error('Failed to update channel. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update channel')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDelete = useCallback((channel: ApiChannel) => {
    setDeleteChannelId(channel.id)
    setShowDeleteDialog(true)
  }, [])

  const handleDeleteChannel = async () => {
    if (!deleteChannelId) return
    setDeleting(true)
    try {
      const success = await deleteChannel(deleteChannelId)
      if (success) {
        toast.success(`"${deleteChannelData?.name}" has been deleted`)
        setShowDeleteDialog(false)
        setDeleteChannelId(null)
      } else {
        toast.error('Failed to delete channel. It may have existing bookings.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete channel')
    } finally {
      setDeleting(false)
    }
  }

  const handleSyncChannel = useCallback(async (channel: ApiChannel) => {
    if (syncingChannelId) return // Prevent double-click
    if (channel.syncMethod !== 'ical' && channel.syncMethod !== 'api') {
      toast.info(`"${channel.name}" uses manual sync — configure iCal or API integration first.`)
      return
    }

    setSyncingChannelId(channel.id)
    try {
      const result = await api.importChannelICal(channel.id)
      if (result.success) {
        toast.success(`${result.data.channelName}: ${result.data.message}`)
        // Refresh channels to get updated lastSyncAt
        await fetchChannels()
      } else {
        toast.error(result.error || `Failed to sync "${channel.name}"`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to sync "${channel.name}"`)
    } finally {
      setSyncingChannelId(null)
    }
  }, [syncingChannelId, fetchChannels])

  const handleImportICal = async () => {
    if (!importUrl) return
    setImportSubmitting(true)
    try {
      // If a specific channel was selected, use that; otherwise find an ical channel
      let targetChannelId = importChannelId
      if (!targetChannelId) {
        const icalChannel = channels.find((c) => c.syncMethod === 'ical' && c.isActive)
        if (!icalChannel) {
          toast.error('No active iCal channel found. Please add an iCal channel first.')
          setImportSubmitting(false)
          return
        }
        targetChannelId = icalChannel.id
      }

      // First update the channel's iCal URL if it changed
      const channel = channels.find((c) => c.id === targetChannelId)
      if (channel && channel.icalUrl !== importUrl) {
        await updateChannel(targetChannelId, { icalUrl: importUrl })
      }

      const result = await api.importChannelICal(targetChannelId)
      if (result.success) {
        toast.success(`${result.data.channelName}: ${result.data.message}`)
        setShowImportDialog(false)
        setImportUrl('')
        setImportChannelId(null)
        await fetchChannels()
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportSubmitting(false)
    }
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never synced'
    try {
      return formatDistanceToNow(parseISO(lastSyncAt), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Channel Manager</h2>
          <p className="text-sm text-muted-foreground">
            {channels.length} channel{channels.length !== 1 ? 's' : ''} · {channels.filter((c) => c.isActive).length} active
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportChannelId(null); setImportUrl(''); setShowImportDialog(true) }}>
            <Link className="mr-2 h-4 w-4" />
            Import iCal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => { setNewChannel({ ...emptyFormData }); setShowAddDialog(true) }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Channel Cards */}
      {loading.channels && channels.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel, idx) => {
            const Icon = typeIcons[channel.type] || Radio
            const bookingCount = channel._count?.bookings || 0

            return (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Card className="group h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          channel.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-50 text-gray-400',
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{channel.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {channelTypeLabels[channel.type] || channel.type.replace('_', ' ')} Channel
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Action icon buttons — visible on hover */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-0.5"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                            onClick={() => handleOpenEdit(channel)}
                            title="Edit channel"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={() => handleOpenDelete(channel)}
                            title="Delete channel"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            channel.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-red-200 bg-red-50 text-red-700',
                          )}
                        >
                          {channel.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bookings</span>
                        <p className="font-medium flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {bookingCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commission</span>
                        <p className="font-medium flex items-center gap-1">
                          <Percent className="h-3.5 w-3.5" />
                          {channel.commission && channel.commission > 0 ? `${channel.commission}%` : 'None'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sync Method</span>
                        <p className="font-medium">
                          {syncMethodLabels[channel.syncMethod] || channel.syncMethod}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Sync</span>
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className={cn(
                            'h-3 w-3',
                            channel.lastSyncAt ? 'text-emerald-500' : 'text-muted-foreground',
                          )} />
                          <span className="font-medium text-xs">
                            {formatLastSync(channel.lastSyncAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* iCal URL */}
                    {channel.icalUrl && (
                      <div className="rounded-md bg-muted/50 p-2.5">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          iCal Export URL
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="flex-1 truncate text-xs">{channel.icalUrl}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopy(channel.icalUrl!, channel.id)}
                          >
                            {copiedId === channel.id ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenEdit(channel)}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={syncingChannelId === channel.id}
                        onClick={() => handleSyncChannel(channel)}
                      >
                        {syncingChannelId === channel.id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        )}
                        Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {/* Add Channel Placeholder Card */}
          <Card
            className="flex cursor-pointer items-center justify-center border-dashed"
            onClick={() => { setNewChannel({ ...emptyFormData }); setShowAddDialog(true) }}
          >
            <CardContent className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Add New Channel</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Import iCal Dialog ── */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) { setShowImportDialog(false); setImportUrl(''); setImportChannelId(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import iCal Calendar</DialogTitle>
            <DialogDescription>
              Import availability from an external calendar using its iCal URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {channels.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="import-target-channel">Target Channel</Label>
                <Select
                  value={importChannelId || '__auto__'}
                  onValueChange={(v) => setImportChannelId(v === '__auto__' ? null : v)}
                >
                  <SelectTrigger id="import-target-channel">
                    <SelectValue placeholder="Auto-detect iCal channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto__">Auto-detect active iCal channel</SelectItem>
                    {channels
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({channelTypeLabels[c.type] || c.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="import-ical-url">iCal URL</Label>
              <Input
                id="import-ical-url"
                placeholder="https://example.com/calendar.ics"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Make sure the iCal URL is publicly accessible. The calendar will
                be synced periodically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportUrl(''); setImportChannelId(null) }}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!importUrl || importSubmitting}
              onClick={handleImportICal}
            >
              {importSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Calendar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Channel Dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Channel</DialogTitle>
            <DialogDescription>
              Connect a new booking channel to your hotel
            </DialogDescription>
          </DialogHeader>
          <ChannelFormFields formData={newChannel} setFormData={setNewChannel} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={submitting || !newChannel.name}
              onClick={handleAddChannel}
            >
              {submitting ? 'Adding...' : 'Add Channel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Channel Dialog ── */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditDialog(false)
            setEditChannelId(null)
            setEditChannel({ ...emptyFormData })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription>
              Update channel configuration for {editChannelData?.name}
            </DialogDescription>
          </DialogHeader>
          <ChannelFormFields formData={editChannel} setFormData={setEditChannel} />
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <Label htmlFor="edit-active-toggle" className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive channels won&apos;t receive new bookings
              </p>
            </div>
            <Switch
              id="edit-active-toggle"
              checked={editChannel.isActive}
              onCheckedChange={(checked) => setEditChannel({ ...editChannel, isActive: checked })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditChannelId(null) }}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={submitting || !editChannel.name}
              onClick={handleUpdateChannel}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Channel Confirmation ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteChannelData?.name}&quot;</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteChannelData && (deleteChannelData._count?.bookings ?? 0) > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This channel has <strong>{deleteChannelData._count?.bookings} booking(s)</strong>.
                You may want to deactivate it instead of deleting.
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteChannel()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Channel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
