// app/user-dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SidebarComponent from "../components/Sidebar";
import { USER_ROLES } from "@/lib/constants";
import { withBasePath } from "@/lib/utils";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect(withBasePath("/login"));
  if (session.user.role !== USER_ROLES.GENERAL)
    redirect(withBasePath("/dashboard"));

  const user = session.user;

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
