// app/api/auth/microsoft-login/route.ts
import { loginUserByEmail } from "@/lib/auth-config-consolidated";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config-consolidated";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST() {
  try {
    // Obtener la sesión de NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return new Response(
        JSON.stringify({ message: "No hay sesión de Microsoft activa" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const email = session.user.email;
    console.log("Intentando login con email:", email);

    // Buscar el usuario en la base de datos por email
    const result = await loginUserByEmail(email);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: "Usuario no encontrado en el sistema",
          email: email,
          suggestion:
            "Contacte al administrador para que agregue su cuenta al sistema.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const user = result.user;
    console.log("Usuario encontrado:", {
      username: user.Username,
      role: user.RoleID,
    });

    // Crear el JWT token con la misma estructura que el login tradicional
    const token = jwt.sign(
      { id: user.UserID, username: user.Username, role: user.RoleID },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Establecer la cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return new Response(
      JSON.stringify({
        message: "Inicio de sesión con Microsoft exitoso",
        user: {
          id: user.UserID,
          username: user.Username,
          email: email,
          role: user.RoleID,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en el login de Microsoft:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
