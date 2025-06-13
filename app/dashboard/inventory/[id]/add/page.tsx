// "use client";
// import React, { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { toast } from "react-hot-toast";

// function AddProductToWarehouse() {
//   const params = useParams();
//   const router = useRouter();
//   const warehouseId = params?.id as string;

//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [formData, setFormData] = useState({
//     productId: "",
//     newQuantity: 0,
//     quantityReserved: 0,
//     reorderLevel: null,
//     lastStockedDate: new Date().toISOString().slice(0, 16),
//   });

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const res = await fetch("/api/products");
//         const data = await res.json();
//         setProducts(data.products);
//       } catch (error) {
//         console.error("Error al obtener productos", error);
//         toast.error("Error al obtener productos");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]:
//         name === "productId" || name === "reorderLevel" ? value : Number(value),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);

//     try {
//       const response = await fetch("/api/inventory/update", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           ...formData,
//           warehouseId: warehouseId,
//           productId: parseInt(formData.productId),
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Error al actualizar inventario");
//       }

//       toast.success("Inventario Actualizado Satisfactoriamente!");
//       router.push(`/dashboard/inventory/update`);
//     } catch (error) {
//       console.error("Error:", error);
//       toast.error("Error al actualizar inventario");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return <div>Loading products...</div>;
//   }

//   return (
//     <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
//       <h1 className="mb-6 text-2xl font-bold">Agregar Producto a Deposito</h1>

//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label
//             htmlFor="productId"
//             className="mb-1 block text-sm font-medium text-gray-700"
//           >
//             Producto
//           </label>
//           <select
//             id="productId"
//             name="productId"
//             value={formData.productId}
//             onChange={handleChange}
//             className="w-full rounded-md border border-gray-300 p-2"
//             required
//           >
//             <option value="">Seleccione un Producto</option>
//             {products.map((product) => (
//               <option key={product.ProductID} value={product.ProductID}>
//                 {product.ProductName}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="mb-4">
//           <label
//             htmlFor="quantityOnHand"
//             className="mb-1 block text-sm font-medium text-gray-700"
//           >
//             Cantidad
//           </label>
//           <input
//             type="number"
//             id="newQuantity"
//             name="newQuantity"
//             min="0"
//             value={formData.quantityOnHand}
//             onChange={handleChange}
//             className="w-full rounded-md border border-gray-300 p-2"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label
//             htmlFor="reorderLevel"
//             className="mb-1 block text-sm font-medium text-gray-700"
//           >
//             Cantidad minima para Ordenar (opcional)
//           </label>
//           <input
//             type="number"
//             id="reorderLevel"
//             name="reorderLevel"
//             min="0"
//             value={formData.reorderLevel || ""}
//             onChange={handleChange}
//             className="w-full rounded-md border border-gray-300 p-2"
//           />
//         </div>

//         <div className="mb-4">
//           <label
//             htmlFor="lastStockedDate"
//             className="mb-1 block text-sm font-medium text-gray-700"
//           >
//             Fecha
//           </label>
//           <input
//             type="datetime-local"
//             id="lastStockedDate"
//             name="lastStockedDate"
//             value={formData.lastStockedDate}
//             onChange={handleChange}
//             className="w-full rounded-md border border-gray-300 bg-gray-200 p-2"
//             disabled={true}
//           />
//         </div>

//         <div className="flex justify-end">
//           <button
//             type="button"
//             onClick={() => router.push(`/dashboard/inventory/update`)}
//             className="mr-2 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={submitting}
//             className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
//           >
//             {submitting ? "Procesando..." : "Agregar a Inventario"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AddProductToWarehouse;

"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Spinner } from "flowbite-react";

// Componente de búsqueda de productos optimizado para móvil
const ProductSearchSelect = ({
  products,
  value,
  onChange,
  placeholder = "Buscar producto...",
  name = "productId",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filtrar productos basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 50)); // Limitar a 50 inicialmente
    } else {
      const filtered = products
        .filter((product) =>
          product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 20); // Limitar resultados de búsqueda
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Encontrar producto seleccionado
  useEffect(() => {
    if (value) {
      const product = products.find(
        (p) => p.ProductID.toString() === value.toString(),
      );
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [value, products]);

  const handleSelect = (product) => {
    setSelectedProduct(product);
    onChange({
      target: {
        name: name,
        value: product.ProductID.toString(),
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedProduct(null);
    onChange({
      target: {
        name: name,
        value: "",
      },
    });
    setSearchTerm("");
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Componente de modal para móvil
  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Header del modal */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Seleccionar Producto
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative mt-3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto">
          {searchTerm && filteredProducts.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              No se encontraron productos
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <button
                  key={product.ProductID}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {product.ProductName} - {product.Barcode}
                    </span>
                    {selectedProduct?.ProductID === product.ProductID && (
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer con botón de confirmar si hay selección */}
        {selectedProduct && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Confirmar: {selectedProduct.ProductName}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Vista colapsada (campo de selección)
  return (
    <div
      onClick={handleToggle}
      className="flex min-h-[48px] w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-3 active:bg-gray-50"
    >
      <div className="flex min-w-0 flex-1 items-center">
        {selectedProduct ? (
          <div className="flex w-full items-center justify-between">
            <span className="truncate pr-2 text-gray-900">
              {selectedProduct.ProductName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="flex-shrink-0 rounded p-1 hover:bg-gray-100"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-gray-500">Seleccione un Producto</span>
        )}
      </div>
      <svg
        className="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
};

function AddProductToWarehouse() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState({});
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
        console.error("Error al obtener productos", error);
        toast.error("Error al obtener productos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!params?.id) return;
      setLoading(true);
      const toastId = toast.loading("Cargando almacén...");
      try {
        const res = await fetch(`/api/warehouses/${params.id}`);
        if (!res.ok) throw new Error("Error al cargar el almacén.");
        const data = await res.json();
        setWarehouse(data.warehouse); // Asumimos que el API devuelve el objeto del almacén
        toast.success("Almacén cargado correctamente", { id: toastId });
      } catch (err) {
        toast.error((err as Error).message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [params?.id]);

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
        throw new Error("Error al actualizar inventario");
      }

      toast.success("Inventario Actualizado Satisfactoriamente!");
      router.push(`/dashboard/inventory/update`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar inventario");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          {loading && (
            <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Spinner color="info" size="sm" />
              <span>Cargando almacén...</span>
            </div>
          )}

          {warehouse && (
            <div className="mt-4 mb-4">
              <h2 className="text-xl font-semibold">
                {warehouse.WarehouseName}
              </h2>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            {/* Selector de producto */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Producto *
              </label>
              <ProductSearchSelect
                products={products}
                value={formData.productId}
                onChange={handleChange}
                name="productId"
                placeholder="Buscar producto..."
              />
            </div>

            {/* Cantidad */}
            <div>
              <label
                htmlFor="newQuantity"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cantidad *
              </label>
              <input
                type="number"
                id="newQuantity"
                name="newQuantity"
                min="0"
                value={formData.newQuantity}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Nivel de reorden */}
            <div>
              <label
                htmlFor="reorderLevel"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cantidad mínima para ordenar (opcional)
              </label>
              <input
                type="number"
                id="reorderLevel"
                name="reorderLevel"
                min="0"
                value={formData.reorderLevel || ""}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Fecha */}
            <div>
              <label
                htmlFor="lastStockedDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Fecha
              </label>
              <input
                type="datetime-local"
                id="lastStockedDate"
                name="lastStockedDate"
                value={formData.lastStockedDate}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-3 text-base"
                disabled={true}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !formData.productId}
                className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                onClick={handleSubmit}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Procesando...
                  </div>
                ) : (
                  "Agregar a Inventario"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/dashboard/inventory`)}
                className="w-full rounded-md bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProductToWarehouse;
