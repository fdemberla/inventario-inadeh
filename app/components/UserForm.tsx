"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  Input,
  Card,
  Select,
  Spinner,
} from "@/app/components/ui";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
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
        <Spinner size="xl" />
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
            helperText="Generado automáticamente"
          />

          <div className="w-full space-y-2">
            <label htmlFor="Password" className="text-fg block text-sm font-semibold">
              Contraseña
              {!isEditMode && (
                <span aria-hidden="true" className="text-danger-fg ml-1">*</span>
              )}
            </label>
            <div className="relative">
              <Input
                id="Password"
                type={showPassword ? "text" : "password"}
                name="Password"
                value={formData.Password || ""}
                onChange={handleChange}
                placeholder={isEditMode ? "En blanco para mantener" : ""}
                required={!isEditMode}
                autoComplete="new-password"
                aria-describedby="Password-helper"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                className="text-fg-muted hover:text-fg focus-visible:outline-focus absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus-visible:outline-2"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <p id="Password-helper" className="text-fg-muted text-xs">
              Al menos 8 caracteres, una letra y un número.
            </p>
          </div>
        </div>

        {/* Status and Role */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-h-11 items-center gap-2 sm:self-end">
            <input
              type="checkbox"
              id="IsActive"
              checked={formData.IsActive}
              onChange={() => handleCheckboxChange("IsActive")}
              className="accent-brand-azul h-5 w-5 cursor-pointer"
            />
            <label htmlFor="IsActive" className="text-fg cursor-pointer text-sm font-medium">
              Usuario activo
            </label>
          </div>

          <FormField label="Rol" id="RoleID" required>
            <Select name="RoleID" value={formData.RoleID} onChange={handleChange}>
              <option value="">Selecciona un rol</option>
              {roles.map((r: Role) => (
                <option key={r.RoleID} value={r.RoleID}>
                  {r.RoleName}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Warehouses */}
        <fieldset className="border-line border-t pt-4">
          <legend className="text-fg mb-3 text-sm font-semibold">Depósitos asignados</legend>
          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {warehouses.map((w: Warehouse) => {
              const isSelected = formData.WarehouseIDs.includes(w.WarehouseID);
              return (
                <label
                  key={w.WarehouseID}
                  htmlFor={`warehouse-${w.WarehouseID}`}
                  className={`relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-4 shadow-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                    isSelected
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-line bg-surface hover:bg-surface-muted"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-fg">
                      {w.WarehouseCode}
                    </span>
                    <span className="mt-1 text-xs text-fg-muted">
                      {w.WarehouseName}
                    </span>
                  </div>
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      id={`warehouse-${w.WarehouseID}`}
                      checked={isSelected}
                      onChange={() => handleWarehouseChange(w.WarehouseID)}
                      className="accent-brand-azul h-5 w-5 cursor-pointer"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="border-line border-t pt-6 text-center">
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
