'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Hotel,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  DollarSign,
  Users,
  Shield,
  Save,
  Plus,
  Trash2,
  Crown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { mockHotel } from '@/lib/mock-data'
import { toast } from 'sonner'

const staffMembers = [
  { id: 'staff-1', name: 'Sarah Mitchell', email: 'sarah@paradisecourtlodge.com', role: 'Hotel Manager', status: 'active' },
  { id: 'staff-2', name: 'David Chen', email: 'david@paradisecourtlodge.com', role: 'Front Desk', status: 'active' },
  { id: 'staff-3', name: 'Maria Rodriguez', email: 'maria@paradisecourtlodge.com', role: 'Housekeeping Lead', status: 'active' },
  { id: 'staff-4', name: 'James Wilson', email: 'james@paradisecourtlodge.com', role: 'Maintenance', status: 'inactive' },
]

export function SettingsView() {
  const [hotelSettings, setHotelSettings] = useState({
    name: mockHotel.name,
    description: mockHotel.description,
    address: mockHotel.address,
    city: mockHotel.city,
    country: mockHotel.country,
    phone: mockHotel.phone,
    email: mockHotel.email,
    checkInTime: mockHotel.checkInTime,
    checkOutTime: mockHotel.checkOutTime,
    currency: mockHotel.currency,
  })

  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false)
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Front Desk',
  })

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Hotel Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your hotel details and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hotel className="h-4 w-4" />
                  Hotel Details
                </CardTitle>
                <CardDescription>Basic information about your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hotel Name</Label>
                  <Input
                    value={hotelSettings.name}
                    onChange={(e) => setHotelSettings({ ...hotelSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={hotelSettings.description}
                    onChange={(e) => setHotelSettings({ ...hotelSettings, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={hotelSettings.address}
                    onChange={(e) => setHotelSettings({ ...hotelSettings, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={hotelSettings.city}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={hotelSettings.country}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, country: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </CardTitle>
                <CardDescription>How guests and partners can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={hotelSettings.phone}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={hotelSettings.email}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={hotelSettings.currency}
                    onValueChange={(v) => setHotelSettings({ ...hotelSettings, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Check-in & Check-out Policies
              </CardTitle>
              <CardDescription>Set default times and rules for your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Check-in Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={hotelSettings.checkInTime}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, checkInTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default Check-out Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={hotelSettings.checkOutTime}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, checkOutTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Additional Policies</h4>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Early Check-in Available</p>
                    <p className="text-xs text-muted-foreground">Allow guests to check in before the standard time</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Late Check-out Available</p>
                    <p className="text-xs text-muted-foreground">Allow guests to check out after the standard time</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Auto-confirm Bookings</p>
                    <p className="text-xs text-muted-foreground">Automatically confirm new bookings from OTAs</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Require ID Verification</p>
                    <p className="text-xs text-muted-foreground">Require government ID at check-in</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Policies
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Management */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Staff Management
                  </CardTitle>
                  <CardDescription>Manage team members and their access</CardDescription>
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                  onClick={() => setShowAddStaffDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {staff.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.name}</span>
                          {staff.id === 'staff-1' && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {staff.email} · {staff.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          staff.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        )}
                      >
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      {staff.id !== 'staff-1' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteStaffId(staff.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Staff Dialog */}
          <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>Invite a new team member to manage your hotel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jane@hotel.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Desk">Front Desk</SelectItem>
                      <SelectItem value="Housekeeping Lead">Housekeeping Lead</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setShowAddStaffDialog(false)
                    setNewStaff({ name: '', email: '', role: 'Front Desk' })
                    toast.success('Staff invitation sent')
                  }}
                  disabled={!newStaff.name || !newStaff.email}
                >
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Staff Dialog */}
          <AlertDialog open={!!deleteStaffId} onOpenChange={() => setDeleteStaffId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this staff member? They will lose access to the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => setDeleteStaffId(null)}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Plan */}
        <TabsContent value="plan">
          <div className="max-w-2xl space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-emerald-600" />
                    Professional Plan
                  </CardTitle>
                  <Badge className="bg-emerald-600 text-white">Current Plan</Badge>
                </div>
                <CardDescription>
                  Full-featured hotel management for growing properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$79</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    'Unlimited rooms',
                    'Unlimited bookings',
                    '5 channel connections',
                    'iCal sync',
                    'Guest management',
                    'Reports & analytics',
                    'Staff management (5)',
                    'Email support',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold">Starter</h4>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold">$29</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      <li>Up to 10 rooms</li>
                      <li>2 channel connections</li>
                      <li>Basic reports</li>
                    </ul>
                    <Button variant="outline" className="mt-4 w-full" size="sm">
                      Downgrade
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold">Enterprise</h4>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold">$199</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      <li>Everything in Pro</li>
                      <li>Unlimited channels</li>
                      <li>API access</li>
                      <li>Priority support</li>
                    </ul>
                    <Button variant="outline" className="mt-4 w-full" size="sm">
                      Upgrade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
