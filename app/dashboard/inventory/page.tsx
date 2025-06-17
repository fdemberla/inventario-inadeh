// "use client";

// import { useEffect, useState } from "react";
// import { Label, Select, Button } from "flowbite-react";
// import { toast } from "react-hot-toast";
// import { useRouter } from "next/navigation";

// type Warehouse = {
//   WarehouseID: number;
//   WarehouseName: string;
//   WarehouseCode: string;
// };

// export default function InventoryPage() {
//   const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
//   const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
//     null,
//   );

//   useEffect(() => {
//     fetchWarehouses();
//   }, []);

//   const fetchWarehouses = async () => {
//     try {
//       const res = await fetch("/api/warehouses/user");
//       if (!res.ok) throw new Error("Error al cargar almacenes.");
//       const data = await res.json();
//       setWarehouses(data.recordset);
//       if (data.length > 0) setSelectedWarehouseId(data[0].WarehouseID);
//     } catch (err) {
//       toast.error((err as Error).message);
//     }
//   };

//   const router = useRouter();

//   return (
//     <div className="space-y-6 p-6">
//       <div>
//         <Label htmlFor="warehouse">Almacén</Label>
//         <Select
//           id="warehouse"
//           value={selectedWarehouseId || ""}
//           onChange={(e) => setSelectedWarehouseId(e.target.value)}
//         >
//           <option>-- Seleccione un Deposito --</option>
//           {warehouses.map((w) => (
//             <option key={w.WarehouseID} value={w.WarehouseID}>
//               {w.WarehouseName}
//             </option>
//           ))}
//         </Select>
//       </div>
//       {selectedWarehouseId && (
//         <Button
//           onClick={() =>
//             router.push(`/dashboard/inventory/${selectedWarehouseId}/add`)
//           }
//         >
//           Agregar Producto a Deposito
//         </Button>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BiBarcodeReader } from "react-icons/bi";

type Warehouse = {
  WarehouseID: number;
  WarehouseName: string;
  WarehouseCode: string;
};

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses/user");
      if (!res.ok) throw new Error("Error al cargar almacenes.");
      const data = await res.json();
      setWarehouses(data.recordset);
      if (data.recordset.length > 0) {
        setSelectedWarehouseId(data.recordset[0].WarehouseID.toString());
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando almacenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-gris min-h-screen p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Gestión de Inventario
          </h1>
          <p className="text-gray-600">Selecciona un depósito para continuar</p>
        </div>

        {/* Warehouse Selection Cards */}
        <div className="mb-6 space-y-3">
          {warehouses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <div className="mb-2 text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-gray-600">No hay depósitos disponibles</p>
            </div>
          ) : (
            warehouses.map((warehouse) => (
              <button
                key={warehouse.WarehouseID}
                onClick={() =>
                  setSelectedWarehouseId(warehouse.WarehouseID.toString())
                }
                className={`w-full rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                  selectedWarehouseId === warehouse.WarehouseID.toString()
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                } transform active:scale-95`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-3">
                      {/* Warehouse Icon */}
                      <div
                        className={`flex-shrink-0 rounded-lg p-2 ${
                          selectedWarehouseId ===
                          warehouse.WarehouseID.toString()
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        } `}
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>

                      {/* Warehouse Info */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`truncate font-semibold ${
                            selectedWarehouseId ===
                            warehouse.WarehouseID.toString()
                              ? "text-blue-900"
                              : "text-gray-900"
                          } `}
                        >
                          {warehouse.WarehouseName}
                        </h3>
                        <p
                          className={`truncate text-sm ${
                            selectedWarehouseId ===
                            warehouse.WarehouseID.toString()
                              ? "text-blue-600"
                              : "text-gray-500"
                          } `}
                        >
                          Código: {warehouse.WarehouseCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="ml-3 flex-shrink-0">
                    {selectedWarehouseId ===
                    warehouse.WarehouseID.toString() ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Action Button */}
        {selectedWarehouseId && (
          <div className="space-y-3">
            <button
              onClick={() =>
                router.push(`/dashboard/inventory/${selectedWarehouseId}/add`)
              }
              className="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Agregar Producto a Depósito</span>
              </div>
            </button>

            {/* Additional Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/inventory/${selectedWarehouseId}/view`,
                  )
                }
                className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="text-sm">Ver Inventario</span>
                </div>
              </button>

              <button
                onClick={() =>
                  router.push(`/dashboard/reports/${selectedWarehouseId}`)
                }
                className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-sm">Reportes</span>
                </div>
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/inventory/update/scanner/${selectedWarehouseId}`,
                  )
                }
                className="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800"
              >
                <div className="flex items-center justify-center space-x-2">
                  <BiBarcodeReader />
                  <span>Usar Scanner</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats (Optional) */}
        {selectedWarehouseId && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-500">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="py-2">
                <div className="text-lg font-bold text-blue-600">127</div>
                <div className="text-xs text-gray-500">Productos</div>
              </div>
              <div className="border-r border-l border-gray-200 py-2">
                <div className="text-lg font-bold text-green-600">15</div>
                <div className="text-xs text-gray-500">Stock Bajo</div>
              </div>
              <div className="py-2">
                <div className="text-lg font-bold text-orange-600">3</div>
                <div className="text-xs text-gray-500">Sin Stock</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
