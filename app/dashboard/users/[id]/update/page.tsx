"use client";

import { useParams } from "next/navigation";
import UserForm from "@/app/components/UserForm";

export default function EditUserPage() {
  const { id } = useParams();

  return <UserForm userId={id} isEditMode={true} />;
}
