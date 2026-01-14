// lib/auth.config.ts
// Edge-compatible configuration for NextAuth middleware
// NOTE: This file should NOT import any Node.js-only modules (like mssql)
import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extended session user type
interface ExtendedUser {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const authConfig: NextAuthConfig = {
  providers: [], // Providers configured in auth.ts to avoid Edge issues
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id as number;
        token.username = user.username as string;
        token.role = user.role as number;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      const extendedToken = token as JWT & ExtendedUser;
      (session as Session & { user: ExtendedUser }).user = {
        id: extendedToken.id,
        username: extendedToken.username,
        role: extendedToken.role,
        firstName: extendedToken.firstName,
        lastName: extendedToken.lastName,
        email: extendedToken.email,
      };
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnUserDashboard = nextUrl.pathname.startsWith("/user-dashboard");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnApi = nextUrl.pathname.startsWith("/api");

      // Allow public API routes
      if (isOnApi) {
        const publicApiRoutes = ["/api/auth"];
        const isPublicApi = publicApiRoutes.some((route) =>
          nextUrl.pathname.startsWith(route),
        );
        if (isPublicApi) return true;
        return isLoggedIn;
      }

      // Redirect logged-in users away from login page
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Protect dashboard routes
      if (isOnDashboard || isOnUserDashboard) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
};
