"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function AddProductToWarehouse() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    newQuantity: 0,
    quantityReserved: 0,
    reorderLevel: null,
    lastStockedDate: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "productId" || name === "reorderLevel" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/inventory/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          warehouseId: warehouseId,
          productId: parseInt(formData.productId),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add inventory");
      }

      toast.success("Inventory added successfully!");
      router.push(`/dashboard/inventory/update`);
    } catch (error) {
      console.error("Error adding inventory:", error);
      toast.error("Failed to add inventory");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold">Agregar Producto a Deposito</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="productId"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Producto
          </label>
          <select
            id="productId"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 p-2"
            required
          >
            <option value="">Seleccione un Producto</option>
            {products.map((product) => (
              <option key={product.ProductID} value={product.ProductID}>
                {product.ProductName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="quantityOnHand"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Cantidad
          </label>
          <input
            type="number"
            id="newQuantity"
            name="newQuantity"
            min="0"
            value={formData.quantityOnHand}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 p-2"
            required
          />
        </div>

        {/* <div className="mb-4">
          <label
            htmlFor="quantityReserved"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Quantity Reserved
          </label>
          <input
            type="number"
            id="quantityReserved"
            name="quantityReserved"
            min="0"
            value={formData.quantityReserved}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </div> */}

        <div className="mb-4">
          <label
            htmlFor="reorderLevel"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Cantidad minima para Ordenar (opcional)
          </label>
          <input
            type="number"
            id="reorderLevel"
            name="reorderLevel"
            min="0"
            value={formData.reorderLevel || ""}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="lastStockedDate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Fecha
          </label>
          <input
            type="datetime-local"
            id="lastStockedDate"
            name="lastStockedDate"
            value={formData.lastStockedDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-gray-200 p-2"
            disabled={true}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/inventory/update`)}
            className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? "Procesando..." : "Agregar a Inventario"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductToWarehouse;
