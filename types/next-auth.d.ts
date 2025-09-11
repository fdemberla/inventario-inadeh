declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: number;
      firstName?: string;
      lastName?: string;
      username?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: number;
    firstName?: string;
    lastName?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}
