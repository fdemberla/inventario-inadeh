// app/user-dashboard/layout.tsx
import { getUserFromToken } from "@/lib/auth-config-consolidated";
import { redirect } from "next/navigation";
import SidebarComponent from "../components/Sidebar";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromToken();

  if (!user) redirect("/login");
  if (user.role !== 2) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-gray-800 text-white">
        <div className="p-4 text-center text-lg font-bold">
          Hello, {user.username}!
        </div>
        <SidebarComponent user={user} />
      </aside>

      <main className="flex-1 bg-gray-100 p-6">{children}</main>
    </div>
  );
}
