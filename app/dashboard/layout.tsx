// app/dashboard/layout.tsx

import SidebarComponent from "../components/Sidebar";
import { redirect } from "next/navigation";
import BottomMenu from "../components/BottomMenu";
import { auth } from "@/auth";
import { withBasePath } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(withBasePath("/login"));
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="bg-brand-azul hidden w-72 md:block">
        <SidebarComponent user={user} />
      </aside>

      {/* Main Content */}
      <main className="bg-brand-gris flex-1 p-4 pb-20 md:pb-0 dark:bg-gray-900">
        {children}
      </main>

      {/* Bottom Menu for Mobile */}
      <div className="md:hidden">
        <BottomMenu user={user} />
      </div>
    </div>
  );
}
