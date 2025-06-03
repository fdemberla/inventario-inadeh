import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return user as { id: number; username: string; role: number };
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}
