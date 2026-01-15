// app/page.tsx
import { redirect } from "next/navigation";
import { withBasePath } from "@/lib/utils";

export default function Home() {
  redirect(withBasePath("/login"));
}
