// middleware.ts - NextAuth.js v5 middleware (Edge-compatible)
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Match all routes except static files, images, and public assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|screenshots|uploads|manifest.json|service-worker.js|sw.js|workbox-.*).*)",
  ],
};
