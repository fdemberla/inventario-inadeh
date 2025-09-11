import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Skip middleware for NextAuth routes and debug routes
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/debug")) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const publicRoutes = ["/api/login", "/api/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isApiRoute && !isPublicRoute) {
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Token verification code can be added here if needed
      // For now, we're allowing all requests with tokens
    } catch (error) {
      console.error("Token verification failed:", error);
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - api/debug (debug routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/debug|_next/static|_next/image|favicon.ico).*)",
  ],
};
