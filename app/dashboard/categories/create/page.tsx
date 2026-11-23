"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Card, Button, FormField, Input } from "@/app/components/ui";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function CreateCategoryPage() {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryID, setParentCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(withBasePath("/api/categories"));
      const data = await res.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath("/api/categories/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName, description, parentCategoryID }),
      });

      if (res.ok) {
        toast.success("Categoría creada exitosamente.");

        // Reset form
        setCategoryName("");
        setDescription("");
        setParentCategoryID(null);

        // Refresh categories
        const refreshRes = await fetch(withBasePath("/api/categories"));
        const refreshData = await refreshRes.json();
        setCategories(refreshData);
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al crear la categoría.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out border border-white/40 bg-white/50 dark:border-white/10 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus-visible:border-transparent focus-visible:bg-white dark:focus-visible:bg-gray-800 focus-visible:ring-2 focus-visible:ring-brand-azul focus-visible:outline-none";

  return (
    <PageLayout
      title="Crear Categoría"
      subtitle="Complete los datos para registrar una nueva categoría."
      backButton={{ href: "/dashboard/categories", label: "Volver a categorías" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Categorías", href: "/dashboard/categories" },
        { label: "Crear" },
      ]}
    >
      <Card className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Nombre de Categoría"
              id="categoryName"
              name="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej. Herramientas"
              required
            />

            <div className="w-full space-y-1.5">
              <label htmlFor="parentCategory" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Categoría Principal (Opcional)
              </label>
              <select
                id="parentCategory"
                value={parentCategoryID ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setParentCategoryID(value ? parseInt(value) : null);
                }}
                className={inputClass}
              >
                <option value="">Ninguna (Nivel Superior)</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escriba una descripción detallada"
              className={inputClass}
            />
          </div>

          <div className="pt-4 border-t border-white/20 dark:border-white/10 text-center">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Crear Categoría
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
