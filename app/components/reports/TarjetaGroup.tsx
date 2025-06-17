import React, { useEffect, useState } from "react";
import { DollarSign, Package, AlertTriangle } from "lucide-react";
import TarjetaEstadistica from "./TarjetaEstadistica";

function TarjetaGroup({ id, category }) {
  const [data, setData] = useState({
    valorTotal: { value: 0 },
    productosEnInventario: { count: 0 },
    stockBajo: { count: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/reports/${id}/tarjetas?category=${category}`,
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching warehouse data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, category]);

  // Función para formatear el valor en dólares
  const formatCurrency = (value) => {
    if (value) {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      } else {
        return `$${value.toFixed(0)}`;
      }
    }
    return 0;
  };

  // Función para formatear números
  const formatNumber = (value) => {
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded border border-red-400 bg-red-100 p-4 text-red-700">
        Error cargando datos: {error}
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <TarjetaEstadistica
        titulo="Valor Total de Inventario"
        valor={formatCurrency(data.valorTotal.value)}
        icon={DollarSign}
      />
      <TarjetaEstadistica
        titulo="Articulos Activos"
        valor={formatNumber(data.productosEnInventario.count)}
        icon={Package}
      />
      <TarjetaEstadistica
        titulo="Artículos Stock Bajo"
        valor={formatNumber(data.stockBajo.count)}
        icon={AlertTriangle}
      />
    </div>
  );
}

export default TarjetaGroup;
