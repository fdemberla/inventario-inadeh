"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";

type User = {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  RoleName: string;
  IsActive: boolean;
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(withBasePath("/api/users"))
      .then((res) => res.json())
      .then((data) => setUsers(data.users || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      // The API has no FullName field: build it so sorting and search work
      id: "FullName",
      accessorFn: (u: { FirstName?: string; LastName?: string }) =>
        `${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim(),
      header: "Nombre",
    },
    { accessorKey: "RoleName", header: "Rol" },
    { accessorKey: "Email", header: "Correo" },
    {
      accessorKey: "IsActive",
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "Sí" : "No"),
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            router.push(`/dashboard/users/${row.original.UserID}/update`)
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <PageLayout title="Usuarios">
        <div className="flex justify-center p-6">
          <div role="status" aria-label="Cargando...">
            <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-line"></div>
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </PageLayout>
    );

  return (
    <PageLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios del sistema"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Usuarios" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard/users/create")}
        >
          Crear Usuario
        </Button>
      }
    >
      <DataTable caption="Usuarios" data={users} columns={columns} />
    </PageLayout>
  );
}
