// // app/dashboard/layout.tsx

import SidebarComponent from "../components/Sidebar";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import BottomMenu from "../components/BottomMenu";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let user = null;
  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET) as {
        id: number;
        username: string;
        role: number;
      };
    } catch (err) {
      console.error("Invalid token");
      console.error(err);
      redirect("/login");
    }
  } else {
    redirect("/login");
  }

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
