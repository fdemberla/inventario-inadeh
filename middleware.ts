// middleware.ts - NextAuth.js v5 middleware (Edge-compatible)
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";

const { auth: nextAuthMiddleware } = NextAuth(authConfig);

// Custom middleware that allows Bearer token authentication
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Mobile API routes authenticate with a Bearer JWT instead of the NextAuth
  // cookie. Only skip NextAuth when that token actually verifies; route
  // handlers still re-check it (plus role / warehouse) via lib/authz.
  const authHeader = request.headers.get("authorization");
  const isMobileApi =
    pathname.includes("/api/") && pathname.includes("/mobile/");

  if (isMobileApi && authHeader?.startsWith("Bearer ")) {
    const valid = await verifyMobileToken(authHeader.slice(7));
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Use standard NextAuth middleware for everything else
  return nextAuthMiddleware(request);
}

export const config = {
  // Match all routes except static files, images, and public assets
  matcher: ["/:path*"],
};
