"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ProductForm from "@/app/components/ProductForm";
import { useEffect, useState } from "react";
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

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(withBasePath(`/api/products/${id}`));
      const data = await res.json();
      const product = data.product;
      setInitialData(product);
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        productName: data.productName,
        sku: data.sku,
        description: data.description,
        categoryID: parseInt(data.categoryID),
        barcode: data.barcode,
        cost: parseFloat(data.cost),
        unitID: parseInt(data.unitID),
        unitSystem: data.unitSystem,
        suppliers: data.suppliers,
      };

      const res = await fetch(withBasePath(`/api/products/${id}/update`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Producto editado exitosamente!");
        router.push("/dashboard/products");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al editar producto.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Algo salió mal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return loading ? (
    <h1>Loading</h1>
  ) : (
    <ProductForm
      initialData={initialData}
      onSubmit={handleSubmit}
      formTitle="Editar Producto"
      submitButtonText="Guardar cambios"
      showIstmoSearch={false}
      isSubmitting={isSubmitting}
    />
  );
}
