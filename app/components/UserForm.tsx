"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  Input,
  Card,
} from "@/app/components/ui";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

interface UserFormProps {
  userId?: string | string[];
  isEditMode?: boolean;
}

interface FormDataType {
  Username: string;
  Password?: string;
  RoleID: string | number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  IsActive: boolean;
  Warehouses?: Array<{ WarehouseID: number }>;
  WarehouseIDs: number[];
}

interface Role {
  RoleID: number;
  RoleName: string;
}

interface Warehouse {
  WarehouseID: number;
  WarehouseCode: string;
  WarehouseName: string;
}

export default function UserForm({
  userId,
  isEditMode = false,
}: UserFormProps) {
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<FormDataType>({
    Username: "",
    Password: "",
    RoleID: "",
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    IsActive: true,
    WarehouseIDs: [],
  });

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

    setFormData((prev) => ({
      ...prev,
      Phone: value,
    }));
  };

  useEffect(() => {
    async function fetchData() {
      const loadingToast = toast.loading(
        isEditMode
          ? "Cargando datos del usuario..."
          : "Cargando roles y depósitos...",
      );
      try {
        const requests: Promise<Response>[] = [
          fetch(withBasePath("/api/roles")),
          fetch(withBasePath("/api/warehouses")),
        ];

        if (isEditMode && userId) {
          requests.push(fetch(withBasePath(`/api/users/${userId}`)));
        }

        const responses = await Promise.all(requests);
        const rolesData = await responses[0].json();
        const whData = await responses[1].json();

        setRoles(rolesData.roles || []);
        setWarehouses(whData.warehouses.recordset || []);

        if (isEditMode && userId && responses[2]) {
          const userData = await responses[2].json();
          setFormData({
            ...userData.user,
            WarehouseIDs:
              userData.user.Warehouses?.map((w: Warehouse) => w.WarehouseID) ||
              [],
          });
        }

        toast.success(
          isEditMode
            ? "Datos cargados con éxito."
            : "Roles y depósitos cargados con éxito.",
        );
      } catch (err) {
        console.error("Error loading data", err);
        toast.error("Error cargando los datos.");
      } finally {
        setLoading(false);
        toast.dismiss(loadingToast);
      }
    }

    fetchData();
  }, [userId, isEditMode]);

  // Auto-generate username from first and last name
  useEffect(() => {
    if (!isEditMode) {
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
    }
  }, [formData.FirstName, formData.LastName, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "text" || name === "RoleID" ? value : value,
    }));
  };

  const handleCheckboxChange = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName as keyof FormDataType],
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

    try {
      // Validate password if provided
      if (formData.Password && formData.Password.trim() !== "") {
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
      } else if (!isEditMode) {
        // Password is required for create mode
        toast.error(
          "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
        );
        setSubmitting(false);
        return;
      }

      const submittedData = { ...formData };
      if (
        isEditMode &&
        (!submittedData.Password || submittedData.Password.trim() === "")
      ) {
        delete submittedData.Password;
      }

      const endpoint = isEditMode
        ? `/api/users/${userId}/update`
        : "/api/users/create";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(withBasePath(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al procesar la solicitud.");
      }

      toast.success(
        isEditMode
          ? "Usuario actualizado con éxito."
          : "Usuario creado con éxito.",
      );
      router.push("/dashboard/users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div role="status" aria-label="Cargando...">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );

  return (
    <Card className="w-full">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Nombre"
            id="FirstName"
            name="FirstName"
            value={formData.FirstName}
            onChange={handleChange}
            required
          />
          <FormField
            label="Apellido"
            id="LastName"
            name="LastName"
            value={formData.LastName}
            onChange={handleChange}
            required
          />
          <FormField
            label="Teléfono"
            id="Phone"
            name="Phone"
            value={formData.Phone}
            onChange={handlePhoneChange}
            maxLength={9}
            placeholder="1234-5678"
            required
          />
          <FormField
            label="Correo electrónico"
            id="Email"
            type="email"
            name="Email"
            value={formData.Email}
            placeholder="usuario@correo.com"
            onChange={handleChange}
            required
          />
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Nombre de usuario"
            id="Username"
            name="Username"
            readOnly
            disabled
            value={formData.Username}
            className="disabled:cursor-not-allowed bg-white/20 dark:bg-gray-800/20"
            helperText="Generado automáticamente"
          />

          <div className="w-full space-y-2">
            <div className="flex items-center gap-1">
              <label htmlFor="Password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              {!isEditMode && (
                <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
              )}
            </div>
            <div className="relative">
              <Input
                id="Password"
                type={showPassword ? "text" : "password"}
                name="Password"
                value={formData.Password || ""}
                onChange={handleChange}
                placeholder={isEditMode ? "En blanco para mantener" : ""}
                required={!isEditMode}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Al menos 8 caracteres, una letra y un número.
            </p>
          </div>
        </div>

        {/* Status and Role */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="IsActive"
              checked={formData.IsActive}
              onChange={() => handleCheckboxChange("IsActive")}
              className="h-4 w-4 rounded border-gray-300 text-brand-azul accent-brand-azul focus:ring-brand-azul cursor-pointer"
            />
            <label htmlFor="IsActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Usuario activo
            </label>
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="RoleID" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rol <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
            </label>
            <select
              id="RoleID"
              name="RoleID"
              value={formData.RoleID}
              onChange={handleChange}
              required
              className="w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((r: Role) => (
                <option key={r.RoleID} value={r.RoleID}>
                  {r.RoleName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warehouses */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-t border-white/20 dark:border-white/10 pt-4">Depósitos asignados</p>
          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {warehouses.map((w: Warehouse) => {
              const isSelected = formData.WarehouseIDs.includes(w.WarehouseID);
              return (
                <label 
                  key={w.WarehouseID} 
                  className={`relative flex cursor-pointer items-start justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm ${
                    isSelected
                      ? "border-brand-azul bg-brand-azul/10 ring-2 ring-brand-azul/50 dark:border-brand-azul dark:bg-brand-azul/20"
                      : "border-white/40 bg-white/30 hover:bg-white/50 dark:border-white/10 dark:bg-gray-800/40 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {w.WarehouseCode}
                    </span>
                    <span className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {w.WarehouseName}
                    </span>
                  </div>
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      id={`warehouse-${w.WarehouseID}`}
                      checked={isSelected}
                      onChange={() => handleWarehouseChange(w.WarehouseID)}
                      className="h-5 w-5 rounded border-gray-300 text-brand-azul focus:ring-brand-azul dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 cursor-pointer"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center pt-6 border-t border-white/20 dark:border-white/10">
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={submitting}
            className="w-full"
          >
            {isEditMode ? "Actualizar Usuario" : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
