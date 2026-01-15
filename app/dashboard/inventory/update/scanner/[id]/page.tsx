"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Label, Spinner, TextInput, Badge } from "flowbite-react";
import { useRouter, useParams } from "next/navigation";
import { CiBarcode } from "react-icons/ci";
import {
  HiOutlineCloud,
  HiOutlineCloudDownload,
  HiOutlineDatabase,
} from "react-icons/hi";
import OfflineStatusBanner from "@/app/components/OfflineStatusBanner";
import {
  processScan,
  isOnline,
  subscribeToOnlineStatus,
  startAutoSync,
  stopAutoSync,
  refreshProductCache,
  getSyncStats,
  getBlockingStatus,
} from "@/lib/sync-service";
import {
  isProductCacheValid,
  getCachedProductsByWarehouse,
  getPendingScans,
} from "@/lib/offline-db";
import { withBasePath } from "@/lib/utils";

interface ScanEntry {
  barcode: string;
  status: "success" | "error" | "scan-error" | "queued";
  message: string;
  product?: { name?: string; barcode?: string; id?: number };
  inventory?: number;
  timestamp: string;
  queued?: boolean;
  verified?: boolean;
}

interface Warehouse {
  WarehouseID: number;
  WarehouseName: string;
  WarehouseCode: string;
  Location: string;
  IsActive: boolean;
  CreatedDate: string;
  ModifiedDate: string;
  MainLocationID: string;
}

function ScannerPage() {
  const router = useRouter();
  const params = useParams();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [operationType, setOperationType] = useState<"entrada" | "salida">(
    "entrada",
  );
  const [online, setOnline] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<{
    valid: boolean;
    productCount: number;
    loading: boolean;
  }>({ valid: false, productCount: 0, loading: false });
  const [isBlocked, setIsBlocked] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<{
    status: "success" | "error" | "scan-error" | "queued";
    message: string;
  } | null>(null);

  // Check blocking status
  const checkBlockingStatus = useCallback(async () => {
    const status = await getBlockingStatus();
    setIsBlocked(status.shouldBlock);
  }, []);

  // Load pending scans into history
  const loadPendingScansToHistory = useCallback(async (warehouseId: number) => {
    const pending = await getPendingScans(warehouseId);
    const pendingHistory: ScanEntry[] = pending
      .filter((scan) => !scan.synced)
      .map((scan) => ({
        barcode: scan.barcode,
        status: "queued" as const,
        message: scan.verified
          ? `Pendiente: ${scan.productName || scan.barcode}`
          : `Pendiente (no verificado): ${scan.barcode}`,
        product: {
          name: scan.productName,
          barcode: scan.barcode,
          id: scan.productId,
        },
        timestamp: scan.timestamp,
        queued: true,
        verified: scan.verified,
      }));

    // Prepend pending scans that aren't already in history
    setScanHistory((prev) => {
      const existingBarcodes = new Set(
        prev.filter((p) => p.queued).map((p) => p.timestamp),
      );
      const newPending = pendingHistory.filter(
        (p) => !existingBarcodes.has(p.timestamp),
      );
      return [...newPending, ...prev.filter((p) => !p.queued)];
    });
  }, []);

  // Check and refresh product cache
  const checkAndRefreshCache = useCallback(async (warehouseId: number) => {
    setCacheStatus((prev) => ({ ...prev, loading: true }));

    try {
      const cacheValid = await isProductCacheValid(warehouseId, 24);

      if (cacheValid) {
        const cachedProducts = await getCachedProductsByWarehouse(warehouseId);
        setCacheStatus({
          valid: true,
          productCount: cachedProducts.length,
          loading: false,
        });
        return;
      }

      // Try to refresh cache if online
      if (isOnline()) {
        const toastId = toast.loading(
          "Cargando productos para modo offline...",
        );
        const result = await refreshProductCache(warehouseId);

        if (result.success) {
          toast.success(`${result.productCount} productos cargados`, {
            id: toastId,
          });
          setCacheStatus({
            valid: true,
            productCount: result.productCount,
            loading: false,
          });
        } else {
          toast.error(result.error || "Error al cargar productos", {
            id: toastId,
          });
          setCacheStatus({ valid: false, productCount: 0, loading: false });
        }
      } else {
        // Offline and no valid cache
        const cachedProducts = await getCachedProductsByWarehouse(warehouseId);
        if (cachedProducts.length > 0) {
          setCacheStatus({
            valid: true,
            productCount: cachedProducts.length,
            loading: false,
          });
          toast("Usando caché de productos anterior", { icon: "📦" });
        } else {
          setCacheStatus({ valid: false, productCount: 0, loading: false });
          toast.error("Sin conexión y sin caché de productos");
        }
      }
    } catch (error) {
      console.error("Cache check error:", error);
      setCacheStatus({ valid: false, productCount: 0, loading: false });
    }
  }, []);

  // Manual cache refresh
  const handleRefreshCache = async () => {
    if (!warehouse || !isOnline()) {
      toast.error("Se necesita conexión para actualizar el caché");
      return;
    }

    setCacheStatus((prev) => ({ ...prev, loading: true }));
    const toastId = toast.loading("Actualizando caché de productos...");

    try {
      const result = await refreshProductCache(warehouse.WarehouseID);
      if (result.success) {
        toast.success(`${result.productCount} productos actualizados`, {
          id: toastId,
        });
        setCacheStatus({
          valid: true,
          productCount: result.productCount,
          loading: false,
        });
      } else {
        toast.error(result.error || "Error al actualizar", { id: toastId });
        setCacheStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Cache refresh error:", error);
      toast.error("Error al actualizar caché", { id: toastId });
      setCacheStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  // Initialize online status and auto-sync
  useEffect(() => {
    setOnline(isOnline());

    const unsubscribe = subscribeToOnlineStatus((isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        toast.success("Conexión restaurada");
      } else {
        toast("Sin conexión - Modo offline activo", { icon: "📴" });
      }
    });

    // Start auto-sync
    startAutoSync(30000);

    return () => {
      unsubscribe();
      stopAutoSync();
    };
  }, []);

  // Fetch warehouse data
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!params?.id) return;
      setLoading(true);
      const toastId = toast.loading("Cargando almacén...");
      try {
        const res = await fetch(
          withBasePath(`/api/warehouses/${params.id}`),
        );
        if (!res.ok) throw new Error("Error al cargar el almacén.");
        const data = await res.json();
        setWarehouse(data.warehouse);
        toast.success("Almacén cargado correctamente", { id: toastId });

        // Check cache and load pending scans
        await checkAndRefreshCache(data.warehouse.WarehouseID);
        await loadPendingScansToHistory(data.warehouse.WarehouseID);
        await checkBlockingStatus();
      } catch (err) {
        toast.error((err as Error).message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [
    params?.id,
    checkAndRefreshCache,
    loadPendingScansToHistory,
    checkBlockingStatus,
  ]);

  // Focus input when warehouse is loaded
  useEffect(() => {
    if (warehouse && inputRef.current) {
      inputRef.current.focus();
    }
  }, [warehouse]);

  // Handle sync complete
  const handleSyncComplete = async () => {
    if (warehouse) {
      await loadPendingScansToHistory(warehouse.WarehouseID);
      await checkBlockingStatus();

      // Update history to mark synced items
      const stats = await getSyncStats();
      if (stats.pendingCount === 0) {
        setScanHistory((prev) =>
          prev.map((entry) =>
            entry.queued
              ? { ...entry, status: "success" as const, queued: false }
              : entry,
          ),
        );
      }
    }
  };

  // Handle scan submission
  const handleScanSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scannedCode.trim() !== "") {
      const input = scannedCode.trim();
      setScannedCode("");
      setScanResult(null);

      // Check if blocked
      if (isBlocked) {
        setScanResult({
          status: "error",
          message: "Sincronice los datos pendientes antes de continuar",
        });
        toast.error("Operación bloqueada. Sincronice los datos pendientes.");
        return;
      }

      try {
        const result = await processScan({
          barcode: input,
          warehouseId: warehouse!.WarehouseID,
          warehouseName: warehouse!.WarehouseName,
          operation: operationType,
          userId: "system",
          userName: "Usuario",
        });

        if (result.success) {
          const status = result.queued ? "queued" : "success";
          setScanResult({
            status,
            message: result.message,
          });

          setScanHistory((prev) => [
            {
              barcode: input,
              status,
              message: result.message,
              product: {
                name: result.productName,
                barcode: input,
                id: result.productId,
              },
              inventory: result.newQuantity,
              timestamp: new Date().toISOString(),
              queued: result.queued,
              verified: result.verified,
            },
            ...prev,
          ]);

          if (result.queued) {
            toast(result.message, { icon: "📥", duration: 3000 });
          } else {
            toast.success(result.message, { duration: 3000 });
          }
        } else {
          setScanResult({
            status: "error",
            message: result.message,
          });
          toast.error(result.message, { duration: 5000 });
        }

        // Re-check blocking status
        await checkBlockingStatus();
      } catch (err) {
        console.error("Error en la solicitud:", err);
        setScanResult({
          status: "error",
          message: "Error al procesar el escaneo",
        });
        toast.error("Error al procesar el escaneo", { duration: 5000 });
      }

      // Clear badge after 5 seconds
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 dark:text-white">
      {/* Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push(withBasePath(`/dashboard/inventory`))}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg
            className="mr-1 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>
      </div>

      {/* Offline Status Banner */}
      <OfflineStatusBanner
        onSyncComplete={handleSyncComplete}
        className="mb-4"
      />

      <h1 className="mb-4 text-2xl font-bold">Escáner</h1>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Spinner color="info" size="sm" />
          <span>Cargando almacén...</span>
        </div>
      )}

      {warehouse && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{warehouse.WarehouseName}</h2>
            <div className="mt-1 flex items-center gap-2">
              {/* Online/Offline indicator */}
              <Badge
                color={online ? "success" : "warning"}
                className="flex items-center gap-1"
              >
                {online ? (
                  <>
                    <HiOutlineCloud className="h-3 w-3" /> En línea
                  </>
                ) : (
                  <>
                    <HiOutlineDatabase className="h-3 w-3" /> Offline
                  </>
                )}
              </Badge>

              {/* Cache status */}
              {cacheStatus.valid && (
                <Badge color="info" className="flex items-center gap-1">
                  <HiOutlineDatabase className="h-3 w-3" />
                  {cacheStatus.productCount} productos en caché
                </Badge>
              )}
            </div>
          </div>

          {/* Refresh cache button */}
          <button
            onClick={handleRefreshCache}
            disabled={!online || cacheStatus.loading}
            className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              !online || cacheStatus.loading
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
            }`}
            title="Actualizar caché de productos"
          >
            <HiOutlineCloudDownload
              className={`h-4 w-4 ${cacheStatus.loading ? "animate-bounce" : ""}`}
            />
            {cacheStatus.loading ? "Cargando..." : "Actualizar caché"}
          </button>
        </div>
      )}

      {/* Operation type selector */}
      <div className="mt-4 mb-4 max-w-md">
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo de operación:
        </span>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setOperationType("entrada")}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              operationType === "entrada"
                ? "border-green-600 bg-green-600 text-white"
                : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Recepción
          </button>
          <button
            type="button"
            onClick={() => setOperationType("salida")}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              operationType === "salida"
                ? "border-red-600 bg-red-600 text-white"
                : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Despacho
          </button>
        </div>
      </div>

      {/* Scanner input */}
      <div className="mb-4 max-w-md">
        <div className="mb-2 block">
          <Label htmlFor="scanner-input">Escanee el código:</Label>
        </div>
        <TextInput
          id="scanner-input"
          ref={inputRef}
          type="text"
          placeholder={
            isBlocked
              ? "⛔ Sincronice antes de continuar"
              : operationType === "entrada"
                ? "🔍 Escanear código para ENTRADA"
                : "🔍 Escanear código para SALIDA"
          }
          value={scannedCode}
          onChange={(e) => setScannedCode(e.target.value)}
          onKeyDown={handleScanSubmit}
          disabled={isBlocked}
          color={
            isBlocked
              ? "gray"
              : operationType === "entrada"
                ? "success"
                : "failure"
          }
          className={`rounded-xl border-none px-5 py-3 text-lg font-semibold shadow-md transition-all duration-200 focus:shadow-lg focus:outline-none ${
            isBlocked
              ? "cursor-not-allowed bg-gray-100 ring-2 ring-gray-300"
              : operationType === "entrada"
                ? "bg-green-50 ring-2 ring-green-500 placeholder:text-green-700 focus:ring-4 focus:ring-green-300 dark:bg-green-900 dark:ring-green-400 dark:placeholder:text-green-200"
                : "bg-red-50 ring-2 ring-red-500 placeholder:text-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-900 dark:ring-red-400 dark:placeholder:text-red-200"
          }`}
          icon={CiBarcode}
        />
      </div>

      {/* Scan result badge */}
      {scanResult && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              scanResult.status === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : scanResult.status === "queued"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                  : scanResult.status === "error"
                    ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
            }`}
          >
            {scanResult.status === "success"
              ? "✔"
              : scanResult.status === "queued"
                ? "📥"
                : scanResult.status === "error"
                  ? "✖"
                  : "⚠"}{" "}
            {scanResult.message}
          </span>
        </div>
      )}

      {/* Scan history */}
      <div className="mt-6 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">Historial de escaneos:</h2>
        <div className="space-y-4">
          {scanHistory.slice(0, 20).map((entry, idx) => (
            <div
              key={`${entry.timestamp}-${idx}`}
              className={`rounded-lg border p-4 shadow-sm ${
                entry.status === "success"
                  ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-950"
                  : entry.status === "queued"
                    ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                    : entry.status === "error"
                      ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-950"
                      : "border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {entry.product?.barcode || entry.barcode}
                  </span>
                  {entry.queued && (
                    <Badge color="info" size="xs">
                      Pendiente
                    </Badge>
                  )}
                  {entry.queued && !entry.verified && (
                    <Badge color="warning" size="xs">
                      No verificado
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                {entry.message}
              </p>

              {entry.product?.name && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Producto:</strong> {entry.product.name}
                  </p>
                </div>
              )}

              {entry.inventory !== undefined && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Cantidad en almacén:</strong> {entry.inventory}
                  </p>
                </div>
              )}
            </div>
          ))}

          {scanHistory.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No hay escaneos registrados aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScannerPage;
