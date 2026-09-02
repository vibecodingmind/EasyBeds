import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db';
import { auditService } from './server/auditService';
import { BookingComProvider } from './server/channels/BookingComProvider';
import { AirbnbProvider } from './server/channels/AirbnbProvider';
import { ExpediaProvider, AgodaProvider, HostelworldProvider, NobedsProvider } from './server/channels/AdditionalProviders';
import { ICalProvider } from './server/channels/ICalProvider';
import { ChannelProvider } from './server/channels/ChannelProvider';
import { Reservation, Room, HousekeepingTask, MaintenanceWorkOrder, FolioItem, PaymentTransaction, Message, SyncLog, OperationsTask, Guest, FinancialExpense } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Provider registry
const providers: Record<string, ChannelProvider> = {
  booking_com: new BookingComProvider(),
  airbnb: new AirbnbProvider(),
  expedia: new ExpediaProvider(),
  agoda: new AgodaProvider(),
  hostelworld: new HostelworldProvider(),
  nobeds: new NobedsProvider(),
  ical: new ICalProvider(),
};

// Tenant extraction helper
function getTenantId(req: Request): string {
  return (req.headers['x-tenant-id'] as string) || 'tenant-azure';
}

function getPropertyId(req: Request): string {
  return (req.headers['x-property-id'] as string) || 'prop-azure-bay';
}

// ----------------------------------------------------
// 1. TENANTS & USERS & ROLES & PERMISSIONS
// ----------------------------------------------------
app.get('/api/tenants', (req: Request, res: Response) => {
  res.json(db.tenants);
});

// Current user profile with resolved permissions and scopes
app.get('/api/auth/current-user', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const userId = (req.headers['x-user-id'] as string) || req.query.userId as string || 'usr-owner-1';
  
  let user = db.users.find(u => u.id === userId);
  if (!user) {
    user = db.users.find(u => u.tenantId === tenantId) || db.users[0];
  }

  const permissions = db.getUserPermissions(user.id);
  const roleDef = db.roles.find(r => r.id === user.roleId || r.code === user.role);

  res.json({
    user,
    roleDefinition: roleDef,
    permissions,
    scope: user.scope || {
      tenantId: user.tenantId,
      propertyIds: ['*'],
      outletIds: ['*']
    }
  });
});

app.get('/api/auth/permissions', (req: Request, res: Response) => {
  res.json(db.permissions);
});

app.get('/api/auth/roles', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const roles = db.roles.filter(r => r.isSystem || r.tenantId === tenantId);
  res.json(roles);
});

app.post('/api/auth/roles', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, code, description, permissions, defaultLandingView, allowedOutlets } = req.body;

  if (!name || !permissions) {
    return res.status(400).json({ error: 'Name and permissions are required' });
  }

  const newRole = db.createRole({
    name,
    code: code || `CUSTOM_${name.toUpperCase().replace(/\s+/g, '_')}`,
    description: description || 'Custom hotel role',
    category: 'custom',
    isSystem: false,
    tenantId,
    permissions: permissions || [],
    defaultLandingView: defaultLandingView || 'dashboard',
    allowedOutlets: allowedOutlets || ['*'],
  });

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
    userName: 'Elena Rostova (Owner)',
    action: 'ROLE_CREATED',
    details: `Created custom role '${newRole.name}' with ${newRole.permissions.length} granular permissions.`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(newRole);
});

app.put('/api/auth/roles/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    const updated = db.updateRole(req.params.id, req.body);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
      userName: 'Elena Rostova (Owner)',
      action: 'ROLE_UPDATED',
      details: `Updated permissions and configuration for role '${updated.name}'.`,
      timestamp: new Date().toISOString(),
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/auth/roles/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    db.deleteRole(req.params.id);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
      userName: 'Elena Rostova (Owner)',
      action: 'ROLE_DELETED',
      details: `Deleted custom role ID ${req.params.id}.`,
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/users', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const users = db.users.filter(u => u.tenantId === tenantId || u.role === 'SUPER_ADMIN');
  res.json(users);
});

app.post('/api/users', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, email, role, roleId, department, phone, scope } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const newUser = db.createUser({
    name,
    email,
    role,
    roleId,
    tenantId,
    department: department || 'General',
    phone,
    scope: scope || {
      tenantId,
      propertyIds: ['*'],
      outletIds: ['*'],
      department: department || 'general'
    },
    active: true,
    avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=120&q=80`,
    lastLoginAt: new Date().toISOString()
  });

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
    userName: 'Elena Rostova (Owner)',
    action: 'USER_CREATED',
    details: `Added new user ${newUser.name} (${newUser.email}) with role '${newUser.role}'.`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    const updated = db.updateUser(req.params.id, req.body);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
      userName: 'Elena Rostova (Owner)',
      action: 'USER_UPDATED',
      details: `Updated profile, role, or scopes for user ${updated.name} (${updated.email}).`,
      timestamp: new Date().toISOString(),
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    db.deleteUser(req.params.id);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      userId: (req.headers['x-user-id'] as string) || 'usr-owner-1',
      userName: 'Elena Rostova (Owner)',
      action: 'USER_DEACTIVATED',
      details: `Deactivated user account ID ${req.params.id}.`,
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ----------------------------------------------------
// 2. PROPERTIES & POLICIES
// ----------------------------------------------------
app.get('/api/properties', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const properties = db.properties.filter(p => p.tenantId === tenantId);
  res.json(properties);
});

app.post('/api/properties', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const newProp = {
    ...req.body,
    id: `prop-${Date.now()}`,
    tenantId,
  };
  db.properties.push(newProp);
  res.json(newProp);
});

app.put('/api/properties/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const idx = db.properties.findIndex(p => p.id === req.params.id && p.tenantId === tenantId);
  if (idx === -1) return res.status(404).json({ error: 'Property not found' });
  db.properties[idx] = { ...db.properties[idx], ...req.body };
  res.json(db.properties[idx]);
});

// ----------------------------------------------------
// 3. ROOM TYPES & INVENTORY & RATE PLANS
// ----------------------------------------------------
app.get('/api/room-types', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const roomTypes = db.roomTypes.filter(rt => rt.tenantId === tenantId && (!propertyId || rt.propertyId === propertyId));
  res.json(roomTypes);
});

app.post('/api/room-types', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const newRt = {
    ...req.body,
    id: `rt-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || propertyId,
  };
  db.roomTypes.push(newRt);
  res.json(newRt);
});

app.get('/api/rate-plans', (req: Request, res: Response) => {
  res.json([
    {
      id: 'rate-standard',
      name: 'Standard Flexible Rate (BAR)',
      code: 'BAR',
      description: 'Standard Best Available Rate with flexible 24h cancellation.',
      mealPlan: 'room_only',
      cancellationPolicy: 'flexible',
      minStay: 1,
      multiplier: 1.0,
      active: true,
    },
    {
      id: 'rate-nonref',
      name: 'Non-Refundable (10% Off)',
      code: 'NONREF',
      description: 'Discounted non-refundable rate prepaid at booking.',
      mealPlan: 'room_only',
      cancellationPolicy: 'non_refundable',
      minStay: 1,
      multiplier: 0.90,
      active: true,
    },
    {
      id: 'rate-bed-breakfast',
      name: 'Bed & Breakfast Package',
      code: 'BB',
      description: 'Includes full gourmet oceanfront breakfast per guest daily.',
      mealPlan: 'breakfast_included',
      cancellationPolicy: 'flexible',
      minStay: 1,
      multiplier: 1.18,
      active: true,
    },
    {
      id: 'rate-weekly',
      name: 'Weekly Extended Stay (7+ Nights)',
      code: 'WEEKLY',
      description: 'Extended stay discount for bookings of 7 nights or longer.',
      mealPlan: 'room_only',
      cancellationPolicy: 'strict',
      minStay: 7,
      multiplier: 0.85,
      active: true,
    },
  ]);
});

// ----------------------------------------------------
// 4. PHYSICAL ROOMS & STATUSES
// ----------------------------------------------------
app.get('/api/rooms', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const rooms = db.rooms.filter(r => r.tenantId === tenantId && (!propertyId || r.propertyId === propertyId));
  res.json(rooms);
});

app.post('/api/rooms', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const newRoom: Room = {
    ...req.body,
    id: `rm-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || propertyId,
    isOccupied: false,
    status: req.body.status || 'clean',
  };
  db.rooms.push(newRoom);
  res.json(newRoom);
});

app.patch('/api/rooms/:id/status', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const room = db.rooms.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = req.body.status || room.status;
  if (req.body.notes !== undefined) room.notes = req.body.notes;
  if (req.body.cleanedBy) {
    room.cleanedBy = req.body.cleanedBy;
    room.lastCleanedAt = new Date().toISOString();
  }
  res.json(room);
});

app.patch('/api/rooms/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const room = db.rooms.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  Object.assign(room, req.body);
  res.json(room);
});

// ----------------------------------------------------
// 5. GUESTS CRM
// ----------------------------------------------------
app.get('/api/guests', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const guests = db.guests.filter(g => g.tenantId === tenantId);
  res.json(guests);
});

app.post('/api/guests', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const newGuest: Guest = {
    ...req.body,
    id: `gst-${Date.now()}`,
    tenantId,
    totalStays: req.body.totalStays || 0,
    lifetimeSpend: req.body.lifetimeSpend || 0,
    vip: req.body.vip || false,
    createdAt: new Date().toISOString(),
  };
  db.guests.push(newGuest);
  res.json(newGuest);
});

// ----------------------------------------------------
// 6. RESERVATIONS & FOLIOS
// ----------------------------------------------------
app.get('/api/reservations', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const status = req.query.status as string;
  const search = (req.query.search as string)?.toLowerCase();

  let list = db.reservations.filter(r => r.tenantId === tenantId && (!propertyId || r.propertyId === propertyId));

  if (status && status !== 'all') {
    list = list.filter(r => r.status === status);
  }

  if (search) {
    list = list.filter(r => 
      r.reservationCode.toLowerCase().includes(search) ||
      r.guest.firstName.toLowerCase().includes(search) ||
      r.guest.lastName.toLowerCase().includes(search) ||
      r.guest.email?.toLowerCase().includes(search) ||
      r.channelReservationId?.toLowerCase().includes(search)
    );
  }

  res.json(list);
});

app.post('/api/reservations', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = req.body.propertyId || getPropertyId(req);

  // Auto guest resolution or creation
  let guest = db.guests.find(g => g.id === req.body.guestId && g.tenantId === tenantId);
  if (!guest && req.body.guest) {
    guest = {
      id: `gst-${Date.now()}`,
      tenantId,
      firstName: req.body.guest.firstName || 'Guest',
      lastName: req.body.guest.lastName || 'User',
      email: req.body.guest.email || '',
      phone: req.body.guest.phone || '',
      nationality: req.body.guest.nationality,
      vip: false,
      totalStays: 1,
      lifetimeSpend: req.body.totalAmount || 0,
      createdAt: new Date().toISOString(),
    };
    db.guests.push(guest);
  }

  const roomType = db.roomTypes.find(rt => rt.id === req.body.roomTypeId);
  const nightlyRate = req.body.nightlyRate || roomType?.baseRate || 200;
  
  // Calculate nights
  const checkInDate = new Date(req.body.checkIn);
  const checkOutDate = new Date(req.body.checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const totalNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const subtotal = nightlyRate * totalNights;
  const taxAmount = Number((subtotal * 0.13).toFixed(2));
  const feeAmount = 85.0;
  const totalAmount = Number((subtotal + taxAmount + feeAmount).toFixed(2));
  const paidAmount = Number(req.body.paidAmount || 0);

  const initialFolio: FolioItem[] = [
    {
      id: `f-${Date.now()}-1`,
      date: req.body.checkIn,
      description: `Room Accommodations (${totalNights} night${totalNights > 1 ? 's' : ''})`,
      category: 'room',
      amount: subtotal,
      quantity: totalNights,
    },
    {
      id: `f-${Date.now()}-2`,
      date: req.body.checkIn,
      description: 'Lodging & Tourism Tax (13%)',
      category: 'tax',
      amount: taxAmount,
      quantity: 1,
    },
    {
      id: `f-${Date.now()}-3`,
      date: req.body.checkIn,
      description: 'Resort & Service Fee',
      category: 'fee',
      amount: feeAmount,
      quantity: 1,
    }
  ];

  const initialPayments: PaymentTransaction[] = paidAmount > 0 ? [
    {
      id: `p-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: paidAmount,
      method: req.body.paymentMethod || 'credit_card',
      reference: `INIT-PAY-${Date.now().toString().slice(-4)}`
    }
  ] : [];

  const newRes: Reservation = {
    id: `res-${Date.now()}`,
    tenantId,
    propertyId,
    reservationCode: `RES-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    guestId: guest?.id || 'gst-1',
    guest: guest || db.guests[0],
    roomTypeId: req.body.roomTypeId,
    roomId: req.body.roomId || undefined,
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    adults: Number(req.body.adults || 1),
    children: Number(req.body.children || 0),
    source: req.body.source || 'direct',
    channelReservationId: req.body.channelReservationId,
    status: req.body.status || 'confirmed',
    paymentStatus: paidAmount >= totalAmount ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'unpaid'),
    nightlyRate,
    totalNights,
    subtotal,
    taxAmount,
    feeAmount,
    totalAmount,
    paidAmount,
    balanceDue: Math.max(0, Number((totalAmount - paidAmount).toFixed(2))),
    folio: initialFolio,
    payments: initialPayments,
    specialRequests: req.body.specialRequests,
    internalNotes: req.body.internalNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reservations.unshift(newRes);

  // If assigned room immediately, update room status
  if (newRes.roomId && newRes.status === 'checked_in') {
    const room = db.rooms.find(r => r.id === newRes.roomId);
    if (room) {
      room.isOccupied = true;
      room.currentGuestName = `${newRes.guest.firstName} ${newRes.guest.lastName}`;
    }
  }

  // Trigger Outbound Channel Inventory Push Event in background
  const syncLog: SyncLog = {
    id: `log-${Date.now()}`,
    tenantId,
    propertyId,
    channelId: 'booking_com',
    direction: 'outbound',
    action: 'push_availability',
    status: 'success',
    recordsAffected: 1,
    payloadSummary: `Live reservation ${newRes.reservationCode} deducted 1 unit from OTA inventory pool`,
    timestamp: new Date().toISOString()
  };
  db.syncLogs.unshift(syncLog);

  res.status(201).json(newRes);
});

app.patch('/api/reservations/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const reservation = db.reservations.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

  const oldStatus = reservation.status;
  const oldRoomId = reservation.roomId;

  Object.assign(reservation, req.body, { updatedAt: new Date().toISOString() });

  // Handle Check-in / Check-out room updates
  if (reservation.status === 'checked_in' && reservation.roomId) {
    const room = db.rooms.find(r => r.id === reservation.roomId);
    if (room) {
      room.isOccupied = true;
      room.currentGuestName = `${reservation.guest.firstName} ${reservation.guest.lastName}`;
    }
  } else if (reservation.status === 'checked_out' && oldStatus === 'checked_in' && oldRoomId) {
    const room = db.rooms.find(r => r.id === oldRoomId);
    if (room) {
      room.isOccupied = false;
      room.currentGuestName = undefined;
      room.status = 'dirty'; // Mark dirty upon checkout for housekeeping!
      // Create housekeeping task
      db.housekeepingTasks.unshift({
        id: `hk-${Date.now()}`,
        tenantId,
        propertyId: reservation.propertyId,
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomTypeName: db.roomTypes.find(rt => rt.id === room.roomTypeId)?.name || 'Room',
        taskType: 'full_clean',
        priority: 'high',
        status: 'pending',
        dueDate: new Date().toISOString(),
        notes: `Turnover clean following checkout of ${reservation.guest.lastName} (${reservation.reservationCode})`
      });
    }
  }

  res.json(reservation);
});

app.post('/api/reservations/:id/folio', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const reservation = db.reservations.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

  const item: FolioItem = {
    id: `f-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    description: req.body.description || 'Incidental Charge',
    category: req.body.category || 'other',
    amount: Number(req.body.amount || 0),
    quantity: Number(req.body.quantity || 1),
  };

  reservation.folio.push(item);
  reservation.totalAmount = Number((reservation.totalAmount + item.amount * item.quantity).toFixed(2));
  reservation.balanceDue = Number((reservation.totalAmount - reservation.paidAmount).toFixed(2));
  reservation.paymentStatus = reservation.balanceDue <= 0 ? 'paid' : 'partially_paid';

  res.json(reservation);
});

app.post('/api/reservations/:id/payments', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const reservation = db.reservations.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

  const payment: PaymentTransaction = {
    id: `p-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    amount: Number(req.body.amount || 0),
    method: req.body.method || 'credit_card',
    reference: req.body.reference || `PAY-${Date.now().toString().slice(-4)}`,
    notes: req.body.notes,
  };

  reservation.payments.push(payment);
  reservation.paidAmount = Number((reservation.paidAmount + payment.amount).toFixed(2));
  reservation.balanceDue = Math.max(0, Number((reservation.totalAmount - reservation.paidAmount).toFixed(2)));
  reservation.paymentStatus = reservation.balanceDue <= 0 ? 'paid' : 'partially_paid';

  res.json(reservation);
});

// ----------------------------------------------------
// 7. CALENDAR / TAPE CHART DATA
// ----------------------------------------------------
app.get('/api/calendar/tape-chart', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const startDate = req.query.startDate as string || '2026-08-30';
  const endDate = req.query.endDate as string || '2026-09-14';

  const rooms = db.rooms.filter(r => r.tenantId === tenantId && r.propertyId === propertyId);
  const roomTypes = db.roomTypes.filter(rt => rt.tenantId === tenantId && rt.propertyId === propertyId);
  const reservations = db.reservations.filter(r => 
    r.tenantId === tenantId && 
    r.propertyId === propertyId &&
    r.status !== 'cancelled' &&
    r.checkIn <= endDate &&
    r.checkOut >= startDate
  );

  res.json({
    rooms,
    roomTypes,
    reservations,
    startDate,
    endDate,
  });
});

// ----------------------------------------------------
// 8. CHANNEL MANAGER & SYNC ENGINE
// ----------------------------------------------------
app.get('/api/channels', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const connections = db.channelConnections.filter(c => c.tenantId === tenantId && c.propertyId === propertyId);
  res.json(connections);
});

app.patch('/api/channels/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const conn = db.channelConnections.find(c => c.id === req.params.id && c.tenantId === tenantId);
  if (!conn) return res.status(404).json({ error: 'Channel connection not found' });
  
  if (req.body.isActive !== undefined) {
    conn.isActive = Boolean(req.body.isActive);
  }
  if (req.body.hotelId) {
    conn.hotelIdOnChannel = req.body.hotelId;
    conn.isConnected = true;
    conn.syncStatus = 'synced';
  }
  if (req.body.apiKey) {
    conn.apiKeyMasked = `${req.body.apiKey.slice(0, 4)}••••••••${req.body.apiKey.slice(-4)}`;
    conn.isConnected = true;
    conn.syncStatus = 'synced';
  }
  if (req.body.syncStatus) conn.syncStatus = req.body.syncStatus;
  
  res.json(conn);
});

app.post('/api/channels/:id/connect', async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const conn = db.channelConnections.find(c => c.id === req.params.id && c.tenantId === tenantId);
  if (!conn) return res.status(404).json({ error: 'Channel connection not found' });

  const provider = providers[conn.channelId];
  if (!provider) return res.status(400).json({ error: 'Unsupported channel provider' });

  const authResult = await provider.authenticate(req.body);
  if (!authResult.valid) {
    return res.status(400).json({ success: false, error: authResult.message });
  }

  conn.isConnected = true;
  conn.syncStatus = 'synced';
  conn.lastSyncTime = new Date().toISOString();
  if (req.body.accountIdentifier) conn.accountIdentifier = req.body.accountIdentifier;
  if (req.body.hotelIdOnChannel) conn.hotelIdOnChannel = req.body.hotelIdOnChannel;
  if (req.body.apiKey) conn.apiKeyMasked = `${req.body.apiKey.slice(0, 4)}••••••••${req.body.apiKey.slice(-4)}`;
  if (req.body.iCalImportUrl) conn.iCalImportUrl = req.body.iCalImportUrl;

  const log: SyncLog = {
    id: `log-${Date.now()}`,
    tenantId,
    propertyId: conn.propertyId,
    channelId: conn.channelId,
    direction: 'outbound',
    action: 'push_availability',
    status: 'success',
    recordsAffected: 1,
    payloadSummary: `Channel ${conn.channelName} connected and authenticated successfully`,
    timestamp: new Date().toISOString()
  };
  db.syncLogs.unshift(log);

  res.json({ success: true, connection: conn, message: authResult.message });
});

app.post('/api/channels/:id/sync', async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const conn = db.channelConnections.find(c => c.id === req.params.id && c.tenantId === tenantId);
  if (!conn) return res.status(404).json({ error: 'Channel not found' });

  const provider = providers[conn.channelId];
  if (!provider) return res.status(400).json({ error: 'Unsupported provider' });

  // Simulate pushing live rates & availability
  const syncResult = await provider.pushAvailability(
    { hotelIdOnChannel: conn.hotelIdOnChannel, apiKey: 'live_key' },
    [{ hotelId: conn.hotelIdOnChannel || '1', roomTypeId: 'all', dateRange: { start: '2026-09-01', end: '2026-10-01' }, availableCount: 14 }]
  );

  conn.lastSyncTime = new Date().toISOString();
  conn.syncStatus = syncResult.success ? 'synced' : 'error';

  const log: SyncLog = {
    id: `log-${Date.now()}`,
    tenantId,
    propertyId: conn.propertyId,
    channelId: conn.channelId,
    direction: 'outbound',
    action: 'push_availability',
    status: syncResult.success ? 'success' : 'failed',
    recordsAffected: syncResult.recordsProcessed,
    payloadSummary: syncResult.message,
    timestamp: new Date().toISOString()
  };
  db.syncLogs.unshift(log);

  res.json({ success: syncResult.success, log, connection: conn });
});

app.get('/api/channels/mappings', (req: Request, res: Response) => {
  res.json(db.channelRoomMappings);
});

app.post('/api/channels/mappings', (req: Request, res: Response) => {
  const newMapping = {
    id: `crm-${Date.now()}`,
    ...req.body
  };
  db.channelRoomMappings.push(newMapping);
  res.json(newMapping);
});

app.get('/api/channels/logs', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const logs = db.syncLogs.filter(l => l.tenantId === tenantId).slice(0, 50);
  res.json(logs);
});

// ----------------------------------------------------
// 9. REAL RFC 5545 iCAL FEED ENDPOINT
// ----------------------------------------------------
app.get('/api/ical/:tenantId/:propertyId/:roomTypeId/calendar.ics', (req: Request, res: Response) => {
  const { tenantId, propertyId, roomTypeId } = req.params;
  const prop = db.properties.find(p => p.id === propertyId && p.tenantId === tenantId);
  const rt = db.roomTypes.find(r => r.id === roomTypeId && r.tenantId === tenantId);

  if (!prop || !rt) {
    return res.status(404).send('Calendar Feed Not Found');
  }

  const reservations = db.reservations
    .filter(r => r.tenantId === tenantId && r.propertyId === propertyId && r.roomTypeId === roomTypeId)
    .map(r => ({
      code: r.reservationCode,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      status: r.status
    }));

  const icsData = ICalProvider.generateICalFeed(prop.name, rt.name, reservations);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${rt.code || 'calendar'}.ics"`);
  res.send(icsData);
});

// ----------------------------------------------------
// 10. HOUSEKEEPING & MAINTENANCE WORKFLOWS
// ----------------------------------------------------
app.get('/api/housekeeping/tasks', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const tasks = db.housekeepingTasks.filter(t => t.tenantId === tenantId && t.propertyId === propertyId);
  res.json(tasks);
});

app.post('/api/housekeeping/tasks', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const newTask: HousekeepingTask = {
    id: `hk-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || getPropertyId(req),
    roomId: req.body.roomId,
    roomNumber: req.body.roomNumber,
    roomTypeName: req.body.roomTypeName,
    taskType: req.body.taskType || 'full_clean',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'pending',
    assignedStaffName: req.body.assignedStaffName,
    dueDate: req.body.dueDate || new Date().toISOString(),
    notes: req.body.notes,
  };
  db.housekeepingTasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/housekeeping/tasks/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const task = db.housekeepingTasks.find(t => t.id === req.params.id && t.tenantId === tenantId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body);
  res.json(task);
});

app.get('/api/maintenance', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const list = db.maintenanceWorkOrders.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(list);
});

app.get('/api/maintenance/tickets', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const list = db.maintenanceWorkOrders.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(list);
});

app.get('/api/maintenance/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const list = db.maintenanceWorkOrders.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(list);
});

app.post('/api/maintenance', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = req.body.propertyId || getPropertyId(req);

  const workOrder: MaintenanceWorkOrder = {
    id: `maint-${Date.now()}`,
    tenantId,
    propertyId,
    roomId: req.body.roomId,
    roomNumber: req.body.roomNumber || (db.rooms.find(r => r.id === req.body.roomId)?.roomNumber || 'Room'),
    title: req.body.title,
    category: req.body.category || 'other',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'open',
    roomBlocked: Boolean(req.body.roomBlocked || req.body.isOutOfOrder),
    reportedBy: req.body.reportedBy || 'Staff',
    assignedTo: req.body.assignedTo,
    costEstimate: Number(req.body.costEstimate || 0),
    reportedAt: new Date().toISOString(),
    description: req.body.description || '',
  };

  db.maintenanceWorkOrders.unshift(workOrder);

  // If room blocked, update room status
  if (workOrder.roomId && workOrder.roomBlocked) {
    const room = db.rooms.find(r => r.id === workOrder.roomId);
    if (room) {
      room.status = 'maintenance';
      room.notes = `Blocked: ${workOrder.title}`;
    }
  }

  res.status(201).json(workOrder);
});

app.post('/api/maintenance/tickets', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = req.body.propertyId || getPropertyId(req);

  const workOrder: MaintenanceWorkOrder = {
    id: `maint-${Date.now()}`,
    tenantId,
    propertyId,
    roomId: req.body.roomId,
    roomNumber: req.body.roomNumber || (db.rooms.find(r => r.id === req.body.roomId)?.roomNumber || 'Room'),
    title: req.body.title,
    category: req.body.category || 'other',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'open',
    roomBlocked: Boolean(req.body.roomBlocked || req.body.isOutOfOrder),
    reportedBy: req.body.reportedBy || 'Staff',
    assignedTo: req.body.assignedTo,
    costEstimate: Number(req.body.costEstimate || 0),
    reportedAt: new Date().toISOString(),
    description: req.body.description || '',
  };

  db.maintenanceWorkOrders.unshift(workOrder);

  if (workOrder.roomId && workOrder.roomBlocked) {
    const room = db.rooms.find(r => r.id === workOrder.roomId);
    if (room) {
      room.status = 'maintenance';
      room.notes = `Blocked: ${workOrder.title}`;
    }
  }

  res.status(201).json(workOrder);
});

app.patch('/api/maintenance/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const order = db.maintenanceWorkOrders.find(m => m.id === req.params.id && m.tenantId === tenantId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  Object.assign(order, req.body);
  if (order.status === 'resolved') {
    order.resolvedAt = new Date().toISOString();
    if (order.roomId) {
      const room = db.rooms.find(r => r.id === order.roomId);
      if (room && room.status === 'maintenance') {
        room.status = 'dirty'; // Ready for housekeeping inspection
        room.notes = undefined;
      }
    }
  }
  res.json(order);
});

app.patch('/api/maintenance/tickets/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const order = db.maintenanceWorkOrders.find(m => m.id === req.params.id && m.tenantId === tenantId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  Object.assign(order, req.body);
  if (order.status === 'resolved') {
    order.resolvedAt = new Date().toISOString();
    if (order.roomId) {
      const room = db.rooms.find(r => r.id === order.roomId);
      if (room && room.status === 'maintenance') {
        room.status = 'dirty';
        room.notes = undefined;
      }
    }
  }
  res.json(order);
});

// ----------------------------------------------------
// 11. FINANCE & EXPENSES & REPORTS
// ----------------------------------------------------
app.get('/api/finance/invoices', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const reservations = db.reservations.filter(r => r.tenantId === tenantId && r.propertyId === propertyId);

  const invoices = reservations.map((r, idx) => {
    const total = r.totalAmount || 0;
    const paid = r.paidAmount || 0;
    const balance = Math.max(0, total - paid);
    let status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void' = 'issued';
    if (balance === 0 && total > 0) status = 'paid';
    else if (paid > 0 && balance > 0) status = 'partially_paid';
    else if (r.status === 'cancelled') status = 'void';

    return {
      id: `inv-${r.id}`,
      tenantId: r.tenantId,
      propertyId: r.propertyId,
      reservationId: r.id,
      invoiceNumber: `INV-2026-${String(1001 + idx).padStart(4, '0')}`,
      guestName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}`.trim() : 'Guest',
      issueDate: r.checkIn,
      dueDate: r.checkOut,
      subtotal: Number((total * 0.88).toFixed(2)),
      taxTotal: Number((total * 0.12).toFixed(2)),
      total: total,
      paidAmount: paid,
      balanceDue: balance,
      status,
    };
  });

  res.json(invoices);
});

app.get('/api/finance/expenses', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const expenses = db.expenses.filter(e => e.tenantId === tenantId && e.propertyId === propertyId);
  res.json(expenses);
});

app.post('/api/finance/expenses', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const newExp: FinancialExpense = {
    id: `exp-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || getPropertyId(req),
    category: req.body.category || 'other',
    amount: Number(req.body.amount || 0),
    date: req.body.date || new Date().toISOString().split('T')[0],
    vendor: req.body.vendor || 'Vendor',
    paymentMethod: req.body.paymentMethod || 'Bank Transfer',
    reference: req.body.reference,
    notes: req.body.notes,
  };
  db.expenses.unshift(newExp);
  res.status(201).json(newExp);
});

app.get('/api/reports/analytics', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);

  const rooms = db.rooms.filter(r => r.tenantId === tenantId && r.propertyId === propertyId);
  const reservations = db.reservations.filter(r => r.tenantId === tenantId && r.propertyId === propertyId);

  const totalRooms = rooms.length || 1;
  const occupiedRooms = rooms.filter(r => r.isOccupied).length;
  const occupancyRate = Number(((occupiedRooms / totalRooms) * 100).toFixed(1));

  const totalRoomRevenue = reservations.reduce((acc, r) => acc + r.subtotal, 0);
  const totalNights = reservations.reduce((acc, r) => acc + r.totalNights, 0) || 1;
  const adr = Number((totalRoomRevenue / totalNights).toFixed(2));
  const revPar = Number(((adr * occupancyRate) / 100).toFixed(2));

  // Today metrics (2026-09-01)
  const today = '2026-09-01';
  const todayArrivals = reservations.filter(r => r.checkIn === today && r.status !== 'cancelled').length;
  const todayDepartures = reservations.filter(r => r.checkOut === today && r.status !== 'cancelled').length;
  const inHouseGuests = reservations.filter(r => r.status === 'checked_in').length;

  const monthRevenue = reservations
    .filter(r => r.checkIn.startsWith('2026-09') || r.checkIn.startsWith('2026-08'))
    .reduce((acc, r) => acc + r.totalAmount, 0);

  // Channel breakdown
  const channelMap: Record<string, { count: number; revenue: number }> = {};
  reservations.forEach(r => {
    if (!channelMap[r.source]) channelMap[r.source] = { count: 0, revenue: 0 };
    channelMap[r.source].count += 1;
    channelMap[r.source].revenue += r.totalAmount;
  });

  const channelBreakdown = Object.keys(channelMap).map(src => ({
    source: src as any,
    count: channelMap[src].count,
    revenue: Number(channelMap[src].revenue.toFixed(2)),
    percentage: Number(((channelMap[src].revenue / (monthRevenue || 1)) * 100).toFixed(1))
  }));

  const revenueLast7Days = [
    { date: 'Aug 26', revenue: 1980, occupancy: 75 },
    { date: 'Aug 27', revenue: 2340, occupancy: 82 },
    { date: 'Aug 28', revenue: 3100, occupancy: 91 },
    { date: 'Aug 29', revenue: 3850, occupancy: 96 },
    { date: 'Aug 30', revenue: 3420, occupancy: 88 },
    { date: 'Aug 31', revenue: 2900, occupancy: 80 },
    { date: 'Sep 01', revenue: 3260, occupancy: 85 },
  ];

  res.json({
    totalRooms,
    occupiedRooms,
    occupancyRate,
    adr,
    revPar,
    todayArrivals,
    todayDepartures,
    inHouseGuests,
    monthRevenue: Number(monthRevenue.toFixed(2)),
    projectedMonthRevenue: Number((monthRevenue * 1.8).toFixed(2)),
    channelBreakdown,
    revenueLast7Days,
  });
});

// ----------------------------------------------------
// 12. MESSAGES & REVIEWS & TASKS
// ----------------------------------------------------
app.get('/api/messages', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const messages = db.messages.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(messages);
});

app.post('/api/messages', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const msg: Message = {
    id: `msg-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || getPropertyId(req),
    reservationId: req.body.reservationId,
    guestId: req.body.guestId,
    guestName: req.body.guestName || 'Guest',
    channel: req.body.channel || 'direct',
    sender: 'hotel',
    content: req.body.content,
    timestamp: new Date().toISOString(),
    read: true,
  };
  db.messages.push(msg);
  res.status(201).json(msg);
});

app.get('/api/reviews', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const reviews = db.reviews.filter(r => r.tenantId === tenantId && r.propertyId === propertyId);
  res.json(reviews);
});

app.post('/api/reviews/:id/respond', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const review = db.reviews.find(r => r.id === req.params.id && r.tenantId === tenantId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  review.hotelResponse = req.body.hotelResponse;
  review.responseDate = new Date().toISOString().split('T')[0];
  review.status = 'published';
  res.json(review);
});

app.get('/api/tasks', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = (req.query.propertyId as string) || getPropertyId(req);
  const tasks = db.operationsTasks.filter(t => t.tenantId === tenantId && t.propertyId === propertyId);
  res.json(tasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const newTask: OperationsTask = {
    id: `task-${Date.now()}`,
    tenantId,
    propertyId: req.body.propertyId || getPropertyId(req),
    title: req.body.title,
    department: req.body.department || 'front_desk',
    assignedTo: req.body.assignedTo || 'Staff',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'todo',
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    relatedReservationId: req.body.relatedReservationId,
  };
  db.operationsTasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const task = db.operationsTasks.find(t => t.id === req.params.id && t.tenantId === tenantId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body);
  res.json(task);
});

// ----------------------------------------------------
// 13. SAAS SUPER ADMIN & SUBSCRIPTIONS
// ----------------------------------------------------
app.get('/api/admin/platform', (req: Request, res: Response) => {
  const totalTenants = db.tenants.length;
  const totalProperties = db.properties.length;
  const totalRooms = db.rooms.length;
  const totalReservations = db.reservations.length;
  const totalSyncLogs = db.syncLogs.length;

  res.json({
    totalTenants,
    totalProperties,
    totalRooms,
    totalReservations,
    totalSyncLogs,
    tenants: db.tenants,
    systemHealth: 'OPERATIONAL_OPTIMAL',
    channelGateways: {
      booking_com: 'ONLINE',
      airbnb: 'ONLINE',
      expedia: 'ONLINE',
      agoda: 'STANDBY',
      hostelworld: 'STANDBY',
      nobeds_openapi: 'ONLINE',
      ical_rfc5545: 'ONLINE'
    }
  });
});

app.post('/api/admin/subscription', (req: Request, res: Response) => {
  const { tenantId, planTier } = req.body;
  const tenant = db.tenants.find(t => t.id === tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  tenant.subscriptionTier = planTier;
  if (planTier === 'enterprise') {
    tenant.maxProperties = 20;
    tenant.maxRooms = 300;
  } else if (planTier === 'professional') {
    tenant.maxProperties = 3;
    tenant.maxRooms = 50;
  } else {
    tenant.maxProperties = 1;
    tenant.maxRooms = 15;
  }
  res.json(tenant);
});

// ====================================================
// 17. MODULAR OS & MODULE REGISTRY APIs
// ====================================================

// GET /api/modules - List all modules with entitlement and activation status for current tenant
app.get('/api/modules', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);

  const modulesWithStatus = db.modules.map(mod => {
    const isEntitled = db.isModuleEntitled(tenantId, mod.code);
    const isEnabled = db.isModuleEnabled(tenantId, propertyId, mod.code);
    const activation = db.tenantActivations.find(a =>
      a.tenantId === tenantId &&
      a.moduleCode === mod.code &&
      (!a.propertyId || a.propertyId === propertyId)
    );

    return {
      ...mod,
      isEntitled,
      isEnabled,
      status: activation ? activation.status : (isEntitled ? 'AVAILABLE' : 'LOCKED'),
      configuration: activation?.configuration || db.getDefaultModuleConfig(mod.code),
    };
  });

  res.json(modulesWithStatus);
});

// GET /api/modules/entitlements - Get current tenant entitlement and limits
app.get('/api/modules/entitlements', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const entitlement = db.getTenantEntitlement(tenantId);
  res.json(entitlement);
});

// GET /api/modules/addons - List available subscription add-ons
app.get('/api/modules/addons', (req: Request, res: Response) => {
  res.json(db.addons);
});

// POST /api/modules/addons/subscribe - Subscribe to an addon
app.post('/api/modules/addons/subscribe', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { addonCode } = req.body;
  const addon = db.addons.find(a => a.code === addonCode);
  if (!addon) return res.status(404).json({ error: 'Add-on not found' });

  // Auto enable the modules included in the addon
  addon.moduleCodes.forEach(code => {
    db.enableModule(tenantId, undefined, code, 'usr-admin-1');
  });

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    userId: 'usr-admin-1',
    userName: 'Tenant Administrator',
    action: 'ADDON_SUBSCRIBED',
    details: `Subscribed to ${addon.name} ($${addon.monthlyPrice}/mo). Activated modules: ${addon.moduleCodes.join(', ')}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, addon });
});

// POST /api/modules/enable - Enable a module
app.post('/api/modules/enable', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { moduleCode, applyTenantWide } = req.body;

  const targetPropertyId = applyTenantWide ? undefined : propertyId;
  const result = db.enableModule(tenantId, targetPropertyId, moduleCode, 'usr-admin-1');

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ success: true, message: `Module '${moduleCode}' enabled successfully.` });
});

// POST /api/modules/disable - Disable a module
app.post('/api/modules/disable', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { moduleCode, applyTenantWide } = req.body;

  const targetPropertyId = applyTenantWide ? undefined : propertyId;
  const result = db.disableModule(tenantId, targetPropertyId, moduleCode, 'usr-admin-1');

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ success: true, message: `Module '${moduleCode}' disabled successfully.` });
});

// POST /api/modules/config - Update module config
app.post('/api/modules/config', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { moduleCode, configuration } = req.body;

  const updated = db.updateModuleConfig(tenantId, propertyId, moduleCode, configuration, 'usr-admin-1');
  res.json({ success: true, configuration: updated.configuration });
});

// ====================================================
// 18. FOOD & BEVERAGE (RESTAURANT, BAR, KITCHEN, KDS)
// ====================================================

// GET /api/fnb/tables - List dining tables
app.get('/api/fnb/tables', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tables = db.diningTables.filter(t => t.propertyId === propertyId);
  res.json(tables);
});

// GET /api/fnb/menu - List menu items
app.get('/api/fnb/menu', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const menu = db.menuItems.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(menu);
});

// POST /api/fnb/menu - Add menu item
app.post('/api/fnb/menu', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { outletId, category, name, description, price, costPrice, taxRate, station, dietaryTags, modifierGroups } = req.body;

  const newItem = {
    id: `menu-${Date.now()}`,
    tenantId,
    propertyId,
    outletId: outletId || 'restaurant-main',
    category: category || 'Mains',
    name,
    description: description || '',
    price: Number(price) || 0,
    costPrice: Number(costPrice) || 0,
    taxRate: Number(taxRate) || 0.08,
    station: station || 'hot_kitchen',
    isAvailable: true,
    dietaryTags: dietaryTags || [],
    modifierGroups: modifierGroups || [],
  };

  db.menuItems.push(newItem);
  res.status(201).json(newItem);
});

// GET /api/fnb/orders - List restaurant & bar orders
app.get('/api/fnb/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const orders = db.restaurantOrders.filter(o => o.tenantId === tenantId && o.propertyId === propertyId);
  res.json(orders);
});

// POST /api/fnb/orders - Create restaurant/bar order
app.post('/api/fnb/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const {
    outletId,
    outletName,
    orderType,
    tableId,
    tableNumber,
    guestId,
    guestName,
    reservationId,
    roomId,
    roomNumber,
    items,
    serverName,
  } = req.body;

  const subtotal = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
  const taxAmount = Number((subtotal * 0.08).toFixed(2));
  const serviceCharge = Number((subtotal * 0.10).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount + serviceCharge).toFixed(2));

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const orderItems = items.map((it: any, idx: number) => ({
    id: `oit-${Date.now()}-${idx}`,
    menuItemId: it.menuItemId,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
    modifiers: it.modifiers || [],
    specialInstructions: it.specialInstructions || '',
    station: it.station || 'hot_kitchen',
    status: 'preparing' as const,
  }));

  const order: any = {
    id: orderId,
    orderNumber,
    tenantId,
    propertyId,
    outletId: outletId || 'restaurant-main',
    outletName: outletName || 'Azure Grand Dining',
    orderType: orderType || 'dine_in',
    tableId,
    tableNumber,
    guestId,
    guestName,
    reservationId,
    roomId,
    roomNumber,
    items: orderItems,
    subtotal,
    taxAmount,
    serviceCharge,
    discountAmount: 0,
    totalAmount,
    paymentStatus: 'unpaid',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    serverName: serverName || 'Staff Member',
  };

  db.restaurantOrders.unshift(order);

  // Update table status if tableId is provided
  if (tableId) {
    const table = db.diningTables.find(t => t.id === tableId);
    if (table) {
      table.status = 'occupied';
      table.currentOrderId = orderId;
      table.currentGuests = items.length || 2;
    }
  }

  // Auto generate KDS ticket for kitchen stations
  const kitchenItems = orderItems.filter((it: any) => it.station !== 'bar');
  if (kitchenItems.length > 0) {
    const kdsTicket: any = {
      id: `kds-${Date.now()}`,
      orderId,
      orderNumber,
      propertyId,
      outletName: order.outletName,
      destination: tableNumber ? `Table ${tableNumber}${roomNumber ? ` (Room ${roomNumber})` : ''}` : `Takeaway / Bar`,
      station: 'all',
      items: kitchenItems.map((ki: any) => ({
        id: ki.id,
        name: ki.name,
        quantity: ki.quantity,
        specialInstructions: ki.specialInstructions,
        status: 'preparing',
      })),
      status: 'in_progress',
      serverName: order.serverName,
      createdAt: new Date().toISOString(),
      timerMinutes: 0,
      priority: 'normal',
    };
    db.kdsTickets.unshift(kdsTicket);
  }

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    propertyId,
    userId: 'usr-fd-1',
    userName: order.serverName,
    action: 'ORDER_CREATED',
    details: `Created Order #${orderNumber} (${order.outletName}) - Total: $${totalAmount.toFixed(2)}`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(order);
});

// POST /api/fnb/orders/:id/charge-room - Post order bill to Guest Room Folio
app.post('/api/fnb/orders/:id/charge-room', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { id } = req.params;
  const { reservationId } = req.body;

  const order = db.restaurantOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const targetResId = reservationId || order.reservationId;
  if (!targetResId) {
    return res.status(400).json({ error: 'No active reservation specified for room charge.' });
  }

  try {
    const updatedRes = db.chargeRoomFolio(
      tenantId,
      propertyId,
      targetResId,
      `${order.outletName} Check #${order.orderNumber}`,
      'fnb',
      order.totalAmount,
      1
    );

    order.paymentStatus = 'room_charged';
    order.status = 'completed';
    order.reservationId = targetResId;

    // Free up table
    if (order.tableId) {
      const table = db.diningTables.find(t => t.id === order.tableId);
      if (table && table.currentOrderId === order.id) {
        table.status = 'available';
        table.currentOrderId = undefined;
        table.currentGuests = 0;
      }
    }

    res.json({ success: true, order, reservation: updatedRes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/fnb/orders/:id/pay - Settle order via direct payment
app.post('/api/fnb/orders/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  const order = db.restaurantOrders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.paymentStatus = 'paid';
  order.status = 'completed';

  // Free up table
  if (order.tableId) {
    const table = db.diningTables.find(t => t.id === order.tableId);
    if (table && table.currentOrderId === order.id) {
      table.status = 'available';
      table.currentOrderId = undefined;
      table.currentGuests = 0;
    }
  }

  res.json({ success: true, order });
});

// GET /api/kitchen/kds - Kitchen display tickets
app.get('/api/kitchen/kds', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tickets = db.kdsTickets.filter(k => k.propertyId === propertyId && k.status !== 'completed');
  res.json(tickets);
});

// POST /api/kitchen/kds/:id/bump - Bump ticket to next stage
app.post('/api/kitchen/kds/:id/bump', (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = db.kdsTickets.find(k => k.id === id);
  if (!ticket) return res.status(404).json({ error: 'KDS Ticket not found' });

  if (ticket.status === 'in_progress') {
    ticket.status = 'ready';
    ticket.items.forEach(it => { it.status = 'ready'; });
  } else if (ticket.status === 'ready') {
    ticket.status = 'completed';
    ticket.items.forEach(it => { it.status = 'served'; });
  }

  res.json(ticket);
});

// ====================================================
// 19. SWIMMING POOL & LEISURE HUB APIs
// ====================================================

// GET /api/pool/facilities - Pool facility info
app.get('/api/pool/facilities', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const pools = db.poolFacilities.filter(p => p.propertyId === propertyId);
  res.json(pools);
});

// GET /api/pool/tickets - Active day passes & guest check-ins
app.get('/api/pool/tickets', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tickets = db.poolTickets.filter(t => t.propertyId === propertyId);
  res.json(tickets);
});

// POST /api/pool/checkin - Check in guest or external visitor
app.post('/api/pool/checkin', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tenantId = getTenantId(req);
  const {
    type,
    holderName,
    partySize,
    roomId,
    roomNumber,
    guestId,
    reservationId,
    towelsIssued,
    paymentMethod,
    amountPaid,
  } = req.body;

  const ticketNumber = `POOL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const newTicket = {
    id: `pt-${Date.now()}`,
    ticketNumber,
    propertyId,
    type: type || 'hotel_guest',
    holderName,
    partySize: Number(partySize) || 1,
    roomId,
    roomNumber,
    guestId,
    reservationId,
    checkInTime: new Date().toISOString(),
    amountPaid: Number(amountPaid) || 0,
    paymentMethod: paymentMethod || (type === 'hotel_guest' ? 'free_inhouse' : 'card'),
    towelsIssued: Number(towelsIssued) || 1,
    towelsReturned: 0,
    status: 'active' as const,
  };

  db.poolTickets.unshift(newTicket);

  // Update pool facility occupancy
  const facility = db.poolFacilities.find(p => p.propertyId === propertyId);
  if (facility) {
    facility.currentOccupancy = Math.min(facility.maxCapacity, facility.currentOccupancy + newTicket.partySize);
  }

  // If external visitor paid via room charge or amount needs posting
  if (type === 'external_visitor' && paymentMethod === 'room_charge' && reservationId && amountPaid > 0) {
    db.chargeRoomFolio(tenantId, propertyId, reservationId, `Pool Day Pass (${holderName})`, 'other', amountPaid, 1);
  }

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    propertyId,
    userId: 'usr-fd-1',
    userName: 'Pool Attendant',
    action: 'POOL_PASS_ISSUED',
    details: `Issued Pool Ticket #${ticketNumber} for ${holderName} (${newTicket.partySize} guests, ${newTicket.towelsIssued} towels)`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(newTicket);
});

// POST /api/pool/tickets/:id/checkout - Check out party and return towels
app.post('/api/pool/tickets/:id/checkout', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const { id } = req.params;
  const { towelsReturned } = req.body;

  const ticket = db.poolTickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Pool ticket not found' });

  ticket.status = 'checked_out';
  ticket.checkOutTime = new Date().toISOString();
  ticket.towelsReturned = Number(towelsReturned) ?? ticket.towelsIssued;

  // Decrease facility occupancy
  const facility = db.poolFacilities.find(p => p.propertyId === propertyId);
  if (facility) {
    facility.currentOccupancy = Math.max(0, facility.currentOccupancy - ticket.partySize);
  }

  res.json({ success: true, ticket });
});

// GET /api/pool/water-logs - Water quality chemical logs
app.get('/api/pool/water-logs', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const logs = db.poolWaterLogs.filter(w => w.propertyId === propertyId);
  res.json(logs);
});

// POST /api/pool/water-logs - Record water test
app.post('/api/pool/water-logs', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tenantId = getTenantId(req);
  const {
    poolId,
    testedBy,
    phLevel,
    freeChlorinePpm,
    totalChlorinePpm,
    waterTemperatureC,
    clarity,
    chemicalDosageAdded,
    notes,
  } = req.body;

  const ph = Number(phLevel) || 7.4;
  const freeCl = Number(freeChlorinePpm) || 2.0;
  const isCompliant = ph >= 7.2 && ph <= 7.8 && freeCl >= 1.0 && freeCl <= 3.0;

  const log = {
    id: `pwl-${Date.now()}`,
    propertyId,
    poolId: poolId || 'pool-main',
    testedAt: new Date().toISOString(),
    testedBy: testedBy || 'Duty Pool Technician',
    phLevel: ph,
    freeChlorinePpm: freeCl,
    totalChlorinePpm: Number(totalChlorinePpm) || (freeCl + 0.2),
    waterTemperatureC: Number(waterTemperatureC) || 28.0,
    clarity: clarity || 'crystal_clear',
    chemicalDosageAdded: chemicalDosageAdded || 'None',
    notes: notes || '',
    isCompliant,
  };

  db.poolWaterLogs.unshift(log);

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    propertyId,
    userId: 'usr-eng-1',
    userName: log.testedBy,
    action: 'POOL_WATER_LOGGED',
    details: `Water quality tested: pH ${ph}, Chlorine ${freeCl}ppm (Compliant: ${isCompliant ? 'YES' : 'NO'})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(log);
});

// ====================================================
// 20. MULTI-LOCATION INVENTORY & PURCHASING APIs
// ====================================================

// GET /api/inventory/locations - Multi-location list
app.get('/api/inventory/locations', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const locations = db.inventoryLocations.filter(l => l.propertyId === propertyId);
  res.json(locations);
});

// GET /api/inventory/products - Inventory products
app.get('/api/inventory/products', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const products = db.inventoryProducts.filter(p => p.tenantId === tenantId && p.propertyId === propertyId);
  res.json(products);
});

// POST /api/inventory/products - Create product
app.post('/api/inventory/products', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const {
    sku,
    name,
    category,
    unit,
    currentStock,
    minStockLevel,
    targetStockLevel,
    costPerUnit,
    supplierId,
    supplierName,
    locationId,
    locationName,
  } = req.body;

  const newProduct = {
    id: `prod-${Date.now()}`,
    tenantId,
    propertyId,
    sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
    name,
    category: category || 'food_ingredients',
    unit: unit || 'units',
    currentStock: Number(currentStock) || 0,
    minStockLevel: Number(minStockLevel) || 5,
    targetStockLevel: Number(targetStockLevel) || 20,
    costPerUnit: Number(costPerUnit) || 0,
    supplierId,
    supplierName,
    locationId: locationId || 'loc-wh',
    locationName: locationName || 'Main Central Warehouse',
  };

  db.inventoryProducts.push(newProduct);
  res.status(201).json(newProduct);
});

// GET /api/inventory/movements - Stock movement logs
app.get('/api/inventory/movements', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const movements = db.stockMovements.filter(m => m.propertyId === propertyId);
  res.json(movements);
});

// POST /api/inventory/adjust - Stock adjustment / consumption / waste
app.post('/api/inventory/adjust', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tenantId = getTenantId(req);
  const {
    productId,
    type,
    quantityChange,
    notes,
    reference,
    performedBy,
  } = req.body;

  const product = db.inventoryProducts.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantityChange);
  const costValue = Math.abs(qty * product.costPerUnit);

  try {
    const movement = db.recordStockMovement(
      propertyId,
      productId,
      type || 'ADJUSTMENT',
      qty,
      costValue,
      performedBy || 'Inventory Manager',
      { reference, notes }
    );

    db.addAuditLog({
      id: `aud-${Date.now()}`,
      tenantId,
      propertyId,
      userId: 'usr-inv-1',
      userName: performedBy || 'Inventory Manager',
      action: 'STOCK_ADJUSTED',
      details: `${type} of ${qty} ${product.unit} on ${product.name} (Ref: ${reference || 'Manual'})`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, movement, currentStock: product.currentStock });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/inventory/suppliers - Suppliers directory
app.get('/api/inventory/suppliers', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const suppliers = db.suppliers.filter(s => s.tenantId === tenantId);
  res.json(suppliers);
});

// POST /api/inventory/suppliers - Add supplier
app.post('/api/inventory/suppliers', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { name, contactPerson, email, phone, categories, paymentTerms, address, leadTimeDays } = req.body;

  const newSupplier = {
    id: `sup-${Date.now()}`,
    tenantId,
    name,
    contactPerson: contactPerson || '',
    email: email || '',
    phone: phone || '',
    categories: categories || ['food_ingredients'],
    paymentTerms: paymentTerms || 'Net 30',
    address: address || '',
    leadTimeDays: Number(leadTimeDays) || 2,
    active: true,
  };

  db.suppliers.push(newSupplier);
  res.status(201).json(newSupplier);
});

// GET /api/inventory/purchase-orders - Purchase orders
app.get('/api/inventory/purchase-orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const pos = db.purchaseOrders.filter(p => p.tenantId === tenantId && p.propertyId === propertyId);
  res.json(pos);
});

// POST /api/inventory/purchase-orders - Create purchase order
app.post('/api/inventory/purchase-orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const {
    supplierId,
    supplierName,
    destinationLocationId,
    destinationLocationName,
    items,
    expectedDeliveryDate,
    notes,
  } = req.body;

  const subtotal = items.reduce((sum: number, it: any) => sum + (it.orderedQty * it.unitPrice), 0);
  const taxAmount = Number((subtotal * 0.08).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const po = {
    id: `po-${Date.now()}`,
    poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    tenantId,
    propertyId,
    supplierId,
    supplierName,
    destinationLocationId: destinationLocationId || 'loc-wh',
    destinationLocationName: destinationLocationName || 'Main Central Warehouse',
    status: 'submitted' as const,
    items: items.map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      orderedQty: Number(it.orderedQty),
      receivedQty: 0,
      unit: it.unit || 'units',
      unitPrice: Number(it.unitPrice),
      totalPrice: Number((it.orderedQty * it.unitPrice).toFixed(2)),
    })),
    subtotal,
    taxAmount,
    shippingFee: 0,
    totalAmount,
    expectedDeliveryDate: expectedDeliveryDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    createdBy: 'Purchasing Officer',
    notes: notes || '',
  };

  db.purchaseOrders.unshift(po);
  res.status(201).json(po);
});

// POST /api/inventory/purchase-orders/:id/receive - Receive PO into stock
app.post('/api/inventory/purchase-orders/:id/receive', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tenantId = getTenantId(req);
  const { id } = req.params;

  const po = db.purchaseOrders.find(p => p.id === id);
  if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

  po.status = 'received';
  po.receivedAt = new Date().toISOString();

  // Deplete and update inventory stock
  po.items.forEach(it => {
    it.receivedQty = it.orderedQty;
    db.recordStockMovement(
      propertyId,
      it.productId,
      'PURCHASE',
      it.orderedQty,
      it.totalPrice,
      'Receiving Bay Clerk',
      { reference: po.poNumber, notes: `Received against PO #${po.poNumber}` }
    );
  });

  db.addAuditLog({
    id: `aud-${Date.now()}`,
    tenantId,
    propertyId,
    userId: 'usr-inv-1',
    userName: 'Receiving Officer',
    action: 'PO_RECEIVED',
    details: `Goods received for PO #${po.poNumber} from ${po.supplierName}. Stock levels automatically updated.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, po });
});

// ====================================================
// 21. UNIVERSAL FOLIO & AUDIT LOG APIs
// ====================================================

// POST /api/folio/charge - Generic folio charge from any operational module
app.post('/api/folio/charge', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const { reservationId, description, category, amount, quantity } = req.body;

  try {
    const reservation = db.chargeRoomFolio(
      tenantId,
      propertyId,
      reservationId,
      description,
      category || 'other',
      Number(amount),
      Number(quantity) || 1
    );

    res.json({ success: true, reservation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/audit-logs - System & security audit logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const logs = db.auditLogs.filter(a => a.tenantId === tenantId && (!a.propertyId || a.propertyId === propertyId));
  res.json(logs);
});

app.get('/api/modules/audit-logs', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const logs = db.auditLogs.filter(a => a.tenantId === tenantId && (!a.propertyId || a.propertyId === propertyId));
  res.json(logs);
});

// Restaurant & POS Aliases
app.get('/api/restaurant/tables', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tables = db.diningTables.filter(t => t.propertyId === propertyId);
  res.json(tables);
});

app.get('/api/restaurant/menu', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const menu = db.menuItems.filter(m => m.tenantId === tenantId && m.propertyId === propertyId);
  res.json(menu);
});

app.get('/api/restaurant/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const orders = db.restaurantOrders.filter(o => o.tenantId === tenantId && o.propertyId === propertyId);
  res.json(orders);
});

app.post('/api/restaurant/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const {
    outletId,
    outletName,
    orderType,
    tableId,
    tableNumber,
    guestId,
    guestName,
    reservationId,
    roomId,
    roomNumber,
    items,
    serverName,
  } = req.body;

  const subtotal = (items || []).reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
  const taxAmount = Number((subtotal * 0.08).toFixed(2));
  const serviceCharge = Number((subtotal * 0.10).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount + serviceCharge).toFixed(2));

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const orderItems = (items || []).map((it: any, idx: number) => ({
    id: `oit-${Date.now()}-${idx}`,
    menuItemId: it.menuItemId,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
    modifiers: it.modifiers || [],
    specialInstructions: it.specialInstructions || '',
    station: it.station || 'hot_kitchen',
    status: 'preparing' as const,
  }));

  const order: any = {
    id: orderId,
    orderNumber,
    tenantId,
    propertyId,
    outletId: outletId || 'restaurant-main',
    outletName: outletName || 'Azure Grand Dining',
    orderType: orderType || 'dine_in',
    tableId,
    tableNumber,
    guestId,
    guestName,
    reservationId,
    roomId,
    roomNumber,
    items: orderItems,
    subtotal,
    taxAmount,
    serviceCharge,
    discountAmount: 0,
    totalAmount,
    paymentStatus: 'unpaid',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    serverName: serverName || 'Staff Member',
  };

  db.restaurantOrders.unshift(order);

  if (tableId) {
    const table = db.diningTables.find(t => t.id === tableId);
    if (table) {
      table.status = 'occupied';
      table.currentOrderId = orderId;
      table.currentGuests = (items || []).length || 2;
    }
  }

  res.status(201).json(order);
});

// Kitchen KDS Aliases
app.get('/api/kds/tickets', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const tickets = db.kdsTickets.filter(k => k.propertyId === propertyId && k.status !== 'completed');
  res.json(tickets);
});

// Pool Aliases
app.get('/api/pool/facility', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const pools = db.poolFacilities.filter(p => p.propertyId === propertyId);
  res.json(pools[0] || null);
});

app.post('/api/pool/check-in', (req: Request, res: Response) => {
  const propertyId = getPropertyId(req);
  const {
    type,
    holderName,
    partySize,
    roomId,
    roomNumber,
    guestId,
    reservationId,
    towelsIssued,
    paymentMethod,
    amountPaid,
  } = req.body;

  const ticketNumber = `POOL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const newTicket = {
    id: `pt-${Date.now()}`,
    ticketNumber,
    propertyId,
    type: type || 'hotel_guest',
    holderName: holderName || 'Guest',
    partySize: Number(partySize) || 1,
    roomId,
    roomNumber,
    guestId,
    reservationId,
    checkInTime: new Date().toISOString(),
    amountPaid: Number(amountPaid) || 0,
    paymentMethod: paymentMethod || (type === 'hotel_guest' ? 'free_inhouse' : 'card'),
    towelsIssued: Number(towelsIssued) || 1,
    towelsReturned: 0,
    status: 'active' as const,
  };

  db.poolTickets.unshift(newTicket);

  const facility = db.poolFacilities.find(p => p.propertyId === propertyId);
  if (facility) {
    facility.currentOccupancy = Math.min(facility.maxCapacity, facility.currentOccupancy + newTicket.partySize);
  }

  res.status(201).json(newTicket);
});

// Purchasing Aliases
app.get('/api/purchasing/orders', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const propertyId = getPropertyId(req);
  const pos = db.purchaseOrders.filter(p => p.tenantId === tenantId && p.propertyId === propertyId);
  res.json(pos);
});

// =========================================================================
// 12. SAAS PLATFORM ADMINISTRATION & AUDITED HOTEL ACCESS ROUTES
// =========================================================================

// --- Hotel Access Session Management ---

app.post('/api/platform/hotel-access/enter', (req: Request, res: Response) => {
  const actorUserId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const { targetTenantId, reason, notes } = req.body;

  if (!targetTenantId || !reason) {
    return res.status(400).json({ error: 'Target tenant ID and mandatory reason are required to access hotel context.' });
  }

  try {
    const session = db.startHotelAccessSession({
      actorUserId,
      targetTenantId,
      reason,
      notes,
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/platform/hotel-access/exit', (req: Request, res: Response) => {
  const actorUserId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const { sessionId } = req.body;

  let session = sessionId ? db.activeHotelAccessSessions.find(s => s.sessionId === sessionId) : null;
  if (!session) {
    session = db.getActiveHotelAccessSession(actorUserId);
  }

  if (!session) {
    return res.json({ success: true, message: 'No active hotel access session was found to terminate.' });
  }

  const auditLog = db.endHotelAccessSession(session.sessionId);
  res.json({
    success: true,
    message: `Exited hotel context for '${session.targetTenantName}'. Returned to SaaS Platform context.`,
    auditLog,
  });
});

app.get('/api/platform/hotel-access/current', (req: Request, res: Response) => {
  const actorUserId = (req.headers['x-user-id'] as string) || req.query.userId as string || 'usr-admin-1';
  const session = db.getActiveHotelAccessSession(actorUserId);
  res.json({ session });
});

app.get('/api/platform/hotel-access/sessions', (req: Request, res: Response) => {
  res.json(db.activeHotelAccessSessions);
});

// --- SaaS Platform Administration Modules ---

app.get('/api/platform/metrics', (req: Request, res: Response) => {
  const metrics = db.getPlatformMetrics();
  res.json(metrics);
});

app.get('/api/platform/tenants', (req: Request, res: Response) => {
  const tenants = db.getPlatformTenantsDetailed();
  res.json(tenants);
});

app.post('/api/platform/tenants', (req: Request, res: Response) => {
  const actorUserId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const { name, slug, subscriptionTier, maxProperties, maxRooms, ownerEmail, ownerName } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Tenant name and slug are required' });
  }

  const tenantId = `tenant-${slug.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;
  const newTenant = {
    id: tenantId,
    name,
    slug,
    subscriptionTier: subscriptionTier || 'professional',
    subscriptionStatus: 'active' as const,
    maxProperties: maxProperties || 3,
    maxRooms: maxRooms || 100,
    createdAt: new Date().toISOString(),
  };

  db.tenants.push(newTenant);

  // Auto-create default property
  const propId = `prop-${tenantId}-main`;
  db.properties.push({
    id: propId,
    tenantId,
    name: `${name} (Main Property)`,
    code: slug.toUpperCase().slice(0, 4),
    address: '100 Hospitality Way',
    city: 'San Francisco',
    country: 'United States',
    postalCode: '94103',
    phone: '+1 555-0100',
    email: ownerEmail || `info@${slug}.com`,
    currency: 'USD',
    timezone: 'UTC',
    description: 'Boutique hospitality property provisioned on Vanguard PMS.',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    starRating: 4,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationHours: 48,
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      petsAllowed: true,
      smokingAllowed: false,
    },
    taxes: [
      { id: 'tax-occ', name: 'Hotel Occupancy Tax', type: 'percentage', amount: 0.12, includedInPrice: false },
    ],
    fees: [],
  });

  // Auto-create tenant owner user
  if (ownerEmail) {
    db.createUser({
      tenantId,
      name: ownerName || 'Hotel General Manager',
      email: ownerEmail,
      role: 'PROPERTY_OWNER',
      roleId: 'role-property-owner',
      department: 'Executive Board',
      phone: '+1 555-0100',
      scope: {
        tenantId,
        propertyIds: ['*'],
        outletIds: ['*'],
        department: 'management',
      },
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
      lastLoginAt: new Date().toISOString(),
      active: true,
    });
  }

  // Audit log
  const actor = db.getUser(actorUserId);
  db.addPlatformAuditLog({
    actorUserId,
    actorName: actor?.name || 'Alexander Cross',
    actorRole: actor?.role || 'SUPER_ADMIN',
    action: 'TENANT_PROVISIONED',
    contextType: 'PLATFORM',
    targetTenantId: tenantId,
    targetTenantName: name,
    details: `Provisioned new SaaS tenant '${name}' with plan '${subscriptionTier || 'professional'}'.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json(newTenant);
});

app.patch('/api/platform/tenants/:id', (req: Request, res: Response) => {
  const actorUserId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const prevTier = tenant.subscriptionTier;
  const prevStatus = tenant.subscriptionStatus;

  Object.assign(tenant, req.body);

  const actor = db.getUser(actorUserId);
  db.addPlatformAuditLog({
    actorUserId,
    actorName: actor?.name || 'Alexander Cross',
    actorRole: actor?.role || 'SUPER_ADMIN',
    action: 'TENANT_CONFIG_UPDATED',
    contextType: 'PLATFORM',
    targetTenantId: tenant.id,
    targetTenantName: tenant.name,
    details: `Updated tenant settings. Plan: ${prevTier} -> ${tenant.subscriptionTier}, Status: ${prevStatus} -> ${tenant.subscriptionStatus}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json(tenant);
});

app.get('/api/platform/subscriptions/plans', (req: Request, res: Response) => {
  res.json(db.platformSubscriptionPlans);
});

app.post('/api/platform/subscriptions/plans', (req: Request, res: Response) => {
  const newPlan = {
    id: `plan-${Date.now()}`,
    ...req.body,
    tenantCount: 0,
  };
  db.platformSubscriptionPlans.push(newPlan);
  res.status(201).json(newPlan);
});

app.get('/api/platform/billing/invoices', (req: Request, res: Response) => {
  res.json(db.platformInvoices);
});

app.post('/api/platform/billing/invoices', (req: Request, res: Response) => {
  const newInv = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    issuedDate: new Date().toISOString().split('T')[0],
    ...req.body,
  };
  db.platformInvoices.unshift(newInv);
  res.status(201).json(newInv);
});

app.get('/api/platform/modules', (req: Request, res: Response) => {
  const modulesWithAdoption = db.modules.map(m => {
    const adoptionCount = db.tenantActivations.filter(a => a.moduleCode === m.code && a.status === 'ENABLED').length;
    return {
      ...m,
      adoptionCount,
    };
  });
  res.json(modulesWithAdoption);
});

app.get('/api/platform/users', (req: Request, res: Response) => {
  const platformUsers = db.users.filter(u => u.tenantId === 'platform' || u.role === 'SUPER_ADMIN');
  res.json(platformUsers);
});

app.post('/api/platform/users', (req: Request, res: Response) => {
  const { name, email, role, department } = req.body;
  const user = db.createUser({
    tenantId: 'platform',
    name,
    email,
    role: role || 'SUPPORT_AGENT',
    department: department || 'Platform Team',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    scope: {
      tenantId: 'platform',
      propertyIds: [],
      outletIds: [],
      department: department || 'Platform Team',
    },
    lastLoginAt: new Date().toISOString(),
    active: true,
  });
  res.status(201).json(user);
});

app.get('/api/platform/apis', (req: Request, res: Response) => {
  res.json(db.platformApiClients);
});

app.post('/api/platform/apis', (req: Request, res: Response) => {
  const { name, tenantId, tier, rateLimitRps, dailyQuota, webhookUrl } = req.body;
  const newClient = {
    id: `api-client-${Date.now()}`,
    name,
    clientId: `cli_${Math.random().toString(36).substring(2, 12)}`,
    clientSecretMasked: `sk_live_••••••••••••${Math.random().toString(36).substring(2, 6)}`,
    tenantId: tenantId || undefined,
    tier: tier || 'standard',
    rateLimitRps: Number(rateLimitRps) || 50,
    dailyQuota: Number(dailyQuota) || 100000,
    requestsToday: 0,
    webhookUrl,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
  db.platformApiClients.push(newClient);
  res.status(201).json(newClient);
});

app.get('/api/platform/integrations', (req: Request, res: Response) => {
  res.json(db.platformIntegrations);
});

app.post('/api/platform/integrations/:id/test', (req: Request, res: Response) => {
  const integration = db.platformIntegrations.find(i => i.id === req.params.id);
  if (!integration) {
    return res.status(404).json({ error: 'Integration service not found' });
  }
  integration.lastHealthCheck = new Date().toISOString();
  integration.latencyMs = Math.floor(60 + Math.random() * 80);
  res.json({
    success: true,
    latencyMs: integration.latencyMs,
    status: 'operational',
    message: `Connection test for ${integration.name} succeeded with latency ${integration.latencyMs}ms.`,
  });
});

app.get('/api/platform/system/health', (req: Request, res: Response) => {
  res.json(db.platformSystemHealth);
});

app.get('/api/platform/audit-logs', (req: Request, res: Response) => {
  res.json(db.platformAuditLogs);
});

app.get('/api/platform/audit/impersonation', (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;
  const actorUserId = req.query.actorUserId as string;

  if (tenantId) {
    return res.json(auditService.getLogsForTenant(tenantId));
  }
  if (actorUserId) {
    return res.json(auditService.getLogsForActor(actorUserId));
  }

  res.json(auditService.getImpersonationLogs());
});

app.get('/api/platform/settings', (req: Request, res: Response) => {
  res.json(db.platformSettings);
});

app.patch('/api/platform/settings', (req: Request, res: Response) => {
  Object.assign(db.platformSettings, req.body);
  res.json(db.platformSettings);
});

// Catch-all 404 for unhandled API endpoints so they never return HTML SPA shell
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vanguard PMS & Channel Manager running on http://0.0.0.0:${PORT}`);
  });
}

start();
