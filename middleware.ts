// middleware.ts - NextAuth.js v5 middleware (Edge-compatible)
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest } from "next/server";

const { auth: nextAuthMiddleware } = NextAuth(authConfig);

// Custom middleware that allows Bearer token authentication
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow Bearer token authentication for mobile API routes
  const authHeader = request.headers.get("authorization");
  const hasBearerToken = authHeader?.startsWith("Bearer ");

  // If it's a mobile API route with Bearer token, skip NextAuth middleware
  if (hasBearerToken && pathname.startsWith("/api/") && pathname.includes("/mobile/")) {
    return undefined; // Allow request to proceed to route handler
  }

  // Use standard NextAuth middleware for everything else
  return nextAuthMiddleware(request);
}

export const config = {
  // Match all routes except static files, images, and public assets
  matcher: ["/:path*"],
};
