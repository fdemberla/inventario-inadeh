// app/dashboard/layout.tsx

import SidebarComponent from "../components/Sidebar";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config-consolidated";
import BottomMenu from "../components/BottomMenu";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

// Forzar la ruta a ser dinámica
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Verificar también la sesión de NextAuth (Microsoft login)
  const session = await getServerSession(authOptions);

  let user = null;

  // Primero, verificar el JWT token tradicional
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
    }
  }

  // Si no hay JWT token pero hay sesión de Microsoft, redirigir a login para completar el proceso
  if (!user && session?.user?.email) {
    console.log(
      "Microsoft session detected but no system login. Redirecting to complete login.",
    );
    redirect("/login?microsoft=success");
  }

  // Si no hay ni JWT token ni sesión de Microsoft, redirigir a login
  if (!user && !session) {
    redirect("/login");
  }

  // Si llegamos aquí, debe haber un usuario válido
  // Si no hay user pero hay session, significa que está en proceso de login de Microsoft
  if (!user) {
    redirect("/login?microsoft=success");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="bg-brand-azul hidden w-80 md:block">
        <SidebarComponent user={user} />
      </aside>

      {/* Main Content */}
      <main className="bg-brand-gris flex-1 p-4 pb-20 md:pb-0 dark:bg-gray-900">
        {children}
      </main>

      {/* Bottom Menu for Mobile */}
      <div className="md:hidden">
        <BottomMenu user={{ role: user.role }} />
      </div>
    </div>
  );
}
