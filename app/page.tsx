// app/page.tsx
import { redirect } from "next/navigation";

// Force this page to be dynamic to avoid prerendering issues
export const dynamic = "force-dynamic";

export default function Home() {
  redirect("/login");
}
