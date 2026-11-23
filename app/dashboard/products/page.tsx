"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button, Modal, ModalFooter } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { USER_ROLES } from "@/lib/constants";

type Product = {
  ProductID: number;
  ProductName: string;
  InternalSKU: string;
  Barcode: string;
  CategoryName?: string;
};

export default function ViewAllProducts() {
  const { data: session } = useSession();
  // Edit / delete / create are admin-only (enforced by the API as well)
  const isAdmin = session?.user?.role === USER_ROLES.ADMIN;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Confirmation is a real dialog (focusable, Escape, announced), not a toast
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (productId: number, productName: string) => {
    setPendingDelete({ id: productId, name: productName });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(withBasePath(`/api/products/${pendingDelete.id}`), {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.ProductID !== pendingDelete.id));
        toast.success("Producto eliminado exitosamente.");
      } else if (res.status === 409) {
        toast.error(
          "No se puede eliminar el producto porque tiene inventario registrado. El inventario debe ser 0 para poder eliminarlo.",
          { duration: 6000 },
        );
      } else {
        toast.error(result.message || "Error al eliminar el producto.");
      }
    } catch {
      toast.error("Error de red al eliminar el producto.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(withBasePath("/api/products"));
        const data = await res.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const allColumns = [
    {
      header: "Nombre",
      accessorKey: "ProductName",
    },
    {
      header: "SKU",
      accessorKey: "InternalSKU",
    },
    {
      header: "Barcode",
      accessorKey: "Barcode",
    },
    {
      header: "Categoría",
      accessorKey: "CategoryName",
      cell: ({ getValue }: unknown) => getValue() || "N/A",
    },
    {
      header: "Acciones",
      id: "actions",
      cell: ({ row }: unknown) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              router.push(`/dashboard/products/edit/${row.original.ProductID}`)
            }
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() =>
              handleDelete(row.original.ProductID, row.original.ProductName)
            }
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];
  const columns = isAdmin
    ? allColumns
    : allColumns.filter((c) => c.id !== "actions");

  if (loading) {
    return (
      <PageLayout title="Productos">
        <div className="flex justify-center p-6 align-middle">
          <div role="status" aria-label="Cargando...">
            <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-line"></div>
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Todos los Productos"
      subtitle="Gestiona tu catálogo de productos"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Productos" },
      ]}
      actions={
        isAdmin ? (
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard/products/create")}
          >
            Crear Producto
          </Button>
        ) : undefined
      }
    >
      <DataTable caption="Productos" data={products} columns={columns} />

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        isDismissable={!deleting}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={deleting}>
              Eliminar
            </Button>
          </ModalFooter>
        }
      >
        <p className="text-fg">
          ¿Eliminar <span className="font-semibold">{pendingDelete?.name}</span>?
        </p>
      </Modal>
    </PageLayout>
  );
}
