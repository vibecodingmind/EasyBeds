'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit3,
  User,
  StickyNote,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HousekeepingTask {
  id: string
  hotelId: string
  roomId: string
  bookingId: string | null
  assignedTo: string | null
  taskType: string
  priority: string
  status: string
  title: string
  description: string | null
  dueDate: string
  dueTime: string | null
  completedAt: string | null
  notes: string | null
  room?: { id: string; name: string; roomNumber: string; type: string }
  booking?: {
    id: string
    confirmationCode: string
    guest?: { firstName: string; lastName: string }
  }
}

type ColumnKey = 'pending' | 'in_progress' | 'completed'

const COLUMNS: { key: ColumnKey; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'border-amber-300 bg-amber-50/50' },
  { key: 'in_progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50/50' },
  { key: 'completed', label: 'Completed', color: 'border-emerald-300 bg-emerald-50/50' },
]

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-200' },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function HousekeepingView() {
  const { currentHotelId, rooms } = useAppStore()
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [taskNotes, setTaskNotes] = useState('')
  const [newTask, setNewTask] = useState({
    roomId: '',
    title: '',
    taskType: 'clean',
    priority: 'medium',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '10:00',
    description: '',
  })

  const fetchTasks = useCallback(async () => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const res = await api.getHousekeepingTasks(currentHotelId, today)
      if (res.success) {
        setTasks(res.data as HousekeepingTask[])
      }
    } catch {
      toast.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [currentHotelId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleGenerateTasks = async () => {
    if (!currentHotelId) return
    setGenerating(true)
    try {
      const res = await api.bulkGenerateHousekeepingTasks(currentHotelId, { date: format(new Date(), 'yyyy-MM-dd') })
      if (res.success) {
        const data = res.data as { createdCount: number }
        toast.success(
          `Generated ${data.createdCount} task${data.createdCount !== 1 ? 's' : ''}`
        )
        fetchTasks()
      } else {
        toast.error(res.error || 'Failed to generate tasks')
      }
    } catch {
      toast.error('Failed to generate tasks')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateTask = async () => {
    if (!currentHotelId || !newTask.roomId || !newTask.title) {
      toast.error('Room and title are required')
      return
    }
    try {
      const res = await api.createHousekeepingTask(currentHotelId, newTask)
      if (res.success) {
        toast.success('Task created')
        setShowCreateDialog(false)
        setNewTask({
          roomId: '',
          title: '',
          taskType: 'clean',
          priority: 'medium',
          dueDate: format(new Date(), 'yyyy-MM-dd'),
          dueTime: '10:00',
          description: '',
        })
        fetchTasks()
      } else {
        toast.error(res.error || 'Failed to create task')
      }
    } catch {
      toast.error('Failed to create task')
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!currentHotelId) return
    try {
      const res = await api.updateHousekeepingTask(taskId, currentHotelId, { status: newStatus })
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? res.data as HousekeepingTask : t))
        )
        toast.success(`Task moved to ${newStatus.replace(/_/g, ' ')}`)
      } else {
        toast.error(res.error || 'Failed to update task')
      }
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleAddNotes = async () => {
    if (!currentHotelId || !selectedTask) return
    try {
      const res = await api.updateHousekeepingTask(selectedTask.id, currentHotelId, { notes: taskNotes })
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === selectedTask.id ? res.data as HousekeepingTask : t))
        )
        toast.success('Notes updated')
        setShowNotesDialog(false)
        setSelectedTask(null)
      }
    } catch {
      toast.error('Failed to update notes')
    }
  }

  const getColumnTasks = (status: ColumnKey): HousekeepingTask[] => {
    return tasks.filter((t) => {
      if (status === 'completed') return t.status === 'completed' || t.status === 'skipped'
      return t.status === status
    })
  }

  const nextStatusMap: Record<string, string> = {
    pending: 'in_progress',
    in_progress: 'completed',
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
          <h2 className="text-lg font-semibold">Housekeeping</h2>
          <p className="text-sm text-muted-foreground">
            Manage room cleaning tasks and inspections
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateTasks}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Today&apos;s Tasks
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {getColumnTasks('pending').length}
            </p>
            <p className="text-xs text-amber-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {getColumnTasks('in_progress').length}
            </p>
            <p className="text-xs text-blue-600">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {getColumnTasks('completed').length}
            </p>
            <p className="text-xs text-emerald-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <Card key={col.key} className={col.color}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key)
            return (
              <div key={col.key} className={cn('rounded-lg border p-3', col.color)}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-2 pr-2">
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <CheckCircle2 className="mb-2 h-8 w-8 opacity-40" />
                        <p className="text-xs">No tasks</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onViewDetails={() => setSelectedTask(task)}
                          onAddNotes={() => {
                            setSelectedTask(task)
                            setTaskNotes(task.notes || '')
                            setShowNotesDialog(true)
                          }}
                          nextStatus={nextStatusMap[task.status]}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Housekeeping Task</DialogTitle>
            <DialogDescription>Add a new cleaning or inspection task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={newTask.roomId}
                onValueChange={(v) => setNewTask({ ...newTask, roomId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roomNumber} — {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Checkout clean, Deep clean, Inspection"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newTask.taskType}
                  onValueChange={(v) => setNewTask({ ...newTask, taskType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="deep_clean">Deep Clean</SelectItem>
                    <SelectItem value="inspect">Inspect</SelectItem>
                    <SelectItem value="maintenance_repair">Maintenance</SelectItem>
                    <SelectItem value="laundry">Laundry</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Due Time</Label>
                <Input
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Optional description..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreateTask}
              disabled={!newTask.roomId || !newTask.title}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog
        open={!!selectedTask && !showNotesDialog && !showCreateDialog}
        onOpenChange={() => setSelectedTask(null)}
      >
        <DialogContent>
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTask.title}
                  <Badge
                    variant="outline"
                    className={cn('text-xs', priorityConfig[selectedTask.priority]?.className)}
                  >
                    {selectedTask.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Room {selectedTask.room?.roomNumber || 'N/A'} &bull;{' '}
                  {selectedTask.taskType.replace(/_/g, ' ')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Room</span>
                    <p className="font-medium">
                      {selectedTask.room?.roomNumber} — {selectedTask.room?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due</span>
                    <p className="font-medium">
                      {format(parseISO(selectedTask.dueDate), 'MMM d')}
                      {selectedTask.dueTime && ` at ${selectedTask.dueTime}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Guest</span>
                    <p className="font-medium">
                      {selectedTask.booking?.guest
                        ? `${selectedTask.booking.guest.firstName} ${selectedTask.booking.guest.lastName}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium capitalize">
                      {selectedTask.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                {selectedTask.description && (
                  <div className="rounded-lg border p-3 text-sm">
                    {selectedTask.description}
                  </div>
                )}
                {selectedTask.notes && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                    {selectedTask.notes}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {nextStatusMap[selectedTask.status] && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        handleStatusChange(
                          selectedTask.id,
                          nextStatusMap[selectedTask.status]
                        )
                        setSelectedTask(null)
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Mark {nextStatusMap[selectedTask.status].replace(/_/g, ' ')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTaskNotes(selectedTask.notes || '')
                      setShowNotesDialog(true)
                    }}
                  >
                    <StickyNote className="mr-2 h-4 w-4" />
                    Notes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>Add notes for this housekeeping task</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              rows={4}
              placeholder="Enter notes..."
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onStatusChange,
  onViewDetails,
  onAddNotes,
  nextStatus,
}: {
  task: HousekeepingTask
  onStatusChange: (id: string, status: string) => void
  onViewDetails: () => void
  onAddNotes: () => void
  nextStatus?: string
}) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <div
      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onViewDetails}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px]', priority.className)}>
            {priority.label}
          </Badge>
          <span className="text-[10px] capitalize text-muted-foreground">
            {task.taskType.replace(/_/g, ' ')}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddNotes() }}>
              <StickyNote className="mr-2 h-3.5 w-3.5" />
              Add Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails() }}>
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              View Details
            </DropdownMenuItem>
            {nextStatus && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus) }}>
                <ArrowRight className="mr-2 h-3.5 w-3.5" />
                Mark {nextStatus.replace(/_/g, ' ')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'cancelled') }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="mb-2 text-sm font-medium leading-tight">{task.title}</h4>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">
            Room {task.room?.roomNumber || 'N/A'}
          </span>
          {task.booking?.guest && (
            <span>— {task.booking.guest.firstName} {task.booking.guest.lastName}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>
            {format(parseISO(task.dueDate), 'MMM d')}
            {task.dueTime && ` at ${task.dueTime}`}
          </span>
        </div>
      </div>

      {nextStatus && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange(task.id, nextStatus)
          }}
        >
          <ArrowRight className="mr-1 h-3 w-3" />
          {nextStatus.replace(/_/g, ' ')}
        </Button>
      )}
    </div>
  )
}
