// app/api/login/route.ts
import { loginUser } from "@/lib/login";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return new Response(
      JSON.stringify({
        message: "Faltan el nombre de usuario o la contraseña",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await loginUser(username, password);

    if (!result.success) {
      return new Response(
        JSON.stringify({ message: "Usuario o Contraseña inválidos." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const user = result.user;

    const token = jwt.sign(
      { id: user.UserID, username: user.Username, role: user.RoleID },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const cookieStore = await cookies();

    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ solo en producción      sameSite: "lax",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return new Response(
      JSON.stringify({ message: "Inicio de sesión exitoso" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
