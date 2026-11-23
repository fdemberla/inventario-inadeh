import { PageLayout } from "@/app/components/PageLayout";
import { Card, CardBody, CardHeader } from "@/app/components/ui";
import Link from "next/link";
import { MdOutlineInventory } from "react-icons/md";
import { HiOutlineShoppingCart, HiOutlineDocumentReport } from "react-icons/hi";

export default function UserHomePage() {
  return (
    <PageLayout
      title="Panel de Usuario"
      subtitle="Bienvenido a tu dashboard personal"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        <Link href="/dashboard/inventory" className="block outline-none focus:ring-4 focus:ring-brand-azul/30 rounded-2xl">
          <Card hoverable className="h-full flex flex-col group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-azul/20 text-brand-azul dark:bg-brand-azul/30 dark:text-brand-azul transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-brand-azul/30">
                <MdOutlineInventory className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-azul transition-colors">
                Inventario
              </h3>
            </CardHeader>
            <CardBody className="flex-1">
              <p className="text-base text-gray-600 dark:text-gray-300">
                Consulta y actualiza el estado actual de tu inventario en las distintas ubicaciones.
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link href="#" className="block outline-none focus:ring-4 focus:ring-brand-naranja/30 rounded-2xl">
          <Card hoverable className="h-full flex flex-col group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-naranja/20 text-brand-naranja dark:bg-brand-naranja/30 dark:text-brand-naranja transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-brand-naranja/30">
                <HiOutlineShoppingCart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-naranja transition-colors">
                Órdenes
              </h3>
            </CardHeader>
            <CardBody className="flex-1">
              <p className="text-base text-gray-600 dark:text-gray-300">
                Visualiza, gestiona y da seguimiento a tus órdenes pendientes y envíos.
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link href="/dashboard/reports" className="block outline-none focus:ring-4 focus:ring-brand-verde/30 rounded-2xl">
          <Card hoverable className="h-full flex flex-col group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-verde/20 text-brand-verde dark:bg-brand-verde/30 dark:text-brand-verde transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-brand-verde/30">
                <HiOutlineDocumentReport className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-verde transition-colors">
                Reportes
              </h3>
            </CardHeader>
            <CardBody className="flex-1">
              <p className="text-base text-gray-600 dark:text-gray-300">
                Genera, descarga y revisa reportes detallados y análisis de tu almacén.
              </p>
            </CardBody>
          </Card>
        </Link>

      </div>
    </PageLayout>
  );
}
