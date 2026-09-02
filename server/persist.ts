import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { PERMISSIONS_CATALOG, DEFAULT_ROLES } from './auth';

const nodeRequire = createRequire(import.meta.url);

export const PERSIST_COLLECTIONS = [
  'tenants',
  'users',
  'roles',
  'properties',
  'roomTypes',
  'rooms',
  'guests',
  'reservations',
  'availabilityOverrides',
  'channelConnections',
  'channelRoomMappings',
  'syncLogs',
  'housekeepingTasks',
  'maintenanceWorkOrders',
  'expenses',
  'messages',
  'reviews',
  'operationsTasks',
  'modules',
  'tenantActivations',
  'addons',
  'auditLogs',
  'activeHotelAccessSessions',
  'platformAuditLogs',
  'platformSubscriptionPlans',
  'platformInvoices',
  'platformApiClients',
  'platformIntegrations',
  'platformSystemHealth',
  'platformSettings',
  'diningTables',
  'menuItems',
  'restaurantOrders',
  'kdsTickets',
  'poolFacilities',
  'poolTickets',
  'poolWaterLogs',
  'inventoryLocations',
  'inventoryProducts',
  'stockMovements',
  'suppliers',
  'purchaseOrders',
] as const;

export type PersistCollection = (typeof PERSIST_COLLECTIONS)[number];

export interface PersistSnapshot {
  version: number;
  savedAt: string;
  credentials: Record<string, string>;
  collections: Record<string, unknown>;
}

const DATA_DIR = process.env.DATA_DIR
  || process.env.RAILWAY_VOLUME_MOUNT_PATH
  || path.join(process.cwd(), 'data');
const JSON_PATH = path.join(DATA_DIR, 'vanguard.json');
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, 'vanguard.sqlite');

let dirty = false;
let flushTimer: NodeJS.Timeout | null = null;
let backing: 'sqlite' | 'json' = 'json';
let sqliteDb: any = null;
let hostedDb: any = null;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function snapshotFromDb(db: any, credentials: Record<string, string>): PersistSnapshot {
  const collections: Record<string, unknown> = {};
  for (const key of PERSIST_COLLECTIONS) {
    collections[key] = structuredClone(db[key]);
  }
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    credentials: { ...credentials },
    collections,
  };
}

function applySnapshot(db: any, snapshot: PersistSnapshot) {
  for (const key of PERSIST_COLLECTIONS) {
    if (snapshot.collections[key] !== undefined) {
      db[key] = snapshot.collections[key];
    }
  }
  // Always refresh the permission catalog and system roles from code so deploys pick up RBAC updates.
  db.permissions = [...PERMISSIONS_CATALOG];
  const customRoles = (db.roles || []).filter((r: any) => r && r.isSystem === false);
  db.roles = [...DEFAULT_ROLES, ...customRoles];
}

function atomicWriteJson(filePath: string, data: unknown) {
  ensureDataDir();
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data), { encoding: 'utf8' });
  fs.renameSync(tmp, filePath);
}

function tryOpenSqlite(): boolean {
  try {
    // Node 22+ experimental DatabaseSync. Fall back to JSON if unavailable.
    const { DatabaseSync } = nodeRequire('node:sqlite') as { DatabaseSync: new (path: string) => any };
    ensureDataDir();
    sqliteDb = new DatabaseSync(SQLITE_PATH);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    backing = 'sqlite';
    return true;
  } catch (err) {
    console.warn('[persist] SQLite unavailable, using JSON snapshot file:', (err as Error).message);
    sqliteDb = null;
    backing = 'json';
    return false;
  }
}

function readSqlite(): PersistSnapshot | null {
  if (!sqliteDb) return null;
  const row = sqliteDb.prepare('SELECT payload FROM snapshots WHERE id = 1').get();
  if (!row?.payload) return null;
  return JSON.parse(row.payload) as PersistSnapshot;
}

function writeSqlite(snapshot: PersistSnapshot) {
  if (!sqliteDb) return;
  const payload = JSON.stringify(snapshot);
  sqliteDb.exec('BEGIN');
  try {
    sqliteDb.prepare(`
      INSERT INTO snapshots (id, payload, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `).run(payload, snapshot.savedAt);
    sqliteDb.exec('COMMIT');
  } catch (err) {
    try { sqliteDb.exec('ROLLBACK'); } catch { /* ignore */ }
    throw err;
  }
}

function readJson(): PersistSnapshot | null {
  if (!fs.existsSync(JSON_PATH)) return null;
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw) as PersistSnapshot;
}

export function persistHealth(): { backing: 'sqlite' | 'json'; writable: boolean; path: string } {
  const target = backing === 'sqlite' ? SQLITE_PATH : JSON_PATH;
  try {
    ensureDataDir();
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return { backing, writable: true, path: target };
  } catch {
    return { backing, writable: false, path: target };
  }
}

export const persist = {
  credentials: {} as Record<string, string>,

  bootstrap(db: any) {
    tryOpenSqlite();
    const snapshot = (backing === 'sqlite' ? readSqlite() : null) || readJson();
    if (snapshot?.collections) {
      applySnapshot(db, snapshot);
      this.credentials = snapshot.credentials || {};
      console.log(`[persist] Restored ${backing} snapshot from ${snapshot.savedAt}`);
    } else {
      this.flush(db);
      console.log(`[persist] No snapshot found. Seeded ${backing} store at ${backing === 'sqlite' ? SQLITE_PATH : JSON_PATH}`);
    }
    hostedDb = db;
    this.startAutosave();
  },

  markDirty() {
    dirty = true;
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      if (hostedDb) this.flush(hostedDb);
    }, 400);
  },

  startAutosave() {
    setInterval(() => {
      if (dirty && hostedDb) this.flush(hostedDb);
    }, 10_000).unref();
  },

  flush(db: any = hostedDb) {
    if (!db) return;
    const snapshot = snapshotFromDb(db, this.credentials);
    try {
      if (backing === 'sqlite') {
        writeSqlite(snapshot);
        // JSON is a portable backup next to SQLite.
        atomicWriteJson(JSON_PATH, snapshot);
      } else {
        atomicWriteJson(JSON_PATH, snapshot);
      }
      dirty = false;
    } catch (err) {
      console.error('[persist] Failed to flush snapshot:', err);
    }
  },

  setPasswordHash(userId: string, hash: string) {
    this.credentials[userId] = hash;
    this.markDirty();
  },

  getPasswordHash(userId: string): string | undefined {
    return this.credentials[userId];
  },
};

export function attachPersistHooks() {
  // Signal handlers are registered by the HTTP server so it can drain connections first.
}
