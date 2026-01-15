"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Label,
  TextInput,
  Select,
  Checkbox,
  Spinner,
} from "flowbite-react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

export default function CreateUserPage() {
  const router = useRouter();

  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to control password visibility

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove non-numeric characters
    value = value.replace(/\D/g, "");

    // Validate phone number length (7 or 8 digits)
    if (value.length > 8) {
      return;
    }

    // Automatically insert the hyphen after the 4th digit
    if (value.length > 4) {
      value = `${value.slice(0, 4)}-${value.slice(4)}`;
    }

    // Update formData with the formatted phone number
    setFormData((prev) => ({
      ...prev,
      Phone: value,
    }));
  };

  const [formData, setFormData] = useState({
    Username: "",
    Password: "",
    RoleID: "",
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    IsActive: true,
    WarehouseIDs: [] as number[],
  });

  useEffect(() => {
    async function fetchData() {
      const loadingToast = toast.loading("Cargando roles y depósitos...");
      try {
        const [rolesRes, whRes] = await Promise.all([
          fetch(withBasePath("/api/roles")),
          fetch(withBasePath("/api/warehouses")),
        ]);
        const rolesData = await rolesRes.json();
        const whData = await whRes.json();
        setRoles(rolesData.roles || []);
        setWarehouses(whData.warehouses.recordset || []);

        toast.success("Roles y depósitos cargados con éxito.");
      } catch (err) {
        console.error("Error loading data", err);
        toast.error("Error cargando roles o depósitos.");
      } finally {
        setLoading(false);
        toast.dismiss(loadingToast);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const sanitize = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");

    const first = sanitize(formData.FirstName);
    const last = sanitize(formData.LastName);

    if (first || last) {
      setFormData((prev) => ({
        ...prev,
        Username: `${first}.${last}`,
      }));
    }
  }, [formData.FirstName, formData.LastName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleWarehouseChange = (id: number) => {
    setFormData((prev) => {
      const isSelected = prev.WarehouseIDs.includes(id);
      const newIds = isSelected
        ? prev.WarehouseIDs.filter((wid) => wid !== id)
        : [...prev.WarehouseIDs, id];
      return { ...prev, WarehouseIDs: newIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const passwordValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(
      formData.Password,
    );

    if (!passwordValid) {
      toast.error(
        "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(withBasePath("/api/users/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Error al crear el usuario.");
      }

      toast.success("Usuario creado con éxito.");
      router.push(withBasePath("/dashboard/users"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );

  // return (
  //   <div className="max-w-xl p-6">
  //     <h1 className="mb-4 text-2xl font-bold">Crear Usuario</h1>

  //     <form onSubmit={handleSubmit} className="space-y-4">
  //       <div>
  //         <Label htmlFor="FirstName">Nombre</Label>
  //         <TextInput name="FirstName" onChange={handleChange} />
  //       </div>

  //       <div>
  //         <Label htmlFor="LastName">Apellido</Label>
  //         <TextInput name="LastName" onChange={handleChange} />
  //       </div>

  //       <div>
  //         <Label htmlFor="Phone">Teléfono</Label>
  //         <TextInput
  //           name="Phone"
  //           value={formData.Phone}
  //           onChange={handlePhoneChange}
  //           maxLength={9} // Allow a maximum of 9 characters (for landlines and cellphones)
  //         />
  //       </div>

  //       <div>
  //         <Label htmlFor="Email">Correo electrónico</Label>
  //         <TextInput
  //           type="email"
  //           name="Email"
  //           placeholder="Email"
  //           onChange={handleChange}
  //         />
  //       </div>

  //       <div className="mt-9">
  //         <Label htmlFor="Username" className="mt-3">
  //           Nombre de usuario
  //         </Label>
  //         <TextInput
  //           name="Username"
  //           readOnly
  //           value={formData.Username}
  //           required
  //           disabled
  //           placeholder="Usuario"
  //         />
  //       </div>

  //       <div>
  //         <Label htmlFor="Password">Contraseña</Label>
  //         <TextInput
  //           type={showPassword ? "text" : "password"} // Toggle password visibility
  //           name="Password"
  //           required
  //           onChange={handleChange}
  //         />
  //         <p className="text-sm">
  //           Al menos 8 caracteres, una letra y un número.
  //         </p>
  //       </div>

  //       <div className="flex items-center">
  //         <Checkbox
  //           id="showPassword"
  //           onChange={() => setShowPassword(!showPassword)} // Toggle the password visibility
  //         />
  //         <Label htmlFor="showPassword" className="ml-2">
  //           Mostrar contraseña
  //         </Label>
  //       </div>

  //       <div>
  //         <Checkbox
  //           name="IsActive"
  //           checked={formData.IsActive}
  //           onChange={handleChange}
  //         />
  //         <Label htmlFor="IsActive" className="ml-2">
  //           Activo
  //         </Label>
  //       </div>

  //       <div>
  //         <Label htmlFor="RoleID">Rol</Label>
  //         <Select name="RoleID" required onChange={handleChange}>
  //           <option value="">Selecciona un rol</option>
  //           {roles.map((r) => (
  //             <option key={r.RoleID} value={r.RoleID}>
  //               {r.RoleName}
  //             </option>
  //           ))}
  //         </Select>
  //       </div>

  //       <div>
  //         <Label>Depósitos asignados</Label>
  //         <div className="mt-2 grid grid-cols-2 gap-2">
  //           {warehouses.map((w) => (
  //             <label key={w.WarehouseID} className="flex items-center">
  //               <Checkbox
  //                 checked={formData.WarehouseIDs.includes(w.WarehouseID)}
  //                 onChange={() => handleWarehouseChange(w.WarehouseID)}
  //               />
  //               <span className="ml-2">
  //                 {w.WarehouseCode} - {w.WarehouseName}
  //               </span>
  //             </label>
  //           ))}
  //         </div>
  //       </div>

  //       <Button type="submit" disabled={submitting} className="bg-brand-verde">
  //         {submitting ? "Creando..." : "Crear Usuario"}
  //       </Button>
  //     </form>
  //   </div>
  // );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-center text-3xl font-bold dark:text-white">
        Crear Usuario
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos personales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="FirstName">Nombre</Label>
            <TextInput
              name="FirstName"
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="LastName">Apellido</Label>
            <TextInput
              name="LastName"
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="Phone">Teléfono</Label>
            <TextInput
              name="Phone"
              value={formData.Phone}
              onChange={handlePhoneChange}
              maxLength={9}
              placeholder="1234-5678"
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="Email">Correo electrónico</Label>
            <TextInput
              type="email"
              name="Email"
              placeholder="usuario@correo.com"
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Credenciales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="Username">Nombre de usuario</Label>
            <TextInput
              name="Username"
              readOnly
              value={formData.Username}
              disabled
              className="mt-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="Password">Contraseña</Label>
            <TextInput
              type={showPassword ? "text" : "password"}
              name="Password"
              onChange={handleChange}
              required
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Al menos 8 caracteres, una letra y un número.
            </p>
            <div className="mt-2 flex items-center">
              <Checkbox
                id="showPassword"
                onChange={() => setShowPassword(!showPassword)}
              />
              <Label htmlFor="showPassword" className="ml-2">
                Mostrar contraseña
              </Label>
            </div>
          </div>
        </div>

        {/* Estado activo y rol */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center">
            <Checkbox
              name="IsActive"
              checked={formData.IsActive}
              onChange={handleChange}
            />
            <Label htmlFor="IsActive" className="ml-2">
              Usuario activo
            </Label>
          </div>

          <div>
            <Label htmlFor="RoleID" value="Rol" />
            <Select
              name="RoleID"
              required
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((r) => (
                <option key={r.RoleID} value={r.RoleID}>
                  {r.RoleName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Depósitos */}
        <div>
          <Label value="Depósitos asignados" />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {warehouses.map((w) => (
              <label key={w.WarehouseID} className="flex items-center">
                <Checkbox
                  checked={formData.WarehouseIDs.includes(w.WarehouseID)}
                  onChange={() => handleWarehouseChange(w.WarehouseID)}
                />
                <span className="ml-2 text-sm dark:text-white">
                  {w.WarehouseCode} - {w.WarehouseName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Botón de enviar */}
        <div className="text-center">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-verde w-full sm:w-auto"
          >
            {submitting ? "Creando..." : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </div>
  );
}
