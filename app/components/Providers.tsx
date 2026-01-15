// app/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { withBasePath } from "@/lib/utils";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={withBasePath("/api/auth")}>
      {children}
    </SessionProvider>
  );
}
