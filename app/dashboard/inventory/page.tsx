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
import { PageLayout } from "@/app/components/PageLayout";
import { Button } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

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
      const res = await fetch(withBasePath("/api/warehouses/user"));
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
      <PageLayout title="Gestión de Inventario">
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-t-brand-azul dark:border-t-brand-verde mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Cargando almacenes...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Gestión de Inventario"
      subtitle="Selecciona un depósito para continuar"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Inventario" },
      ]}
    >
      {/* Warehouse Selection Cards */}
      <div className="mb-6 space-y-3">
        {warehouses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
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
            <p className="text-gray-600 dark:text-gray-400">
              No hay depósitos disponibles
            </p>
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
                  ? "border-brand-azul dark:border-brand-verde bg-blue-50 shadow-md dark:bg-gray-700"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              } transform active:scale-95`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    {/* Warehouse Icon */}
                    <div
                      className={`flex-shrink-0 rounded-lg p-2 ${
                        selectedWarehouseId === warehouse.WarehouseID.toString()
                          ? "text-brand-azul dark:text-brand-verde bg-blue-100 dark:bg-gray-600"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
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
                            ? "text-brand-azul dark:text-brand-verde"
                            : "text-gray-900 dark:text-white"
                        } `}
                      >
                        {warehouse.WarehouseName}
                      </h3>
                      <p
                        className={`truncate text-sm ${
                          selectedWarehouseId ===
                          warehouse.WarehouseID.toString()
                            ? "text-brand-azul/70 dark:text-brand-verde/70"
                            : "text-gray-500 dark:text-gray-400"
                        } `}
                      >
                        Código: {warehouse.WarehouseCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="ml-3 flex-shrink-0">
                  {selectedWarehouseId === warehouse.WarehouseID.toString() ? (
                    <div className="bg-brand-azul dark:bg-brand-verde flex h-6 w-6 items-center justify-center rounded-full">
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
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Action Buttons */}
      {selectedWarehouseId && (
        <div className="space-y-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() =>
              router.push(
                withBasePath(
                  `/dashboard/inventory/${selectedWarehouseId}/add`,
                ),
              )
            }
            leftIcon={
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
            }
          >
            Agregar Producto a Depósito
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                router.push(
                  withBasePath(
                    `/dashboard/inventory/${selectedWarehouseId}/view`,
                  ),
                )
              }
              leftIcon={
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
              }
            >
              Ver Inventario
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() =>
                router.push(
                  withBasePath(`/dashboard/reports/${selectedWarehouseId}`),
                )
              }
              leftIcon={
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
              }
            >
              Reportes
            </Button>
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() =>
              router.push(
                withBasePath(
                  `/dashboard/inventory/update/scanner/${selectedWarehouseId}`,
                ),
              )
            }
            leftIcon={<BiBarcodeReader className="h-5 w-5" />}
          >
            Usar Scanner
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
