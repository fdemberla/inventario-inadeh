import AzureADProvider from "next-auth/providers/azure-ad";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { rawSql } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

interface ExtendedUser extends User {
  id: string;
  role: number;
  firstName: string;
  lastName: string;
  username: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface ExtendedJWT extends JWT {
  id?: string;
  role?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    role: number;
    firstName: string;
    lastName: string;
    username: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  accessToken?: string;
}

// JWT Token utility functions (from auth.ts)
export async function getUserFromToken() {
  const cookieStore = await cookies();
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

// Database login functions (from login.ts)
export async function loginUser(username: string, password: string) {
  try {
    const result = await rawSql(
      "SELECT * FROM Users WHERE Username = @param0",
      [username],
    );

    const user = result[0];

    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, user }; // Return user if login is successful
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Database error during login");
  }
}

// Login function for Microsoft OAuth authentication
export async function loginUserByEmail(email: string) {
  try {
    const result = await rawSql(
      "SELECT * FROM Users WHERE Email = @param0 AND IsActive = 1",
      [email],
    );

    const user = result[0];

    if (!user) {
      return {
        success: false,
        message: "No se encontro un usuario con este correo.",
      };
    }

    return { success: true, user }; // Return user if found
  } catch (error) {
    console.error("Email login error:", error);
    throw new Error("Database error during email login");
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
          response_type: "code",
          response_mode: "query",
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }: { user: User | AdapterUser }) {
      try {
        if (!user.email) {
          console.log("No email found in user object");
          return false;
        }

        console.log("Attempting to find user in database:", user.email);

        // Buscar usuario en la base de datos por email
        const result = await rawSql(
          "SELECT UserID, RoleID, FirstName, LastName, Username FROM Users WHERE Email = @param0",
          [user.email],
        );

        if (result.length === 0) {
          console.log("Usuario no encontrado en la base de datos:", user.email);
          return false;
        }

        // Agregar datos del usuario a la sesión
        const dbUser = result[0];
        console.log("Usuario encontrado en DB:", dbUser);

        // Extender el objeto user con campos personalizados
        const extendedUser = user as ExtendedUser;
        extendedUser.id = dbUser.UserID.toString();
        extendedUser.role = dbUser.RoleID;
        extendedUser.firstName = dbUser.FirstName;
        extendedUser.lastName = dbUser.LastName;
        extendedUser.username = dbUser.Username;

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: ExtendedJWT;
      user?: User | AdapterUser;
      account?: unknown;
    }) {
      // Cuando el usuario inicia sesión por primera vez
      if (user) {
        console.log("JWT: Adding user data to token", user);
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.firstName = extendedUser.firstName;
        token.lastName = extendedUser.lastName;
        token.username = extendedUser.username;
      }

      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: ExtendedJWT;
    }) {
      // Enviar datos al cliente
      if (token && session.user) {
        console.log("Session: Adding token data to session", token);
        session.user.id = token.id as string;
        session.user.role = token.role as number;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;

        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("NextAuth Debug:", code, metadata);
      }
    },
  },
};
