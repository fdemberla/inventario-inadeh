"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  HiOutlineStatusOnline,
  HiOutlineStatusOffline,
  HiRefresh,
  HiExclamation,
} from "react-icons/hi";
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
            ? `✓ ${result.synced} escaneo(s) sincronizado(s)`
            : "Todo está sincronizado",
        );
      } else {
        const errorMsg =
          result.errors.length > 0
            ? result.errors[0]
            : `${result.failed} error(es), ${result.conflicts} conflicto(s)`;
        setLastSyncMessage(`⚠ ${errorMsg}`);
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

  // Determine banner color based on status
  const getBannerStyle = () => {
    if (!online) {
      return "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200";
    }
    if (blockingStatus?.shouldBlock) {
      return "bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-200";
    }
    if (blockingStatus?.warningLevel === "high") {
      return "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900 dark:border-orange-600 dark:text-orange-200";
    }
    if (stats && stats.pendingCount > 0) {
      return "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200";
    }
    return "bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200";
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
    <div className={`rounded-lg border p-3 ${getBannerStyle()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Online/Offline indicator */}
          <div className="flex items-center gap-1">
            {online ? (
              <HiOutlineStatusOnline className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <HiOutlineStatusOffline className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
            <span className="text-sm font-medium">
              {online ? "En línea" : "Sin conexión"}
            </span>
          </div>

          {/* Pending count */}
          {stats && stats.pendingCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-semibold">
                {stats.pendingCount} pendiente
                {stats.pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Conflicts indicator */}
          {stats && stats.unresolvedConflicts > 0 && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <HiExclamation className="h-4 w-4" />
              <span className="text-xs font-medium">
                {stats.unresolvedConflicts} conflicto
                {stats.unresolvedConflicts !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Blocking message */}
          {blockingStatus?.reason && (
            <span className="text-xs">{blockingStatus.reason}</span>
          )}

          {/* Sync message */}
          {lastSyncMessage && (
            <span className="text-xs font-medium">{lastSyncMessage}</span>
          )}
        </div>

        {/* Sync button */}
        {online && stats && stats.pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              syncing
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <HiRefresh className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        )}
      </div>

      {/* Last sync time */}
      {stats?.lastSuccessfulSync && (
        <div className="mt-1 text-xs opacity-75">
          Última sincronización:{" "}
          {new Date(stats.lastSuccessfulSync).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
