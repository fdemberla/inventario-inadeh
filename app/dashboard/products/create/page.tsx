"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Category {
  CategoryID: number;
  CategoryName: string;
}

interface Unit {
  UnitID: number;
  SystemName: string;
  UnitName: string;
}

interface Supplier {
  SupplierID: number;
  SupplierName: string;
}

interface SupplierEntry {
  supplierID: number;
  supplierSKU: string;
  leadTimeDays: number;
  cost: number;
  isPrimarySupplier: boolean;
}

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [image, setImage] = useState<File | null>(null);
  const [form, setForm] = useState({
    productName: "",
    sku: "",
    description: "",
    barcode: "",
    categoryID: "",
    cost: "0.00",
    unitID: "",
  });

  const [supplierList, setSupplierList] = useState<SupplierEntry[]>([]);

  const [selectedSystem, setSelectedSystem] = useState("");

  const systemOptions = [...new Set(units.map((u) => u.System))];
  const filteredUnits = units.filter((u) => u.System === selectedSystem);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((response) => setCategories(response));
    fetch("/api/units")
      .then((res) => res.json())
      .then((response) => setUnits(response));
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((response) => setSuppliers(response));
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = () => {
    setSupplierList((prev) => [
      ...prev,
      {
        supplierID: suppliers[0]?.SupplierID ?? 0,
        supplierSKU: "",
        leadTimeDays: 0,
        cost: 0,
        isPrimarySupplier: false,
      },
    ]);
  };

  const handleSupplierChange = (
    index: number,
    key: keyof SupplierEntry,
    value: unknown,
  ) => {
    const updated = [...supplierList];
    updated[index][key] =
      key === "isPrimarySupplier" ? value.target.checked : value.target.value;
    setSupplierList(updated);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("productName", form.productName);
    formData.append("sku", form.sku);
    formData.append("description", form.description);
    formData.append("barcode", form.barcode);
    formData.append("categoryID", form.categoryID);
    formData.append("cost", form.cost);
    formData.append("unitID", form.unitID);
    if (image) formData.append("image", image);
    formData.append("suppliers", JSON.stringify(supplierList));

    const res = await fetch("/api/products/create", {
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
                // Reset form for new entry
                setForm({
                  productName: "",
                  sku: "",
                  description: "",
                  barcode: "",
                  categoryID: "",
                  cost: "0.00",
                  unitID: "",
                });
                setSelectedSystem("");
                setSupplierList([]);
                setImage(null);
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
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-900"
    >
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Nuevo Producto
      </h1>

      {/* Imagen */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen del producto
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
        />
      </div>

      {/* Nombre, SKU, Descripción, Código de Barras */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del producto
          </label>
          <input
            name="productName"
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            SKU (Codigo ISTMO)
          </label>
          <input
            name="sku"
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <textarea
          name="description"
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          rows={3}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Código de barras (Fabricante)
        </label>
        <input
          name="barcode"
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Categoría, Costo */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoría
          </label>
          <select
            name="categoryID"
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccione una categoría</option>
            {categories.map((cat) => (
              <option key={cat.CategoryID} value={cat.CategoryID}>
                {cat.CategoryName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Costo
          </label>
          <input
            name="cost"
            type="number"
            step="0.01"
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        {/* Selector de Sistema */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sistema de unidades
          </label>
          <select
            value={selectedSystem}
            onChange={(e) => {
              setSelectedSystem(e.target.value);
              setFormData((prev) => ({ ...prev, unitID: "" }));
            }}
            required
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccione un sistema</option>
            {systemOptions.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Unidad */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unidad
          </label>
          <select
            name="unitID"
            value={form.unitID}
            onChange={handleChange}
            disabled={!selectedSystem}
            required
            className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
          >
            <option value="">Seleccione una unidad</option>
            {filteredUnits.map((unit) => (
              <option key={unit.UnitID} value={unit.UnitID}>
                {unit.UnitName} ({unit.Abbreviation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Proveedores */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Proveedores
        </h2>
        <div className="space-y-4">
          {supplierList.map((sup, i) => (
            <div
              key={i}
              className="space-y-3 rounded border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <select
                value={sup.supplierID}
                onChange={(e) => handleSupplierChange(i, "supplierID", e)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.SupplierID} value={s.SupplierID}>
                    {s.SupplierName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="SKU del proveedor"
                value={sup.supplierSKU}
                onChange={(e) => handleSupplierChange(i, "supplierSKU", e)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Días de entrega"
                value={sup.leadTimeDays}
                onChange={(e) => handleSupplierChange(i, "leadTimeDays", e)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Costo"
                value={sup.cost}
                step="0.01"
                onChange={(e) => handleSupplierChange(i, "cost", e)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sup.isPrimarySupplier}
                  onChange={(e) =>
                    handleSupplierChange(i, "isPrimarySupplier", e)
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Proveedor principal
                </span>
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddSupplier}
          className="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          + Agregar proveedor
        </button>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          Crear producto
        </button>
      </div>
    </form>
  );
}
