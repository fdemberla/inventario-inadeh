// auth.ts - NextAuth.js v5 configuration
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { loginUser } from "@/lib/login";
import {
  clientIp,
  loginRetryAfter,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rate-limit";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is required");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  basePath: "/api/auth",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = String(credentials.username);
        const password = String(credentials.password);
        if (username.length > 100 || password.length > 200) return null;

        const ip = clientIp(request.headers);
        if (loginRetryAfter(username, ip) > 0) {
          console.warn("Login throttled (too many failed attempts)");
          return null;
        }

        try {
          const result = await loginUser(username, password);

          if (!result.success || !result.user) {
            recordLoginFailure(username, ip);
            return null;
          }
          recordLoginSuccess(username, ip);

          const user = result.user;
          return {
            id: user.UserID,
            username: user.Username,
            role: user.RoleID,
            firstName: user.FirstName,
            lastName: user.LastName,
            email: user.Email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});
