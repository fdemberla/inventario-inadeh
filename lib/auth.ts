// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export function getUserFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return user as { id: number; username: string; role: number };
  } catch (error) {
    console.log(error);
    return null;
  }
}
