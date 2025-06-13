// "use client";
// import { useState, useEffect } from "react";
// // import { TextInput, Button, Label, Textarea, Select } from "flowbite-react";
// import { useParams, useRouter } from "next/navigation";
// import { toast } from "react-hot-toast";

// export default function EditProduct() {
//   const [productName, setProductName] = useState("");
//   const [sku, setSku] = useState("");
//   const [description, setDescription] = useState("");
//   const [barcode, setBarcode] = useState("");
//   const [categoryID, setCategoryID] = useState("");
//   const [categories, setCategories] = useState([]);
//   const [cost, setCost] = useState("0.00");
//   const [unitSystem, setUnitSystem] = useState("");
//   const [unitID, setUnitID] = useState("");
//   const [units, setUnits] = useState([]);
//   const [image, setImage] = useState<File | null>(null);

//   const { id } = useParams();

//   const [suppliers, setSuppliers] = useState([]);
//   const [productSuppliers, setProductSuppliers] = useState([
//     {
//       supplierID: "",
//       supplierSKU: "",
//       leadTimeDays: "0",
//       isPrimarySupplier: true,
//     },
//   ]);

//   const router = useRouter();

//   useEffect(() => {
//     const fetchCategories = async () => {
//       const res = await fetch("/api/categories");
//       const data = await res.json();
//       setCategories(data);
//     };

//     const fetchUnits = async () => {
//       const res = await fetch("/api/units");
//       const data = await res.json();
//       setUnits(data);
//     };

//     const fetchSuppliers = async () => {
//       const res = await fetch("/api/suppliers");
//       const data = await res.json();
//       setSuppliers(data);
//     };

//     const fetchProduct = async () => {
//       const res = await fetch(`/api/products/${id}`);
//       const data = await res.json();
//       const product = data.product;
//       setProductName(product.ProductName);
//       setSku(product.InternalSKU);
//       setDescription(product.Description);
//       setBarcode(product.Barcode);
//       setCategoryID(product.CategoryID);
//       setCost(product.Cost);
//       setUnitID(product.UnitID);
//       setProductSuppliers(product.suppliers);
//       setUnitSystem(product.UnitSystem);

//       // // Set unit system based on unit data
//       // const unit = data.units.find((u) => u.UnitID === product.UnitID);
//       // if (unit) {
//       //   setUnitSystem(unit.System);
//       // }
//     };

//     fetchCategories();
//     fetchUnits();
//     fetchSuppliers();
//     fetchProduct();
//   }, [id]);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setImage(e.target.files[0]);
//       console.log(image);
//     }
//   };

//   const handleSupplierChange = (
//     index: number,
//     field: string,
//     value: unknown,
//   ) => {
//     const newSuppliers = [...productSuppliers];
//     newSuppliers[index][field] =
//       field === "isPrimarySupplier" ? value === "true" : value;
//     setProductSuppliers(newSuppliers);
//   };

//   const addSupplier = () => {
//     setProductSuppliers([
//       ...productSuppliers,
//       {
//         supplierID: "",
//         supplierSKU: "",
//         leadTimeDays: "0",
//         isPrimarySupplier: false,
//       },
//     ]);
//   };

//   const removeSupplier = (index: number) => {
//     const updated = productSuppliers.filter((_, i) => i !== index);
//     setProductSuppliers(updated);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const payload = {
//         productName,
//         sku,
//         description,
//         categoryID: parseInt(categoryID),
//         barcode,
//         cost: parseFloat(cost),
//         unitID: parseInt(unitID),
//         unitSystem,
//         suppliers: productSuppliers,
//       };

//       const res = await fetch(`/api/products/${id}/update`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         toast.success("Producto editado exitosamente!");
//         router.push("/dashboard");
//       } else {
//         const data = await res.json();
//         toast.error(data.message || "Error al editar producto.");
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error("Algo salió mal.");
//     }
//   };

//   const systems = Array.from(new Set(units.map((u) => u.System)));
//   const filteredUnits = units.filter((u) => u.System === unitSystem);

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="mx-auto max-w-4xl space-y-8 rounded-lg bg-white p-8 shadow-md"
//     >
//       <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
//         Editar Producto
//       </h1>

//       {/* Imagen */}
//       <div>
//         <label className="mb-1 block text-sm font-medium text-gray-700">
//           Imagen del producto
//         </label>
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleImageChange}
//           className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
//         />
//       </div>

//       {/* Información del producto */}
//       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Nombre del producto
//           </label>
//           <input
//             value={productName}
//             onChange={(e) => setProductName(e.target.value)}
//             required
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">SKU</label>
//           <input
//             value={sku}
//             onChange={(e) => setSku(e.target.value)}
//             required
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">
//           Descripción
//         </label>
//         <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           rows={3}
//         />
//       </div>

//       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Costo (USD)
//           </label>
//           <input
//             type="number"
//             step="0.01"
//             value={cost}
//             onChange={(e) => setCost(e.target.value)}
//             required
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Código de Barras
//           </label>
//           <input
//             value={barcode}
//             onChange={(e) => setBarcode(e.target.value)}
//             required
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Categoría
//           </label>
//           <select
//             value={categoryID}
//             onChange={(e) => setCategoryID(e.target.value)}
//             required
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           >
//             <option value="">Seleccione una categoría</option>
//             {categories.map((cat) => (
//               <option key={cat.CategoryID} value={cat.CategoryID}>
//                 {cat.CategoryName}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Sistema de Unidad
//           </label>
//           <select
//             value={unitSystem}
//             onChange={(e) => {
//               setUnitSystem(e.target.value);
//               setUnitID("");
//             }}
//             className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//           >
//             <option value="">Seleccione un sistema</option>
//             {systems.map((sys) => (
//               <option key={sys} value={sys}>
//                 {sys}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">
//           Unidad
//         </label>
//         <select
//           value={unitID}
//           onChange={(e) => setUnitID(e.target.value)}
//           disabled={!unitSystem}
//           className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100"
//         >
//           <option value="">Seleccione una unidad</option>
//           {filteredUnits.map((u) => (
//             <option key={u.UnitID} value={u.UnitID}>
//               {u.UnitName} ({u.Abbreviation})
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Proveedores */}
//       <div>
//         <h2 className="mb-2 text-lg font-semibold text-gray-800">
//           Proveedores
//         </h2>
//         {productSuppliers.map((ps, index) => (
//           <div
//             key={index}
//             className="mb-4 space-y-4 rounded-md border border-gray-300 bg-gray-50 p-4"
//           >
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Proveedor
//               </label>
//               <select
//                 value={ps.supplierID}
//                 onChange={(e) =>
//                   handleSupplierChange(index, "supplierID", e.target.value)
//                 }
//                 required
//                 className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//               >
//                 <option value="">Seleccione un proveedor</option>
//                 {suppliers.map((s) => (
//                   <option key={s.SupplierID} value={s.SupplierID}>
//                     {s.SupplierName}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 SKU del Proveedor
//               </label>
//               <input
//                 value={ps.supplierSKU}
//                 onChange={(e) =>
//                   handleSupplierChange(index, "supplierSKU", e.target.value)
//                 }
//                 className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Tiempo de Entrega (días)
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 value={ps.leadTimeDays}
//                 onChange={(e) =>
//                   handleSupplierChange(index, "leadTimeDays", e.target.value)
//                 }
//                 className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 ¿Proveedor Primario?
//               </label>
//               <select
//                 value={ps.isPrimarySupplier ? "true" : "false"}
//                 onChange={(e) =>
//                   handleSupplierChange(
//                     index,
//                     "isPrimarySupplier",
//                     e.target.value,
//                   )
//                 }
//                 className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//               >
//                 <option value="true">Sí</option>
//                 <option value="false">No</option>
//               </select>
//             </div>
//             {productSuppliers.length > 1 && (
//               <div className="text-right">
//                 <button
//                   type="button"
//                   onClick={() => removeSupplier(index)}
//                   className="text-sm text-red-600 hover:underline"
//                 >
//                   Eliminar proveedor
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//         <button
//           type="button"
//           onClick={addSupplier}
//           className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
//         >
//           Añadir Proveedor
//         </button>
//       </div>

//       {/* Botón Submit */}
//       <div className="text-center">
//         <button
//           type="submit"
//           className="rounded bg-purple-600 px-6 py-2 text-white shadow-md hover:bg-purple-700"
//         >
//           Guardar Cambios
//         </button>
//       </div>
//     </form>
//   );
// }

"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ProductForm from "@/app/components/ProductForm";
import { useEffect, useState } from "react";

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      const product = data.product;
      setInitialData(product);
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (data: any) => {
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

      const res = await fetch(`/api/products/${id}/update`, {
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
