"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Button, FormField } from "@/app/components/ui";

interface UnitFormProps {
  onSuccess?: (unit: { UnitName: string; Abbreviation: string | null }) => void;
  onCancel?: () => void;
  initialValues?: {
    unitName?: string;
    abbreviation?: string;
  };
  submitButtonText?: string;
  title?: string;
  apiEndpoint?: string;
  httpMethod?: "POST" | "PUT" | "PATCH";
  loadingMessage?: string;
  successMessage?: string;
  className?: string;
}

export default function UnitForm({
  onSuccess,
  onCancel,
  initialValues = {},
  submitButtonText = "Crear Unidad",
  title = "Nueva Unidad",
  apiEndpoint = "/api/units/create",
  httpMethod = "POST",
  loadingMessage = "Creando unidad...",
  successMessage = "Unidad creada exitosamente",
  className = "w-full p-6",
}: UnitFormProps) {
  const [unitName, setUnitName] = useState(initialValues.unitName || "");
  const [abbreviation, setAbbreviation] = useState(
    initialValues.abbreviation || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const toastId = toast.loading(loadingMessage);
    setIsSubmitting(true);

    try {
      const unitData = {
        UnitName: unitName.trim(),
        Abbreviation: abbreviation.trim() || null,
      };

      const res = await fetch(withBasePath(apiEndpoint), {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitData),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al procesar la unidad.", {
          id: toastId,
        });
        return;
      }

      toast.success(successMessage, { id: toastId });

      // Llamar callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess(unitData);
      }

      // Limpiar formulario después del éxito
      setUnitName("");
      setAbbreviation("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error del servidor.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={className}>
      {title && <h1 className="text-fg mb-4 text-xl font-bold">{title}</h1>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Nombre de la unidad"
          id="unitName"
          required
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          disabled={isSubmitting}
        />
        <FormField
          label="Abreviatura (opcional)"
          id="abbreviation"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1" 
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
