"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Label, Spinner, TextInput } from "flowbite-react";
import { useRouter, useParams } from "next/navigation";
import { CiBarcode } from "react-icons/ci";

interface ScanEntry {
  barcode: string;
  status: "success" | "error" | "scan-error";
  message: string;
  product?: unknown;
  inventory?: number;
  timestamp: string;
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

  const inputRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<{
    status: "success" | "error" | "scan-error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!params?.id) return;
      setLoading(true);
      const toastId = toast.loading("Cargando almacén...");
      try {
        const res = await fetch(`/api/warehouses/${params.id}`);
        if (!res.ok) throw new Error("Error al cargar el almacén.");
        const data = await res.json();
        setWarehouse(data.warehouse); // Asumimos que el API devuelve el objeto del almacén
        toast.success("Almacén cargado correctamente", { id: toastId });
      } catch (err) {
        toast.error((err as Error).message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [params?.id]);

  useEffect(() => {
    if (warehouse && inputRef.current) {
      inputRef.current.focus();
    }
  }, [warehouse]);

  const handleScanSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scannedCode.trim() !== "") {
      const input = scannedCode.trim();
      setScannedCode("");
      setScanResult(null); // Limpiar estado previo

      const url = "/api/inventory/scanner";
      const payload = {
        barcode: input,
        warehouseId: warehouse?.WarehouseID,
        operation: operationType,
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setScanResult({
            status: "error",
            message: data.message || "Error al escanear el producto.",
          });
          setScanHistory((prev) => [
            {
              barcode: input,
              status: "success",
              message: data.message,
              product: data.product,
              inventory: data.quantity,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ]);
          toast.error(data.message || "Error al escanear el producto.", {
            duration: 5000,
          });
          return;
        }

        // Éxito
        setScanResult({
          status: "success",
          message: `Producto actualizado correctamente (${data.product?.name || "Producto"})`,
        });

        setScanHistory((prev) => [
          {
            barcode: input,
            status: "success",
            message: data.message,
            product: data.product,
            inventory: data.quantity,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Error en la solicitud:", err);
        setScanResult({
          status: "error",
          message: "Error al conectarse con el servidor.",
        });
        toast.error("Error al conectarse con el servidor.", { duration: 5000 });
      }

      // Limpiar badge después de 5 segundos
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 dark:text-white">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/inventory`)}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
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

      <h1 className="mb-4 text-2xl font-bold">Escáner</h1>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Spinner color="info" size="sm" />
          <span>Cargando almacén...</span>
        </div>
      )}

      {warehouse && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{warehouse.WarehouseName}</h2>
        </div>
      )}

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
                ? "border-blue-600 bg-blue-600 text-white"
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
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Despacho
          </button>
        </div>
      </div>

      <div className="mb-4 max-w-md">
        <div className="mb-2 block">
          <Label htmlFor="scanner-input">Escanee el código:</Label>
        </div>
        <TextInput
          id="scanner-input"
          ref={inputRef}
          type="text"
          placeholder={
            operationType === "entrada"
              ? "🔍 Escanear código para ENTRADA"
              : "🔍 Escanear código para SALIDA"
          }
          value={scannedCode}
          onChange={(e) => setScannedCode(e.target.value)}
          onKeyDown={handleScanSubmit}
          color={operationType === "entrada" ? "success" : "failure"}
          className={`rounded-xl border-none px-5 py-3 text-lg font-semibold shadow-md transition-all duration-200 focus:shadow-lg focus:outline-none ${
            operationType === "entrada"
              ? "bg-green-50 ring-2 ring-green-500 placeholder:text-green-700 focus:ring-4 focus:ring-green-300 dark:bg-green-900 dark:ring-green-400 dark:placeholder:text-green-200"
              : "bg-red-50 ring-2 ring-red-500 placeholder:text-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-900 dark:ring-red-400 dark:placeholder:text-red-200"
          }`}
          icon={CiBarcode}
        />
      </div>

      {scanResult && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              scanResult.status === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : scanResult.status === "error"
                  ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
            }`}
          >
            {scanResult.status === "success"
              ? "✔"
              : scanResult.status === "error"
                ? "✖"
                : "⚠"}{" "}
            {scanResult.message}
          </span>
        </div>
      )}

      <div className="max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">Historial de escaneos:</h2>
        <div className="space-y-4">
          {scanHistory.slice(0, 20).map((entry, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 shadow-sm ${
                entry.status === "success"
                  ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-950"
                  : entry.status === "error"
                    ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-950"
                    : "border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950"
              }`}
            >
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {entry.product?.barcode}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                {entry.message}
              </p>

              {entry.product && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Producto:</strong> {entry.product.name}
                  </p>
                </div>
              )}

              {entry.inventory && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Cantidad en almacén:</strong> {entry.inventory ?? 0}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScannerPage;
