"use client";
import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { Filter } from "lucide-react";
import { useParams } from "next/navigation";
import TarjetaGroup from "@/app/components/reports/TarjetaGroup";
import ExcelExportButton from "@/app/components/reports/BotonExportar";

const COLORES = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const PanelReportesAlmacen = () => {
  const params = useParams();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [listaCategoria, setCategoria] = useState([]);

  const [almacenActual, setAlmacenActual] = useState(null);
  const [nivelesInventario, setNivelesInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [valorInventario, setValorInventario] = useState([]);
  const [alertasStockBajo, setAlertasStockBajo] = useState([]);
  const [loading, setLoading] = useState(true);

  // Referencias para los charts
  const nivelInventarioRef = useRef(null);
  const movimientoStockRef = useRef(null);
  const valorInventarioRef = useRef(null);

  // Instancias de los charts
  const chartInstances = useRef({});

  // Función para destruir chart existente
  const destroyChart = (chartKey) => {
    if (chartInstances.current[chartKey]) {
      chartInstances.current[chartKey].destroy();
      chartInstances.current[chartKey] = null;
    }
  };

  useEffect(() => {
    const fetchReportData = async () => {
      if (!params.id) return;

      try {
        setLoading(true);

        // Fetch all data in parallel
        const responses = await Promise.all([
          fetch(`/api/warehouses/${params.id}`),
          fetch(`/api/categories`),
          fetch(
            `/api/reports/${params.id}/niveles?category=${categoriaSeleccionada}`,
          ),
          fetch(
            `/api/reports/${params.id}/movimiento?category=${categoriaSeleccionada}`,
          ),
          fetch(
            `/api/reports/${params.id}/valor?category=${categoriaSeleccionada}`,
          ),
          fetch(
            `/api/reports/${params.id}/alerta?category=${categoriaSeleccionada}`,
          ),
        ]);

        // Parse all responses
        const [
          infoWarehouse,
          categorias,
          niveles,
          movimientos,
          valor,
          alertas,
        ] = await Promise.all(responses.map((res) => res.json()));

        // Update all state
        setAlmacenActual(infoWarehouse);
        setCategoria(categorias);
        setNivelesInventario(niveles);
        setMovimientos(movimientos);
        setValorInventario(valor);
        setAlertasStockBajo(alertas);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [params.id, categoriaSeleccionada]);

  useEffect(() => {
    const createAllCharts = () => {
      createInventoryLevelsChart();
      createStockMovementChart();
      createInventoryValueChart();
    };

    const createInventoryLevelsChart = () => {
      if (!nivelesInventario.length || !nivelInventarioRef.current) return;

      destroyChart("inventory");
      const ctx = nivelInventarioRef.current.getContext("2d");

      chartInstances.current.inventory = new Chart(ctx, {
        type: "bar",
        data: {
          labels: nivelesInventario.map((item) => item.name),
          datasets: [
            {
              label: "Stock Actual",
              data: nivelesInventario.map((item) => item.nivel),
              backgroundColor: "#3B82F6",
              borderColor: "#3B82F6",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" } },
          scales: { y: { beginAtZero: true } },
          indexAxis: "y",
        },
      });
    };

    const createStockMovementChart = () => {
      if (!movimientos.length || !movimientoStockRef.current) return;

      destroyChart("movement");
      const ctx = movimientoStockRef.current.getContext("2d");

      chartInstances.current.movement = new Chart(ctx, {
        type: "line",
        data: {
          labels: movimientos.map((item) => item.date),
          datasets: [
            {
              label: "Entradas",
              data: movimientos.map((item) => item.inbound),
              borderColor: "#10B981",
              backgroundColor: "#10B981",
              tension: 0.1,
            },
            {
              label: "Salidas",
              data: movimientos.map((item) => item.outbound),
              borderColor: "#EF4444",
              backgroundColor: "#EF4444",
              tension: 0.1,
            },
            {
              label: "Cambio Neto",
              data: movimientos.map((item) => item.net),
              borderColor: "#3B82F6",
              backgroundColor: "#3B82F6",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" } },
          scales: { y: { beginAtZero: true } },
        },
      });
    };

    const createInventoryValueChart = () => {
      if (!valorInventario.length || !valorInventarioRef.current) return;

      destroyChart("value");
      const ctx = valorInventarioRef.current.getContext("2d");

      chartInstances.current.value = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: valorInventario.map((item) => item.name),
          datasets: [
            {
              data: valorInventario.map((item) => item.value),
              backgroundColor: COLORES,
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.parsed;
                  const percentage =
                    valorInventario[context.dataIndex].percentage;
                  return `${context.label}: $${(value / 1000).toFixed(0)}K (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    };

    // Create all charts when any data changes
    createAllCharts();
  }, [nivelesInventario, movimientos, valorInventario]);

  // Efecto para crear los gráficos cuando el componente se monta
  useEffect(() => {
    // Cleanup al desmontar
    return () => {
      Object.values(chartInstances.current).forEach((chart) => {
        if (chart) chart.destroy();
      });
    };
  }, []);

  // return (
  //   <div className="min-h-screen bg-gray-50 p-6">
  //     <div className="mx-auto max-w-7xl">
  //       {/* Header */}
  //       <div className="mb-8">
  //         <h1 className="mb-2 text-3xl font-bold text-gray-900">
  //           Reportes de Almacén
  //         </h1>
  //         <p className="text-gray-600">
  //           Análisis integral y perspectivas de gestión de inventario
  //         </p>
  //       </div>

  //       {/* Controles */}
  //       <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
  //         <div className="flex flex-wrap items-center gap-4">
  //           <div className="flex items-center gap-2">
  //             <Filter className="h-5 w-5 text-gray-500" />
  //             <select
  //               value={categoriaSeleccionada}
  //               onChange={(e) => setCategoriaSeleccionada(e.target.value)}
  //               className="rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //             >
  //               <option value="todas">Todas las Categorías</option>
  //               <option value="electronicos">Electrónicos</option>
  //               <option value="ropa">Ropa</option>
  //               <option value="hogar">Hogar y Jardín</option>
  //               <option value="deportes">Deportes</option>
  //               <option value="libros">Libros</option>
  //             </select>
  //           </div>
  //           <button className="ml-auto flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
  //             <Download className="h-4 w-4" />
  //             Exportar Datos
  //           </button>
  //         </div>
  //       </div>

  //       <TarjetaGroup id={params.id} />

  //       {/* Grilla de Gráficos */}
  //       <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
  //         {/* Niveles de Stock Actuales */}
  //         <div className="rounded-lg bg-white p-6 shadow-md">
  //           <h3 className="mb-4 text-lg font-semibold text-gray-900">
  //             Niveles de Stock Actuales
  //           </h3>
  //           <div className="h-[300px]">
  //             <canvas ref={nivelInventarioRef}></canvas>
  //           </div>
  //         </div>

  //         {/* Tendencias de Movimiento de Stock */}
  //         <div className="rounded-lg bg-white p-6 shadow-md">
  //           <h3 className="mb-4 text-lg font-semibold text-gray-900">
  //             Movimiento Diario de Stock
  //           </h3>
  //           <div className="h-[300px]">
  //             <canvas ref={movimientoStockRef}></canvas>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
  //         {/* Distribución de Valor de Inventario */}
  //         <div className="rounded-lg bg-white p-6 shadow-md">
  //           <h3 className="mb-4 text-lg font-semibold text-gray-900">
  //             Valor de Inventario por Categoría
  //           </h3>
  //           <div className="h-[250px]">
  //             <canvas ref={valorInventarioRef}></canvas>
  //           </div>
  //         </div>

  //         {/* Alertas de Stock Bajo */}
  //         <div className="rounded-lg bg-white p-6 shadow-md">
  //           <h3 className="mb-4 text-lg font-semibold text-gray-900">
  //             Alertas de Stock Bajo
  //           </h3>
  //           <div className="space-y-3">
  //             {alertasStockBajo.map((item, index) => (
  //               <div
  //                 key={index}
  //                 className={`rounded-md border-l-4 p-3 ${
  //                   item.Status === "critical"
  //                     ? "border-red-500 bg-red-50"
  //                     : "border-yellow-500 bg-yellow-50"
  //                 }`}
  //               >
  //                 <div className="flex items-center justify-between">
  //                   <div>
  //                     <p className="font-medium text-gray-900">
  //                       {item.ProductName}
  //                     </p>
  //                     <p className="text-sm text-gray-600">
  //                       Reordenar en: {item.ReorderLevel}
  //                     </p>
  //                   </div>
  //                   <div className="text-right">
  //                     <p
  //                       className={`font-bold ${
  //                         item.Status === "critical"
  //                           ? "text-red-600"
  //                           : "text-yellow-600"
  //                       }`}
  //                     >
  //                       {item.QuantityOnHand}
  //                     </p>
  //                     <p className="text-xs text-gray-500">en stock</p>
  //                   </div>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          {almacenActual && (
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Reportes de {almacenActual.warehouse.WarehouseName}
            </h1>
          )}

          <p className="text-gray-600">
            Análisis integral y perspectivas de gestión de inventario
          </p>
        </div>

        {/* Controles */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              {loading ? (
                <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
              ) : (
                <select
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="todas">-- Categorias --</option>
                  {listaCategoria.map((categoria) => (
                    <option
                      value={categoria.CategoryID}
                      key={categoria.CategoryID}
                    >
                      {categoria.CategoryName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <ExcelExportButton
              warehouseId={parseInt(params.id)}
              className={`ml-auto flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors ${
                loading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            />
          </div>
        </div>

        {/* Tarjetas */}
        {loading ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-md bg-gray-200 shadow"
              />
            ))}
          </div>
        ) : (
          <TarjetaGroup id={params.id} category={categoriaSeleccionada} />
        )}

        {/* Grilla de Gráficos */}
        <div className="mb-8 grid grid-cols-1 gap-6">
          {[nivelInventarioRef, movimientoStockRef].map((ref, idx) => (
            <div key={idx} className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {idx === 0
                  ? "Niveles de Stock Actuales"
                  : "Movimiento Diario de Stock"}
              </h3>
              <div className="h-[500px]">
                {loading ? (
                  <div className="h-full w-full animate-pulse rounded bg-gray-200" />
                ) : (
                  <canvas ref={ref}></canvas>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Valor de Inventario */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Valor de Inventario por Categoría
            </h3>
            <div className="h-[400px]">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded bg-gray-200" />
              ) : (
                <canvas ref={valorInventarioRef}></canvas>
              )}
            </div>
          </div>

          {/* Alertas de Stock Bajo */}
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-md lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Alertas de Stock Bajo
            </h3>
            <div className="space-y-3">
              {loading
                ? [...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-md bg-gray-200"
                    />
                  ))
                : alertasStockBajo.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-md border-l-4 p-3 ${
                        item.Status === "critical"
                          ? "border-red-500 bg-red-50"
                          : "border-yellow-500 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.ProductName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reordenar en: {item.ReorderLevel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              item.Status === "critical"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {item.QuantityOnHand}
                          </p>
                          <p className="text-xs text-gray-500">en stock</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelReportesAlmacen;
