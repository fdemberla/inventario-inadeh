"use client";

import { useState, useEffect } from "react";
import {
  Label,
  TextInput,
  Textarea,
  Select,
  Button,
  Card,
  Spinner,
} from "flowbite-react";
import { toast } from "react-hot-toast"; // <-- Import toast
import { withBasePath } from "@/lib/utils";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function CreateCategoryPage() {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryID, setParentCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✨ New state for loading

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
    setIsSubmitting(true); // ✨ Start loading

    try {
      const res = await fetch(withBasePath("/api/categories/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName, description, parentCategoryID }),
      });

      if (res.ok) {
        toast.success("Category created successfully!");

        // Reset form
        setCategoryName("");
        setDescription("");
        setParentCategoryID(null);

        // Optionally refresh categories
        const refreshCategories = async () => {
          const res = await fetch(withBasePath("/api/categories"));
          const data = await res.json();
          setCategories(data);
        };
        await refreshCategories();
      } else {
        const data = await res.json();
        toast.error(data.message || "Error creating category.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false); // ✨ Stop loading
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h1 className="mb-6 text-center text-2xl font-bold dark:text-white">
          Crear Nueva Categoria
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="categoryName" defaultValue="Category Name" />
            <TextInput
              id="categoryName"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Nombre de Categoria"
            />
          </div>

          <div>
            <Label
              htmlFor="parentCategory"
              defaultValue="Categoria Principal (Opcional)"
            />
            <Select
              id="parentCategory"
              value={parentCategoryID ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setParentCategoryID(value ? parseInt(value) : null);
              }}
            >
              <option value="">Categoria Principal (Opcional)</option>
              {categories.map((cat) => (
                <option key={cat.CategoryID} value={cat.CategoryID}>
                  {cat.CategoryName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label
              htmlFor="description"
              defaultValue="Descripcion (Opcional)"
            />
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escriba una Descripcion"
            />
          </div>

          <Button
            type="submit"
            className="flex w-full items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Creando Producto...
              </>
            ) : (
              "Crear Categoria"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
