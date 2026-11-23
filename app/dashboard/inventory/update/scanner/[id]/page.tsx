"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Database,
  Inbox,
  RefreshCw,
  ScanBarcode,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Spinner,
  type BadgeTone,
} from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
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
          toast("Usando caché de productos anterior", { icon: <Database className="text-accent h-5 w-5" aria-hidden="true" /> });
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
        toast("Sin conexión - Modo offline activo", { icon: <WifiOff className="text-warning h-5 w-5" aria-hidden="true" /> });
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
        const res = await fetch(withBasePath(`/api/warehouses/${params.id}`));
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
            toast(result.message, { icon: <Inbox className="text-accent h-5 w-5" aria-hidden="true" />, duration: 3000 });
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

  const statusStyles: Record<string, { tone: BadgeTone; Icon: typeof CheckCircle2; label: string }> = {
    success: { tone: "success", Icon: CheckCircle2, label: "Registrado" },
    queued: { tone: "info", Icon: Inbox, label: "En cola" },
    error: { tone: "danger", Icon: XCircle, label: "Error" },
    warning: { tone: "warning", Icon: AlertTriangle, label: "Aviso" },
  };
  const isEntrada = operationType === "entrada";
  const operations = [
    { value: "entrada", label: "Recepción", hint: "Suma al stock", Icon: ArrowDownToLine },
    { value: "salida", label: "Despacho", hint: "Resta del stock", Icon: ArrowUpFromLine },
  ] as const;
  const currentResult = scanResult
    ? (statusStyles[scanResult.status] ?? statusStyles.warning)
    : null;

  return (
    <PageLayout
      title="Escáner"
      subtitle={warehouse?.WarehouseName}
      backButton={{ href: "/dashboard/inventory", label: "Volver a inventario" }}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Inventario", href: "/dashboard/inventory" },
        { label: "Escáner" },
      ]}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <OfflineStatusBanner onSyncComplete={handleSyncComplete} />

        {loading && (
          <div role="status" className="text-fg-muted flex items-center gap-2">
            <Spinner size="sm" /> Cargando almacén…
          </div>
        )}

        {warehouse && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={online ? "success" : "warning"}>
                {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
                {online ? "En línea" : "Sin conexión"}
              </Badge>
              {cacheStatus.valid && (
                <Badge tone="info">
                  <Database aria-hidden="true" />
                  {cacheStatus.productCount} productos en caché
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshCache}
              disabled={!online || cacheStatus.loading}
              isLoading={cacheStatus.loading}
              leftIcon={
                cacheStatus.loading ? undefined : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )
              }
            >
              {cacheStatus.loading ? "Actualizando…" : "Actualizar caché"}
            </Button>
          </div>
        )}

        <Card noPadding className="space-y-5 p-4 sm:p-6">
          {/* Native radios: arrow keys and screen-reader semantics for free */}
          <fieldset>
            <legend className="text-fg mb-2 text-sm font-semibold">Tipo de operación</legend>
            <div className="grid grid-cols-2 gap-3">
              {operations.map(({ value, label, hint, Icon }) => (
                <label key={value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="operation"
                    value={value}
                    checked={operationType === value}
                    onChange={() => setOperationType(value)}
                    className="peer sr-only"
                  />
                  <span
                    className={`border-line-strong text-fg peer-focus-visible:outline-focus flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
                      value === "entrada"
                        ? "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary"
                        : "peer-checked:border-danger peer-checked:bg-danger peer-checked:text-on-primary"
                    }`}
                  >
                    <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="flex flex-col leading-tight">
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs">{hint}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField
            label="Código de barras"
            helperText={
              isBlocked
                ? "Sincronice los escaneos pendientes antes de continuar."
                : `Escanee o escriba el código y presione Enter. Modo: ${isEntrada ? "Recepción (+1)" : "Despacho (−1)"}.`
            }
          >
            <Input
              ref={inputRef}
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={isBlocked ? "Bloqueado hasta sincronizar" : "Código de barras"}
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyDown={handleScanSubmit}
              disabled={isBlocked}
              icon={<ScanBarcode className="h-5 w-5" />}
              className={`text-lg font-semibold ${
                isBlocked ? "" : isEntrada ? "border-primary border-2" : "border-danger border-2"
              }`}
            />
          </FormField>

          {/* Always mounted so screen readers announce each result */}
          <div role="status" aria-live="polite" className="min-h-8">
            {scanResult && currentResult && (
              <Badge tone={currentResult.tone} className="px-3 py-1.5 text-sm whitespace-normal">
                <currentResult.Icon aria-hidden="true" />
                <span className="sr-only">{currentResult.label}: </span>
                {scanResult.message}
              </Badge>
            )}
          </div>
        </Card>

        <section aria-labelledby="scan-history-title">
          <h2 id="scan-history-title" className="text-fg mb-3 text-lg font-semibold">
            Historial de escaneos
          </h2>
          {scanHistory.length === 0 ? (
            <p className="border-line bg-surface text-fg-muted rounded-2xl border p-6 text-center">
              No hay escaneos registrados aún
            </p>
          ) : (
            <ul className="space-y-3">
              {scanHistory.slice(0, 20).map((entry, idx) => {
                const st = statusStyles[entry.status] ?? statusStyles.warning;
                return (
                  <li
                    key={`${entry.timestamp}-${idx}`}
                    className="border-line bg-surface rounded-2xl border p-4 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={st.tone}>
                          <st.Icon aria-hidden="true" />
                          {st.label}
                        </Badge>
                        <span className="text-fg font-mono text-sm font-medium">
                          {entry.product?.barcode || entry.barcode}
                        </span>
                        {entry.queued && <Badge tone="info">Pendiente</Badge>}
                        {entry.queued && !entry.verified && (
                          <Badge tone="warning">No verificado</Badge>
                        )}
                      </div>
                      <time dateTime={entry.timestamp} className="text-fg-muted text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                    <p className="text-fg text-sm">{entry.message}</p>
                    {entry.product?.name && (
                      <p className="text-fg mt-1 text-sm">
                        <strong>Producto:</strong> {entry.product.name}
                      </p>
                    )}
                    {entry.inventory !== undefined && (
                      <p className="text-fg-muted mt-1 text-sm">
                        <strong>Cantidad en almacén:</strong> {entry.inventory}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default ScannerPage;
