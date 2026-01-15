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
      accessorKey: "FullName",
      header: "Nombre",
      cell: ({ row }) => `${row.original.FirstName} ${row.original.LastName}`,
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
            router.push(
              withBasePath(`/dashboard/users/${row.original.UserID}/update`),
            )
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
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        </div>
      </PageLayout>
    );

  return (
    <PageLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios del sistema"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Usuarios" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push(withBasePath("/dashboard/users/create"))}
        >
          Crear Usuario
        </Button>
      }
    >
      <DataTable data={users} columns={columns} />
    </PageLayout>
  );
}
