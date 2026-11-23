"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Card, Button, FormField } from "@/app/components/ui";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryID, setParentCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const categoryRes = await fetch(withBasePath(`/api/categories/${id}`));
        const categoryData = await categoryRes.json();
        setCategoryName(categoryData.category.CategoryName || "");
        setDescription(categoryData.category.Description || "");
        setParentCategoryID(categoryData.category.ParentCategoryID || null);

        const categoriesRes = await fetch(withBasePath("/api/categories"));
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar la categoría.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath(`/api/categories/${id}/update`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          description,
          parentCategoryID,
        }),
      });

      if (res.ok) {
        toast.success("Categoría actualizada correctamente.");
        router.push("/dashboard/categories");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al actualizar.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Algo salió mal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div role="status" aria-label="Cargando...">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out border border-white/40 bg-white/50 dark:border-white/10 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus-visible:border-transparent focus-visible:bg-white dark:focus-visible:bg-gray-800 focus-visible:ring-2 focus-visible:ring-brand-azul focus-visible:outline-none";

  return (
    <PageLayout
      title="Editar Categoría"
      subtitle="Actualice los datos de la categoría."
      backButton={{ href: "/dashboard/categories", label: "Volver a categorías" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Categorías", href: "/dashboard/categories" },
        { label: "Editar" },
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
