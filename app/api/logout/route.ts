// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = new NextResponse(
    JSON.stringify({
      message: "Logged out",
      redirectToMicrosoftLogout: true,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );

  // Limpiar el token JWT del sistema
  response.cookies.set({
    name: "token",
    value: "",
    path: "/",
    expires: new Date(0), // Expire the cookie
  });

  // Limpiar cookies de NextAuth (Microsoft)
  const nextAuthCookies = [
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.csrf-token",
    "__Secure-next-auth.callback-url",
  ];

  nextAuthCookies.forEach((cookieName) => {
    response.cookies.set({
      name: cookieName,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  });

  return response;
}
