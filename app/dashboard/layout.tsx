// app/dashboard/layout.tsx

import SidebarComponent from "../components/Sidebar";
import { redirect } from "next/navigation";
import BottomMenu from "../components/BottomMenu";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    // redirect() adds the basePath itself; wrapping it would double it
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only z-[70] rounded-lg bg-white px-4 py-2 font-medium text-brand-azul focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>

      {/* Desktop navigation (md+) */}
      <aside className="bg-brand-azul hidden w-72 shrink-0 md:block">
        <SidebarComponent user={user} />
      </aside>

      {/* Bottom padding clears the mobile bar + iOS home indicator */}
      <main
        id="main-content"
        className="bg-canvas min-w-0 flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6"
      >
        {children}
      </main>

      {/* Mobile navigation (< md) */}
      <BottomMenu user={user} />
    </div>
  );
}
