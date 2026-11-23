"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

const sanitizeFilename = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return cleaned.length > 0 ? cleaned : "reporte.xlsx";
};

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
      const response = await fetch(
        withBasePath(`/api/reports/${warehouseId}/exportar`),
      );

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
      const filename = sanitizeFilename(
        `inventario_deposito_${warehouseId}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      link.download = filename;

      // Iniciar descarga sin insertar el elemento en el DOM
      link.click();

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
    <Button
      variant="primary"
      onClick={handleExport}
      isLoading={isExporting}
      leftIcon={isExporting ? undefined : <Download className="h-5 w-5" aria-hidden="true" />}
      className={className}
    >
      {isExporting ? "Exportando..." : children}
    </Button>
  );
}
