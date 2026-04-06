'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { mockChannels, type MockChannel } from '@/lib/mock-data'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, React.ElementType> = {
  ota: Globe,
  direct: Globe,
  walk_in: UserCheck,
  phone: Phone,
  website: Globe,
}

const syncMethodLabels: Record<string, string> = {
  ical: 'iCal Sync',
  api: 'API Integration',
  manual: 'Manual',
  none: 'None',
}

export function ChannelsView() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'ota' as MockChannel['type'],
    syncMethod: 'ical' as MockChannel['syncMethod'],
    commission: 0,
  })

  const channels = mockChannels

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
            Manage booking channels and sync settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Link className="mr-2 h-4 w-4" />
            Import iCal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel, idx) => {
          const Icon = typeIcons[channel.type] || Radio
          const lastSyncDate = channel.lastSync
            ? format(parseISO(channel.lastSync), 'MMM d, yyyy HH:mm')
            : 'Never'

          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: channel.color + '15', color: channel.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {channel.type.replace('_', ' ')} Channel
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        channel.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      )}
                    >
                      {channel.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sync Method</span>
                      <p className="font-medium">
                        {syncMethodLabels[channel.syncMethod]}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commission</span>
                      <p className="font-medium">
                        {channel.commission > 0 ? `${channel.commission}%` : 'None'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Last Sync</span>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{lastSyncDate}</span>
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
                          onClick={() => handleCopy(channel.icalUrl, channel.id)}
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
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
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
          onClick={() => setShowAddDialog(true)}
        >
          <CardContent className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add New Channel</span>
          </CardContent>
        </Card>
      </div>

      {/* Import iCal Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import iCal Calendar</DialogTitle>
            <DialogDescription>
              Import availability from an external calendar using its iCal URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>iCal URL</Label>
              <Input
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
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!importUrl}
              onClick={() => {
                setShowImportDialog(false)
                setImportUrl('')
              }}
            >
              Import Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Channel Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Channel</DialogTitle>
            <DialogDescription>
              Connect a new booking channel to your hotel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                placeholder="e.g., Expedia, Hotels.com"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel Type</Label>
                <Select
                  value={newChannel.type}
                  onValueChange={(v) => setNewChannel({ ...newChannel, type: v as MockChannel['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ota">OTA (Online Travel Agency)</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sync Method</Label>
                <Select
                  value={newChannel.syncMethod}
                  onValueChange={(v) => setNewChannel({ ...newChannel, syncMethod: v as MockChannel['syncMethod'] })}
                >
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Commission (%)</Label>
              <Input
                type="number"
                placeholder="15"
                value={newChannel.commission || ''}
                onChange={(e) => setNewChannel({ ...newChannel, commission: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!newChannel.name}
              onClick={() => {
                setShowAddDialog(false)
                setNewChannel({ name: '', type: 'ota', syncMethod: 'ical', commission: 0 })
              }}
            >
              Add Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
