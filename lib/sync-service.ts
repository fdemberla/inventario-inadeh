// lib/sync-service.ts
import {
  PendingScan,
  SyncStats,
  getUnsyncedScans,
  markScanAsSynced,
  markScanAsFailed,
  deleteSyncedScans,
  cleanupExpiredScans,
  getSyncStats,
  setSyncMetadata,
  addConflict,
  getCachedProduct,
  cacheProducts,
  cacheWarehouse,
  queueScan,
  getBlockingStatus,
  BlockingStatus,
} from "./offline-db";
import { withBasePath } from "@/lib/utils";

// ============ Types ============

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface BulkSyncPayload {
  scans: Array<{
    id: number;
    barcode: string;
    warehouseId: number;
    operation: "entrada" | "salida";
    quantity: number;
    timestamp: string;
    deviceId: string;
    userId: string;
    productId?: number;
    verified: boolean;
  }>;
  deviceId: string;
}

export interface BulkSyncResponse {
  success: boolean;
  results: Array<{
    id: number;
    success: boolean;
    error?: string;
    conflictType?: string;
    serverQuantity?: number;
  }>;
  serverTime: string;
}

// ============ Online Status ============

let onlineStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
const onlineListeners: Set<(online: boolean) => void> = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    onlineStatus = true;
    onlineListeners.forEach((listener) => listener(true));
  });

  window.addEventListener("offline", () => {
    onlineStatus = false;
    onlineListeners.forEach((listener) => listener(false));
  });
}

export function isOnline(): boolean {
  return onlineStatus;
}

export function subscribeToOnlineStatus(
  callback: (online: boolean) => void,
): () => void {
  onlineListeners.add(callback);
  return () => onlineListeners.delete(callback);
}

// ============ Scan Operations ============

export interface ScanInput {
  barcode: string;
  warehouseId: number;
  warehouseName: string;
  operation: "entrada" | "salida";
  userId: string;
  userName: string;
}

export interface ScanOperationResult {
  success: boolean;
  message: string;
  queued: boolean;
  productName?: string;
  productId?: number;
  verified: boolean;
  newQuantity?: number;
  pendingId?: number;
}

/**
 * Process a scan - either send to server (online) or queue locally (offline)
 */
export async function processScan(
  input: ScanInput,
): Promise<ScanOperationResult> {
  // Check blocking status first
  const blockingStatus = await getBlockingStatus();
  if (blockingStatus.shouldBlock) {
    return {
      success: false,
      message:
        blockingStatus.reason ||
        "Operación bloqueada. Sincronice los datos pendientes.",
      queued: false,
      verified: false,
    };
  }

  // Check if online
  if (isOnline()) {
    try {
      const result = await sendScanToServer(input);
      return result;
    } catch (error) {
      console.warn("Failed to send scan to server, queuing locally:", error);
      // Fall through to queue locally
    }
  }

  // Queue locally
  return await queueScanLocally(input);
}

/**
 * Send a single scan to the server
 */
async function sendScanToServer(
  input: ScanInput,
): Promise<ScanOperationResult> {
  const response = await fetch(withBasePath("/api/inventory/scanner"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      barcode: input.barcode,
      warehouseId: input.warehouseId,
      operation: input.operation,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al procesar el escaneo");
  }

  return {
    success: true,
    message: data.message || "Escaneo procesado correctamente",
    queued: false,
    productName: data.product?.name,
    productId: data.product?.id,
    verified: true,
    newQuantity: data.quantity,
  };
}

/**
 * Queue a scan locally when offline
 */
async function queueScanLocally(
  input: ScanInput,
): Promise<ScanOperationResult> {
  // Try to verify against cache
  const cachedProduct = await getCachedProduct(
    input.warehouseId,
    input.barcode,
  );
  const verified = !!cachedProduct;

  const pendingId = await queueScan({
    barcode: input.barcode,
    warehouseId: input.warehouseId,
    warehouseName: input.warehouseName,
    operation: input.operation,
    quantity: 1,
    timestamp: new Date().toISOString(),
    userId: input.userId,
    userName: input.userName,
    productName: cachedProduct?.productName,
    productId: cachedProduct?.productId,
    verified,
  });

  return {
    success: true,
    message: verified
      ? `Escaneo guardado localmente: ${cachedProduct.productName}`
      : "Escaneo guardado localmente (producto no verificado)",
    queued: true,
    productName: cachedProduct?.productName,
    productId: cachedProduct?.productId,
    verified,
    pendingId,
  };
}

// ============ Sync Operations ============

let isSyncing = false;

/**
 * Sync all pending scans to the server
 */
export async function syncPendingScans(): Promise<SyncResult> {
  if (isSyncing) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: ["Ya hay una sincronización en progreso"],
    };
  }

  if (!isOnline()) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: ["No hay conexión a internet"],
    };
  }

  isSyncing = true;
  await setSyncMetadata("lastSyncAttempt", new Date().toISOString());

  try {
    const unsyncedScans = await getUnsyncedScans();

    if (unsyncedScans.length === 0) {
      return {
        success: true,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [],
      };
    }

    // Prepare payload for bulk sync
    const payload: BulkSyncPayload = {
      scans: unsyncedScans.map((scan) => ({
        id: scan.id!,
        barcode: scan.barcode,
        warehouseId: scan.warehouseId,
        operation: scan.operation,
        quantity: scan.quantity,
        timestamp: scan.timestamp,
        deviceId: scan.deviceId,
        userId: scan.userId,
        productId: scan.productId,
        verified: scan.verified,
      })),
      deviceId: unsyncedScans[0]?.deviceId || "unknown",
    };

    const response = await fetch(withBasePath("/api/inventory/scanner/sync"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error de sincronización: ${response.status}`,
      );
    }

    const data: BulkSyncResponse = await response.json();

    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    const errors: string[] = [];

    // Process results
    for (const result of data.results) {
      const originalScan = unsyncedScans.find((s) => s.id === result.id);

      if (result.success) {
        await markScanAsSynced(result.id);
        synced++;
      } else if (result.conflictType) {
        // Create conflict record
        if (originalScan) {
          await addConflict({
            pendingScanId: result.id,
            barcode: originalScan.barcode,
            warehouseId: originalScan.warehouseId,
            operation: originalScan.operation,
            quantity: originalScan.quantity,
            localTimestamp: originalScan.timestamp,
            serverTimestamp: data.serverTime,
            conflictType: result.conflictType as
              | "quantity_mismatch"
              | "product_not_found"
              | "negative_inventory"
              | "server_error",
            serverMessage: result.error || "Conflicto detectado",
          });
        }
        conflicts++;
        await markScanAsFailed(result.id, result.error || "Conflict");
      } else {
        await markScanAsFailed(result.id, result.error || "Unknown error");
        failed++;
        if (result.error) {
          errors.push(`Scan ${result.id}: ${result.error}`);
        }
      }
    }

    if (synced > 0) {
      await setSyncMetadata("lastSuccessfulSync", new Date().toISOString());
    }

    // Cleanup old synced scans
    await deleteSyncedScans();
    await cleanupExpiredScans(48);

    return {
      success: failed === 0 && conflicts === 0,
      synced,
      failed,
      conflicts,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [errorMessage],
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Check if currently syncing
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

// ============ Auto-sync ============

let autoSyncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start auto-sync when online
 */
export function startAutoSync(intervalMs: number = 30000): void {
  stopAutoSync();

  autoSyncInterval = setInterval(async () => {
    if (isOnline() && !isSyncing) {
      const stats = await getSyncStats();
      if (stats.pendingCount > 0) {
        console.log(`Auto-sync: ${stats.pendingCount} pending scans`);
        await syncPendingScans();
      }
    }
  }, intervalMs);

  // Also sync immediately when coming online
  subscribeToOnlineStatus(async (online) => {
    if (online && !isSyncing) {
      const stats = await getSyncStats();
      if (stats.pendingCount > 0) {
        console.log(`Back online: syncing ${stats.pendingCount} pending scans`);
        await syncPendingScans();
      }
    }
  });
}

/**
 * Stop auto-sync
 */
export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

// ============ Product Cache Refresh ============

export interface ProductCacheRefreshResult {
  success: boolean;
  productCount: number;
  error?: string;
}

/**
 * Refresh product cache for a warehouse
 */
export async function refreshProductCache(
  warehouseId: number,
): Promise<ProductCacheRefreshResult> {
  if (!isOnline()) {
    return {
      success: false,
      productCount: 0,
      error: "No hay conexión a internet",
    };
  }

  try {
    // Fetch products for this warehouse
    const response = await fetch(
      withBasePath(`/api/inventory/scanner/products?warehouseId=${warehouseId}`),
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Error al cargar productos: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      throw new Error("Respuesta inválida del servidor");
    }

    // Cache products
    await cacheProducts(warehouseId, data.products);

    // Cache warehouse info if available
    if (data.warehouse) {
      await cacheWarehouse({
        warehouseId: data.warehouse.warehouseId,
        warehouseName: data.warehouse.warehouseName,
        warehouseCode: data.warehouse.warehouseCode,
        location: data.warehouse.location,
      });
    }

    return {
      success: true,
      productCount: data.products.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      productCount: 0,
      error: errorMessage,
    };
  }
}

// ============ Export for convenience ============

export { getSyncStats, getBlockingStatus };
export type { SyncStats, BlockingStatus, PendingScan };
