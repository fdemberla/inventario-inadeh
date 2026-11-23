"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/app/components/ui";
import {
  isOnline,
  subscribeToOnlineStatus,
  syncPendingScans,
  isSyncInProgress,
  getSyncStats,
  getBlockingStatus,
  SyncStats,
  BlockingStatus,
} from "@/lib/sync-service";

interface OfflineStatusBannerProps {
  onSyncComplete?: () => void;
  className?: string;
}

export default function OfflineStatusBanner({
  onSyncComplete,
  className = "",
}: OfflineStatusBannerProps) {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [blockingStatus, setBlockingStatus] = useState<BlockingStatus | null>(
    null,
  );
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const [newStats, newBlockingStatus] = await Promise.all([
        getSyncStats(),
        getBlockingStatus(),
      ]);
      setStats(newStats);
      setBlockingStatus(newBlockingStatus);
    } catch (error) {
      console.error("Error refreshing stats:", error);
    }
  }, []);

  useEffect(() => {
    // Initialize online status
    setOnline(isOnline());

    // Subscribe to online/offline changes
    const unsubscribe = subscribeToOnlineStatus((isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        refreshStats();
      }
    });

    // Initial stats load
    refreshStats();

    // Refresh stats periodically
    const interval = setInterval(refreshStats, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshStats]);

  const handleManualSync = async () => {
    if (syncing || isSyncInProgress()) return;

    setSyncing(true);
    setLastSyncMessage(null);

    try {
      const result = await syncPendingScans();

      if (result.success) {
        setLastSyncMessage(
          result.synced > 0
            ? `${result.synced} escaneo(s) sincronizado(s)`
            : "Todo está sincronizado",
        );
      } else {
        const errorMsg =
          result.errors.length > 0
            ? result.errors[0]
            : `${result.failed} error(es), ${result.conflicts} conflicto(s)`;
        setLastSyncMessage(errorMsg);
      }

      onSyncComplete?.();
      refreshStats();
    } catch (error) {
      setLastSyncMessage("Error al sincronizar");
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => setLastSyncMessage(null), 5000);
  };

  // Tone by status (semantic tokens; text/background ≥ 4.5:1 in both themes)
  const tone = !online
    ? "warning"
    : blockingStatus?.shouldBlock
      ? "danger"
      : blockingStatus?.warningLevel === "high"
        ? "warning"
        : stats && stats.pendingCount > 0
          ? "info"
          : "success";
  const toneClasses: Record<string, string> = {
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger-fg/40 bg-danger/10 text-danger-fg",
    info: "border-accent/30 bg-accent/10 text-accent",
    success: "border-success/30 bg-success/10 text-success",
  };

  // Don't show banner if online and no pending scans
  if (
    online &&
    stats?.pendingCount === 0 &&
    !blockingStatus?.shouldBlock &&
    !lastSyncMessage
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border p-3 ${toneClasses[tone]} ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {online ? (
              <Wifi className="h-5 w-5" aria-hidden="true" />
            ) : (
              <WifiOff className="h-5 w-5" aria-hidden="true" />
            )}
            {online ? "En línea" : "Sin conexión"}
          </span>

          {stats && stats.pendingCount > 0 && (
            <span className="bg-surface text-fg rounded-full px-2 py-0.5 text-xs font-semibold">
              {stats.pendingCount} pendiente{stats.pendingCount !== 1 ? "s" : ""}
            </span>
          )}

          {stats && stats.unresolvedConflicts > 0 && (
            <span className="text-danger-fg flex items-center gap-1 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {stats.unresolvedConflicts} conflicto{stats.unresolvedConflicts !== 1 ? "s" : ""}
            </span>
          )}

          {blockingStatus?.reason && <span className="text-sm">{blockingStatus.reason}</span>}

          {lastSyncMessage && <span className="text-sm font-medium">{lastSyncMessage}</span>}
        </div>

        {online && stats && stats.pendingCount > 0 && (
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            isLoading={syncing}
            variant="outline"
            size="sm"
            leftIcon={syncing ? undefined : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        )}
      </div>

      {stats?.lastSuccessfulSync && (
        <p className="text-fg-muted mt-1 text-xs">
          Última sincronización: {new Date(stats.lastSuccessfulSync).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
