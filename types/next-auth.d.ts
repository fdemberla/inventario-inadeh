// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      username: string;
      role: number;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  }

  interface User {
    id: number;
    username: string;
    role: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    username: string;
    role: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  }
}
