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
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );

  return (
    <div
      className={isEditMode ? "max-w-xl p-6" : "mx-auto max-w-2xl px-4 py-6"}
    >
      <h1
        className={`mb-6 text-center font-bold ${isEditMode ? "text-2xl" : "text-3xl"} dark:text-white`}
      >
        {isEditMode ? "Editar Usuario" : "Crear Usuario"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="FirstName">Nombre</Label>
            <TextInput
              id="FirstName"
              name="FirstName"
              value={formData.FirstName}
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="LastName">Apellido</Label>
            <TextInput
              id="LastName"
              name="LastName"
              value={formData.LastName}
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="Phone">Teléfono</Label>
            <TextInput
              id="Phone"
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
              id="Email"
              type="email"
              name="Email"
              value={formData.Email}
              placeholder="usuario@correo.com"
              onChange={handleChange}
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="Username">Nombre de usuario</Label>
            <TextInput
              id="Username"
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
              id="Password"
              type={showPassword ? "text" : "password"}
              name="Password"
              value={formData.Password || ""}
              onChange={handleChange}
              placeholder={
                isEditMode ? "Deja en blanco para mantener la contraseña" : ""
              }
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
              required={!isEditMode}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Al menos 8 caracteres, una letra y un número.
            </p>
            <div className="mt-2 flex items-center">
              <Checkbox
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <Label htmlFor="showPassword" className="ml-2">
                Mostrar contraseña
              </Label>
            </div>
          </div>
        </div>

        {/* Status and Role */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center">
            <Checkbox
              id="IsActive"
              checked={formData.IsActive}
              onChange={() => handleCheckboxChange("IsActive")}
            />
            <Label htmlFor="IsActive" className="ml-2">
              Usuario activo
            </Label>
          </div>

          <div>
            <Label htmlFor="RoleID">Rol</Label>
            <Select
              id="RoleID"
              name="RoleID"
              value={formData.RoleID}
              onChange={handleChange}
              required
              className="mt-1 text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((r: Role) => (
                <option key={r.RoleID} value={r.RoleID}>
                  {r.RoleName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Warehouses */}
        <div>
          <Label>Depósitos asignados</Label>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {warehouses.map((w: Warehouse) => (
              <label key={w.WarehouseID} className="flex items-center">
                <Checkbox
                  id={`warehouse-${w.WarehouseID}`}
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

        {/* Submit Button */}
        <div className="text-center">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-verde w-full sm:w-auto"
          >
            {submitting
              ? isEditMode
                ? "Actualizando..."
                : "Creando..."
              : isEditMode
                ? "Actualizar Usuario"
                : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </div>
  );
}
