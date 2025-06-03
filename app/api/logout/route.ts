// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = new NextResponse(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  response.cookies.set({
    name: "token",
    value: "",
    path: "/",
    expires: new Date(0), // Expire the cookie
  });

  return response;
}
