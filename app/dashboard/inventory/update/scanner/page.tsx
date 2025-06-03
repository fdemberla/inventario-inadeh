// app/dashboard/inventory/update/scanner
"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Label, Select, Spinner, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import { CiBarcode } from "react-icons/ci";

function ScannerPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
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
    NombreWarehouse: string;
  }

  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);

  const [operationType, setOperationType] = useState<"entrada" | "salida">(
    "entrada",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const [scanResult, setScanResult] = useState<{
    status: "success" | "error" | "scan-error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      const toastId = toast.loading("Cargando almacenes...");
      try {
        const res = await fetch("/api/warehouses/user");
        if (!res.ok) throw new Error("Error al cargar almacenes.");
        const data = await res.json();
        const warehouseList = data.recordset ?? [];

        setWarehouses(warehouseList);
        if (warehouseList.length > 0)
          setSelectedWarehouse(warehouseList[0].WarehouseID);
        toast.success("Almacenes cargados correctamente", { id: toastId });
      } catch (err) {
        toast.error((err as Error).message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedWarehouse]);

  const handleScanSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scannedCode.trim() !== "") {
      const input = scannedCode.trim();

      setScannedCode("");
      setScanResult(null); // Limpiar estado previo

      const url = "/api/inventory/scanner";
      const payload = {
        barcode: input,
        warehouseId: selectedWarehouse,
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
          if (data?.internalErrorCode === 404) {
            setScanResult({
              status: "scan-error",
              message: `Código no encontrado: ${data.invalidBarcode}`,
            });

            toast.custom(
              (t) => (
                <div
                  className={`ring-opacity-5 pointer-events-auto w-full max-w-md rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ${
                    t.visible ? "animate-enter" : "animate-leave"
                  }`}
                >
                  <div className="flex flex-col space-y-3">
                    <p className="text-sm text-gray-800">
                      Este código de barras{" "}
                      <strong>{data.invalidBarcode}</strong> no existe en la
                      lista de productos registrados.
                    </p>
                    <p className="text-sm text-gray-600">
                      ¿Desea crear un nuevo producto con este código?
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          router.push("/dashboard/products/create");
                        }}
                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      >
                        Crear producto
                      </button>
                    </div>
                  </div>
                </div>
              ),
              { duration: Infinity },
            );
          } else {
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
          }
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

  // return (
  //   <div className="p-4">
  //     <h1 className="mb-4 text-2xl font-bold">Escáner</h1>

  //     {loading && (
  //       <div className="mb-4 flex items-center gap-2 text-blue-600">
  //         <Spinner color="info" size="sm" />
  //         <span>Cargando almacenes...</span>
  //       </div>
  //     )}

  //     {!loading && warehouses.length > 0 && (
  //       <div className="mb-4 max-w-md">
  //         <div className="mb-2 block">
  //           <Label htmlFor="warehouse" value="Seleccione un almacén:" />
  //         </div>
  //         <Select
  //           id="warehouse"
  //           value={selectedWarehouse ?? ""}
  //           onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
  //           required
  //         >
  //           {warehouses.map((wh: unknown) => (
  //             <option key={wh.WarehouseID} value={wh.WarehouseID}>
  //               {wh.NombreWarehouse ?? "Sin nombre"}
  //             </option>
  //           ))}
  //         </Select>
  //       </div>
  //     )}

  //     {selectedWarehouse !== null && (
  //       <>
  //         <div className="mt-4 mb-4 max-w-md">
  //           <span className="mb-2 block text-sm font-medium text-gray-700">
  //             Tipo de operación:
  //           </span>
  //           <div className="flex items-center gap-4">
  //             <span className="text-sm text-gray-700">Entrada</span>
  //             <label className="relative inline-flex cursor-pointer items-center">
  //               <input
  //                 type="checkbox"
  //                 className="peer sr-only"
  //                 checked={operationType === "salida"}
  //                 onChange={() =>
  //                   setOperationType((prev) =>
  //                     prev === "entrada" ? "salida" : "entrada",
  //                   )
  //                 }
  //               />
  //               <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-blue-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
  //             </label>
  //             <span className="text-sm text-gray-700">Salida</span>
  //           </div>
  //         </div>
  //         <div className="mb-4 max-w-md">
  //           <div className="mb-2 block">
  //             <Label htmlFor="scanner-input">Escanee el código:</Label>
  //           </div>
  //           <TextInput
  //             id="scanner-input"
  //             ref={inputRef}
  //             type="text"
  //             placeholder={
  //               operationType === "entrada"
  //                 ? "🔍 Escanear código para ENTRADA"
  //                 : "🔍 Escanear código para SALIDA"
  //             }
  //             value={scannedCode}
  //             onChange={(e) => setScannedCode(e.target.value)}
  //             onKeyDown={handleScanSubmit}
  //             color={operationType === "entrada" ? "success" : "failure"} // Flowbite color support
  //             className={`rounded-xl border-none px-5 py-3 text-lg font-semibold shadow-md transition-all duration-200 focus:shadow-lg focus:outline-none ${
  //               operationType === "entrada"
  //                 ? "bg-green-50 ring-2 ring-green-500 placeholder:text-green-700 focus:ring-4 focus:ring-green-300"
  //                 : "bg-red-50 ring-2 ring-red-500 placeholder:text-red-700 focus:ring-4 focus:ring-red-300"
  //             }`}
  //             icon={CiBarcode}
  //           />
  //         </div>

  //         {scanResult && (
  //           <div className="mt-2">
  //             <span
  //               className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
  //                 scanResult.status === "success"
  //                   ? "bg-green-100 text-green-800"
  //                   : scanResult.status === "error"
  //                     ? "bg-red-100 text-red-800"
  //                     : "bg-yellow-100 text-yellow-800"
  //               }`}
  //             >
  //               {scanResult.status === "success"
  //                 ? "✔"
  //                 : scanResult.status === "error"
  //                   ? "✖"
  //                   : "⚠"}{" "}
  //               {scanResult.message}
  //             </span>
  //           </div>
  //         )}

  //         <div className="max-w-2xl">
  //           <h2 className="mb-4 text-lg font-semibold">
  //             Historial de escaneos:
  //           </h2>
  //           <div className="space-y-4">
  //             {scanHistory.slice(0, 20).map((entry, idx) => (
  //               <div
  //                 key={idx}
  //                 className={`rounded-lg border p-4 shadow-sm ${
  //                   entry.status === "success"
  //                     ? "border-green-300 bg-green-50"
  //                     : entry.status === "error"
  //                       ? "border-red-300 bg-red-50"
  //                       : "border-yellow-300 bg-yellow-50"
  //                 }`}
  //               >
  //                 <div className="mb-2 flex justify-between">
  //                   <span className="text-sm font-medium text-gray-800">
  //                     {entry.product.barcode}
  //                   </span>
  //                   <span className="text-xs text-gray-500">
  //                     {new Date(entry.timestamp).toLocaleTimeString()}
  //                   </span>
  //                 </div>

  //                 <p className="mb-2 text-sm text-gray-700">{entry.message}</p>

  //                 {entry.product && (
  //                   <div className="text-sm text-gray-700">
  //                     <p>
  //                       <strong>Producto:</strong> {entry.product.name}
  //                     </p>
  //                   </div>
  //                 )}

  //                 {entry.inventory && (
  //                   <div className="mt-2 text-sm text-gray-600">
  //                     <p>
  //                       <strong>Cantidad en almacén:</strong>{" "}
  //                       {entry.inventory ?? 0}
  //                     </p>
  //                   </div>
  //                 )}
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </>
  //     )}
  //   </div>
  // );

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 dark:text-white">
      <h1 className="mb-4 text-2xl font-bold">Escáner</h1>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Spinner color="info" size="sm" />
          <span>Cargando almacenes...</span>
        </div>
      )}

      {!loading && warehouses.length > 0 && (
        <div className="mb-4 max-w-md">
          <div className="mb-2 block">
            <Label htmlFor="warehouse" value="Seleccione un almacén:" />
          </div>
          <Select
            id="warehouse"
            value={selectedWarehouse ?? ""}
            onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
            required
          >
            {warehouses.map((wh: unknown) => (
              <option key={wh.WarehouseID} value={wh.WarehouseID}>
                {wh.NombreWarehouse ?? "Sin nombre"}
              </option>
            ))}
          </Select>
        </div>
      )}

      {selectedWarehouse !== null && (
        <>
          <div className="mt-4 mb-4 max-w-md">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de operación:
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Entrada
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={operationType === "salida"}
                  onChange={() =>
                    setOperationType((prev) =>
                      prev === "entrada" ? "salida" : "entrada",
                    )
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-blue-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Salida
              </span>
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
            <h2 className="mb-4 text-lg font-semibold">
              Historial de escaneos:
            </h2>
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
                      {entry.product.barcode}
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
                        <strong>Cantidad en almacén:</strong>{" "}
                        {entry.inventory ?? 0}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ScannerPage;
