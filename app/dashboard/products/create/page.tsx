"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ProductForm from "@/app/components/ProductForm";
import { withBasePath } from "@/lib/utils";

interface SupplierEntry {
  supplierID: number;
  supplierSKU: string;
  leadTimeDays: number;
  cost: number;
  isPrimarySupplier: boolean;
}

interface ProductFormData {
  productName: string;
  sku: string;
  description: string;
  barcode: string;
  categoryID: string;
  cost: string;
  unitID: string;
  unitSystem: string;
  image?: File;
  suppliers: SupplierEntry[];
}

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "image" && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    if (data.image) formData.append("image", data.image);
    formData.append("suppliers", JSON.stringify(data.suppliers));

    const res = await fetch(withBasePath("/api/products/create"), {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      toast.success("Producto creado exitosamente.");

      toast.custom((t) => (
        <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-2 text-sm font-medium text-gray-800">
            ¿Desea agregar otro producto?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.refresh();
              }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Agregar otro
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.push("/dashboard/products");
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      ));
    } else {
      toast.error(result.message || "Error al crear el producto.");
    }
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      formTitle="Nuevo Producto"
      submitButtonText="Crear producto"
      showIstmoSearch={true}
    />
  );
}
