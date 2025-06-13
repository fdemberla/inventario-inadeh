"use client";
import UnitForm from "@/app/components/UnitForm";
import { useRouter } from "next/navigation";

export default function CreateUnitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/units");
  };

  return <UnitForm onSuccess={handleSuccess} />;
}
