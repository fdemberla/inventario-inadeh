// lib/offline-db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";

// ============ Types ============

export interface PendingScan {
  id?: number;
  barcode: string;
  warehouseId: number;
  warehouseName: string;
  operation: "entrada" | "salida";
  quantity: number;
  timestamp: string;
  deviceId: string;
  userId: string;
  userName: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
  productName?: string;
  productId?: number;
  verified: boolean; // Whether the product was verified against cache
}

export interface CachedProduct {
  productId: number;
  barcode: string;
  productName: string;
  categoryName?: string;
  unitName?: string;
  cachedAt: string;
  warehouseId: number;
  currentQuantity?: number;
}

export interface CachedWarehouse {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  location: string;
  cachedAt: string;
  productCount: number;
}

export interface SyncConflict {
  id?: number;
  pendingScanId: number;
  barcode: string;
  warehouseId: number;
  operation: "entrada" | "salida";
  quantity: number;
  localTimestamp: string;
  serverTimestamp?: string;
  conflictType:
    | "quantity_mismatch"
    | "product_not_found"
    | "negative_inventory"
    | "server_error";
  serverMessage: string;
  resolved: boolean;
  resolution?: "keep_local" | "discard" | "manual";
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SyncMetadata {
  key: string;
  value: string | number | boolean;
  updatedAt: string;
}

export interface SyncStats {
  pendingCount: number;
  oldestPendingTimestamp: string | null;
  failedCount: number;
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
  unresolvedConflicts: number;
}

// ============ Database Schema ============

interface OfflineInventoryDBSchema extends DBSchema {
  pendingScans: {
    key: number;
    value: PendingScan;
    indexes: {
      "by-synced": number;
      "by-timestamp": string;
      "by-warehouse": number;
      "by-barcode": string;
      "by-device": string;
    };
  };
  cachedProducts: {
    key: [number, string]; // [warehouseId, barcode]
    value: CachedProduct;
    indexes: {
      "by-warehouse": number;
      "by-barcode": string;
      "by-cachedAt": string;
    };
  };
  cachedWarehouses: {
    key: number;
    value: CachedWarehouse;
    indexes: {
      "by-cachedAt": string;
    };
  };
  syncConflicts: {
    key: number;
    value: SyncConflict;
    indexes: {
      "by-resolved": number;
      "by-warehouse": number;
      "by-timestamp": string;
    };
  };
  syncMetadata: {
    key: string;
    value: SyncMetadata;
  };
}

const DB_NAME = "OfflineInventoryDB";
const DB_VERSION = 2; // Increment from version 1 which only had users store

let dbInstance: IDBPDatabase<OfflineInventoryDBSchema> | null = null;

export async function getOfflineDB(): Promise<
  IDBPDatabase<OfflineInventoryDBSchema>
> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<OfflineInventoryDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Handle upgrade from version 1 (which only had 'users' store)

        if (oldVersion < 2) {
        // Create pendingScans store
        if (!db.objectStoreNames.contains("pendingScans")) {
          const pendingStore = db.createObjectStore("pendingScans", {
            keyPath: "id",
            autoIncrement: true,
          });
          pendingStore.createIndex("by-synced", "synced");
          pendingStore.createIndex("by-timestamp", "timestamp");
          pendingStore.createIndex("by-warehouse", "warehouseId");
          pendingStore.createIndex("by-barcode", "barcode");
          pendingStore.createIndex("by-device", "deviceId");
        }

        // Create cachedProducts store
        if (!db.objectStoreNames.contains("cachedProducts")) {
          const productsStore = db.createObjectStore("cachedProducts", {
            keyPath: ["warehouseId", "barcode"],
          });
          productsStore.createIndex("by-warehouse", "warehouseId");
          productsStore.createIndex("by-barcode", "barcode");
          productsStore.createIndex("by-cachedAt", "cachedAt");
        }

        // Create cachedWarehouses store
        if (!db.objectStoreNames.contains("cachedWarehouses")) {
          const warehouseStore = db.createObjectStore("cachedWarehouses", {
            keyPath: "warehouseId",
          });
          warehouseStore.createIndex("by-cachedAt", "cachedAt");
        }

        // Create syncConflicts store
        if (!db.objectStoreNames.contains("syncConflicts")) {
          const conflictsStore = db.createObjectStore("syncConflicts", {
            keyPath: "id",
            autoIncrement: true,
          });
          conflictsStore.createIndex("by-resolved", "resolved");
          conflictsStore.createIndex("by-warehouse", "warehouseId");
          conflictsStore.createIndex("by-timestamp", "localTimestamp");
        }

        // Create syncMetadata store
        if (!db.objectStoreNames.contains("syncMetadata")) {
          db.createObjectStore("syncMetadata", { keyPath: "key" });
        }
      }
    },
    });

    return dbInstance;
  } catch (error) {
    // Handle version mismatch or corruption
    if (error.name === "VersionError" || error.name === "InvalidStateError") {
      console.warn("Offline database version mismatch detected. Recreating database...");
      
      try {
        // Reset the instance
        dbInstance = null;
        
        // Delete the old database
        const { deleteDB } = await import("idb");
        await deleteDB(DB_NAME);
        
        // Show user notification if available
        if (typeof window !== "undefined") {
          const { toast } = await import("react-hot-toast");
          toast.warning("Se detectó una actualización. Los datos sin sincronizar se han limpiado.", {
            duration: 6000,
          });
        }
        
        // Recreate the database
        dbInstance = await openDB<OfflineInventoryDBSchema>(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion) {
            if (oldVersion < 2) {
              // Create pendingScans store
              if (!db.objectStoreNames.contains("pendingScans")) {
                const pendingStore = db.createObjectStore("pendingScans", {
                  keyPath: "id",
                  autoIncrement: true,
                });
                pendingStore.createIndex("by-synced", "synced");
                pendingStore.createIndex("by-timestamp", "timestamp");
                pendingStore.createIndex("by-warehouse", "warehouseId");
                pendingStore.createIndex("by-barcode", "barcode");
                pendingStore.createIndex("by-device", "deviceId");
              }

              // Create cachedProducts store
              if (!db.objectStoreNames.contains("cachedProducts")) {
                const productsStore = db.createObjectStore("cachedProducts", {
                  keyPath: ["warehouseId", "barcode"],
                });
                productsStore.createIndex("by-warehouse", "warehouseId");
                productsStore.createIndex("by-barcode", "barcode");
                productsStore.createIndex("by-cachedAt", "cachedAt");
              }

              // Create cachedWarehouses store
              if (!db.objectStoreNames.contains("cachedWarehouses")) {
                const warehouseStore = db.createObjectStore("cachedWarehouses", {
                  keyPath: "warehouseId",
                });
                warehouseStore.createIndex("by-cachedAt", "cachedAt");
              }

              // Create syncConflicts store
              if (!db.objectStoreNames.contains("syncConflicts")) {
                const conflictsStore = db.createObjectStore("syncConflicts", {
                  keyPath: "id",
                  autoIncrement: true,
                });
                conflictsStore.createIndex("by-resolved", "resolved");
                conflictsStore.createIndex("by-warehouse", "warehouseId");
                conflictsStore.createIndex("by-timestamp", "localTimestamp");
              }

              // Create syncMetadata store
              if (!db.objectStoreNames.contains("syncMetadata")) {
                db.createObjectStore("syncMetadata", { keyPath: "key" });
              }
            }
          },
        });
        
        return dbInstance;
      } catch (deleteError) {
        console.error("Failed to recreate offline database:", deleteError);
        throw deleteError;
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

// ============ Device ID ============

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem("offline-device-id");
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("offline-device-id", deviceId);
  }
  return deviceId;
}

// ============ Pending Scans Operations ============

export async function queueScan(
  scan: Omit<PendingScan, "id" | "synced" | "syncAttempts" | "deviceId">,
): Promise<number> {
  const db = await getOfflineDB();
  const deviceId = getDeviceId();

  const pendingScan: Omit<PendingScan, "id"> = {
    ...scan,
    deviceId,
    synced: false,
    syncAttempts: 0,
  };

  const id = await db.add("pendingScans", pendingScan as PendingScan);
  return id;
}

export async function getPendingScans(
  warehouseId?: number,
): Promise<PendingScan[]> {
  const db = await getOfflineDB();

  if (warehouseId) {
    return db.getAllFromIndex("pendingScans", "by-warehouse", warehouseId);
  }

  return db.getAll("pendingScans");
}

export async function getUnsyncedScans(): Promise<PendingScan[]> {
  const db = await getOfflineDB();
  // Get all scans where synced = false (0 in IndexedDB)
  const allScans = await db.getAll("pendingScans");
  return allScans.filter((scan) => !scan.synced);
}

export async function markScanAsSynced(id: number): Promise<void> {
  const db = await getOfflineDB();
  const scan = await db.get("pendingScans", id);
  if (scan) {
    scan.synced = true;
    await db.put("pendingScans", scan);
  }
}

export async function markScanAsFailed(
  id: number,
  error: string,
): Promise<void> {
  const db = await getOfflineDB();
  const scan = await db.get("pendingScans", id);
  if (scan) {
    scan.syncAttempts += 1;
    scan.lastSyncError = error;
    await db.put("pendingScans", scan);
  }
}

export async function deleteSyncedScans(): Promise<number> {
  const db = await getOfflineDB();
  const tx = db.transaction("pendingScans", "readwrite");
  const store = tx.objectStore("pendingScans");

  let deletedCount = 0;
  let cursor = await store.openCursor();

  while (cursor) {
    if (cursor.value.synced) {
      await cursor.delete();
      deletedCount++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return deletedCount;
}

export async function cleanupExpiredScans(
  maxAgeHours: number = 48,
): Promise<number> {
  const db = await getOfflineDB();
  const tx = db.transaction("pendingScans", "readwrite");
  const store = tx.objectStore("pendingScans");

  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
  const cutoffTimestamp = cutoffTime.toISOString();

  let deletedCount = 0;
  let cursor = await store.openCursor();

  while (cursor) {
    // Only delete synced scans that are older than cutoff
    if (cursor.value.synced && cursor.value.timestamp < cutoffTimestamp) {
      await cursor.delete();
      deletedCount++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return deletedCount;
}

// ============ Blocking Logic ============

export interface BlockingStatus {
  shouldBlock: boolean;
  reason: string | null;
  pendingCount: number;
  oldestPendingHours: number | null;
  warningLevel: "none" | "low" | "medium" | "high" | "critical";
}

export async function getBlockingStatus(): Promise<BlockingStatus> {
  const db = await getOfflineDB();
  const unsyncedScans = await getUnsyncedScans();

  const pendingCount = unsyncedScans.length;

  // Find oldest unsynced scan
  let oldestPendingHours: number | null = null;
  if (unsyncedScans.length > 0) {
    const timestamps = unsyncedScans.map((s) =>
      new Date(s.timestamp).getTime(),
    );
    const oldestTimestamp = Math.min(...timestamps);
    const hoursOld = (Date.now() - oldestTimestamp) / (1000 * 60 * 60);
    oldestPendingHours = Math.round(hoursOld * 10) / 10;
  }

  // Check for unresolved conflicts
  const conflicts = await db.getAllFromIndex("syncConflicts", "by-resolved", 0);
  const hasUnresolvedConflicts = conflicts.length > 0;

  // Determine warning level and blocking
  let warningLevel: BlockingStatus["warningLevel"] = "none";
  let shouldBlock = false;
  let reason: string | null = null;

  if (hasUnresolvedConflicts) {
    warningLevel = "high";
    reason = `Hay ${conflicts.length} conflicto(s) sin resolver. Revíselos antes de continuar.`;
  }

  if (pendingCount >= 10) {
    shouldBlock = true;
    warningLevel = "critical";
    reason = `Límite de escaneos pendientes alcanzado (${pendingCount}/10). Sincronice antes de continuar.`;
  } else if (pendingCount >= 7) {
    warningLevel = "high";
    reason = `${pendingCount} escaneos pendientes. Sincronice pronto.`;
  } else if (pendingCount >= 4) {
    warningLevel = "medium";
    reason = `${pendingCount} escaneos pendientes de sincronización.`;
  } else if (pendingCount >= 1) {
    warningLevel = "low";
  }

  if (oldestPendingHours !== null && oldestPendingHours >= 24) {
    shouldBlock = true;
    warningLevel = "critical";
    reason = `Hay escaneos pendientes de más de 24 horas. Sincronice antes de continuar.`;
  } else if (oldestPendingHours !== null && oldestPendingHours >= 12) {
    if (warningLevel !== "critical") {
      warningLevel = "high";
      reason = `Escaneos pendientes de más de ${Math.floor(oldestPendingHours)} horas. Sincronice pronto.`;
    }
  }

  return {
    shouldBlock,
    reason,
    pendingCount,
    oldestPendingHours,
    warningLevel,
  };
}

// ============ Product Cache Operations ============

export async function cacheProducts(
  warehouseId: number,
  products: Array<{
    productId: number;
    barcode: string;
    productName: string;
    categoryName?: string;
    unitName?: string;
    currentQuantity?: number;
  }>,
): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction("cachedProducts", "readwrite");
  const store = tx.objectStore("cachedProducts");
  const cachedAt = new Date().toISOString();

  // First, delete existing products for this warehouse
  const index = store.index("by-warehouse");
  let cursor = await index.openCursor(warehouseId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  // Then add new products
  for (const product of products) {
    await store.put({
      productId: product.productId,
      barcode: product.barcode,
      productName: product.productName,
      categoryName: product.categoryName,
      unitName: product.unitName,
      cachedAt,
      warehouseId,
      currentQuantity: product.currentQuantity,
    });
  }

  await tx.done;

  // Update warehouse cache metadata
  await updateWarehouseCache(warehouseId, products.length);
}

export async function getCachedProduct(
  warehouseId: number,
  barcode: string,
): Promise<CachedProduct | undefined> {
  const db = await getOfflineDB();
  return db.get("cachedProducts", [warehouseId, barcode]);
}

export async function getCachedProductsByWarehouse(
  warehouseId: number,
): Promise<CachedProduct[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("cachedProducts", "by-warehouse", warehouseId);
}

export async function updateWarehouseCache(
  warehouseId: number,
  productCount: number,
): Promise<void> {
  const db = await getOfflineDB();

  // Try to get existing warehouse info or create minimal entry
  const existing = await db.get("cachedWarehouses", warehouseId);

  await db.put("cachedWarehouses", {
    warehouseId,
    warehouseName: existing?.warehouseName || `Almacén ${warehouseId}`,
    warehouseCode: existing?.warehouseCode || "",
    location: existing?.location || "",
    cachedAt: new Date().toISOString(),
    productCount,
  });
}

export async function cacheWarehouse(warehouse: {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  location: string;
}): Promise<void> {
  const db = await getOfflineDB();
  const existing = await db.get("cachedWarehouses", warehouse.warehouseId);

  await db.put("cachedWarehouses", {
    ...warehouse,
    cachedAt: new Date().toISOString(),
    productCount: existing?.productCount || 0,
  });
}

export async function getCachedWarehouse(
  warehouseId: number,
): Promise<CachedWarehouse | undefined> {
  const db = await getOfflineDB();
  return db.get("cachedWarehouses", warehouseId);
}

export async function isProductCacheValid(
  warehouseId: number,
  maxAgeHours: number = 24,
): Promise<boolean> {
  const warehouse = await getCachedWarehouse(warehouseId);
  if (!warehouse) return false;

  const cacheAge = Date.now() - new Date(warehouse.cachedAt).getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  return cacheAge < maxAgeMs;
}

// ============ Conflict Operations ============

export async function addConflict(
  conflict: Omit<SyncConflict, "id" | "resolved">,
): Promise<number> {
  const db = await getOfflineDB();

  const newConflict: Omit<SyncConflict, "id"> = {
    ...conflict,
    resolved: false,
  };

  const id = await db.add("syncConflicts", newConflict as SyncConflict);
  return id;
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  const db = await getOfflineDB();
  // resolved = false is stored as 0 in IndexedDB
  return db.getAllFromIndex("syncConflicts", "by-resolved", 0);
}

export async function resolveConflict(
  id: number,
  resolution: "keep_local" | "discard" | "manual",
  resolvedBy: string,
): Promise<void> {
  const db = await getOfflineDB();
  const conflict = await db.get("syncConflicts", id);

  if (conflict) {
    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolvedBy = resolvedBy;
    await db.put("syncConflicts", conflict);
  }
}

export async function getAllConflicts(): Promise<SyncConflict[]> {
  const db = await getOfflineDB();
  return db.getAll("syncConflicts");
}

// ============ Sync Metadata Operations ============

export async function setSyncMetadata(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  const db = await getOfflineDB();
  await db.put("syncMetadata", {
    key,
    value,
    updatedAt: new Date().toISOString(),
  });
}

export async function getSyncMetadata(
  key: string,
): Promise<SyncMetadata | undefined> {
  const db = await getOfflineDB();
  return db.get("syncMetadata", key);
}

// ============ Sync Stats ============

export async function getSyncStats(): Promise<SyncStats> {
  const db = await getOfflineDB();

  const allScans = await db.getAll("pendingScans");
  const unsyncedScans = allScans.filter((s) => !s.synced);
  const failedScans = allScans.filter((s) => !s.synced && s.syncAttempts > 0);

  let oldestPendingTimestamp: string | null = null;
  if (unsyncedScans.length > 0) {
    const timestamps = unsyncedScans.map((s) => s.timestamp);
    oldestPendingTimestamp = timestamps.sort()[0];
  }

  const lastSyncAttemptMeta = await getSyncMetadata("lastSyncAttempt");
  const lastSuccessfulSyncMeta = await getSyncMetadata("lastSuccessfulSync");

  const conflicts = await getUnresolvedConflicts();

  return {
    pendingCount: unsyncedScans.length,
    oldestPendingTimestamp,
    failedCount: failedScans.length,
    lastSyncAttempt: (lastSyncAttemptMeta?.value as string | null) ?? null,
    lastSuccessfulSync:
      (lastSuccessfulSyncMeta?.value as string | null) ?? null,
    unresolvedConflicts: conflicts.length,
  };
}

// ============ Clear All Data ============

export async function clearAllOfflineData(): Promise<void> {
  const db = await getOfflineDB();

  const tx = db.transaction(
    [
      "pendingScans",
      "cachedProducts",
      "cachedWarehouses",
      "syncConflicts",
      "syncMetadata",
    ],
    "readwrite",
  );

  await Promise.all([
    tx.objectStore("pendingScans").clear(),
    tx.objectStore("cachedProducts").clear(),
    tx.objectStore("cachedWarehouses").clear(),
    tx.objectStore("syncConflicts").clear(),
    tx.objectStore("syncMetadata").clear(),
  ]);

  await tx.done;
}
