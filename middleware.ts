import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { jwtVerify } from "jose"; // Use jose library for Edge compatibility

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

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
      // console.log("Verifying token:", token); // Log the token for debugging
      // const decoded = await jwtVerify(
      //   token,
      //   new TextEncoder().encode(process.env.JWT_SECRET!),
      // ); // Use jose for Edge
      // console.log("Decoded token:", decoded); // Log decoded token for further insight
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
  matcher: ["/api/:path*"], // apply only to API routes
};
