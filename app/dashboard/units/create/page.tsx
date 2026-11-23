"use client";
import UnitForm from "@/app/components/UnitForm";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui";

export default function CreateUnitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/units");
  };

  return (
    <Card className="w-full p-6 shadow-lg border-none bg-surface mt-6">
      <h2 className="mb-6 text-2xl font-bold text-fg text-center">Crear Nueva Unidad</h2>
      <UnitForm onSuccess={handleSuccess} title="" />
    </Card>
  );
}
