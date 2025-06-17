"use client";

import { useState } from "react";

interface BotonExportarProps {
  warehouseId: number;
  className?: string;
  children?: React.ReactNode;
}

export default function BotonExportar({
  warehouseId,
  className = "",
  children = "Exportar a Excel",
}: BotonExportarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      const response = await fetch(`/api/reports/${warehouseId}/exportar`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al exportar");
      }

      // Obtener el blob de la respuesta
      const blob = await response.blob();

      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> temporal para la descarga
      const link = document.createElement("a");
      link.href = url;

      // Obtener el nombre del archivo de los headers (si está disponible)
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `inventario_deposito_${warehouseId}_${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;

      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar la URL del blob
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar el archivo. Por favor, intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 ${className} `}
    >
      {isExporting ? (
        <>
          <svg
            className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Exportando...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {children}
        </>
      )}
    </button>
  );
}
