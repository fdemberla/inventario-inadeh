"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getDB } from "@/lib/localdb";
import { FormField, Button, Card } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

const textEncoder = new TextEncoder();

const bufferToHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const generateSalt = (): string => {
  // Ensure we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("Crypto API not available - not in browser");
  }
  
  if (!crypto.getRandomValues) {
    // Fallback: simple random for development only
    return Math.random().toString(36).substring(2, 18);
  }
  
  return bufferToHex(crypto.getRandomValues(new Uint8Array(16)));
};

const hashPassword = async (
  password: string,
  salt: string,
): Promise<string> => {
  // Ensure we're in a browser environment with crypto.subtle available
  if (typeof window === "undefined") {
    throw new Error("Crypto API not available - not in browser");
  }
  
  // crypto.subtle is only available in secure contexts (HTTPS or localhost)
  if (!crypto.subtle) {
    // Fallback: simple non-crypto hash for development only
    // WARNING: This is NOT secure and should only be used for development
    const combined = `${salt}:${password}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  const data = textEncoder.encode(`${salt}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hash);
};

const timingSafeEqual = (a: string, b: string): boolean => {
  const aBytes = textEncoder.encode(a);
  const bBytes = textEncoder.encode(b);
  const maxLength = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < maxLength; i += 1) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    passwordField?: string;
    submit?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validación básica
    if (!username) {
      setErrors({ username: "El usuario es requerido" });
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrors({ passwordField: "La contraseña es requerida" });
      setIsLoading(false);
      return;
    }

    // Ensure we're in the browser
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const db = await getDB();

    if (!navigator.onLine) {
      // Try offline login with saved credentials
      const user = await db.get("users", username);
      if (user) {
        const hasHashedPassword = Boolean(
          user.passwordHash && user.passwordSalt,
        );
        const passwordHash = hasHashedPassword
          ? await hashPassword(password, user.passwordSalt)
          : "";
        const isValid = hasHashedPassword
          ? timingSafeEqual(passwordHash, user.passwordHash)
          : user.password
            ? timingSafeEqual(user.password, password)
            : false;

        if (isValid && !hasHashedPassword) {
          const salt = generateSalt();
          const hashedPassword = await hashPassword(password, salt);
          await db.put("users", {
            username,
            passwordHash: hashedPassword,
            passwordSalt: salt,
          });
        }

        if (isValid) {
          toast.success(`Modo offline. Bienvenido ${username}`);
          router.push("/dashboard");
        } else {
          toast.error("Sin conexión. Credenciales no encontradas localmente.");
        }
      } else {
        toast.error("Sin conexión. Credenciales no encontradas localmente.");
      }
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = "Credenciales incorrectas";
        setErrors({ submit: errorMsg });
        toast.error(errorMsg);
      } else if (result?.ok) {
        toast.success(`Bienvenido ${username}`);
        // Save credentials for offline login
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        await db.put("users", { username, passwordHash, passwordSalt: salt });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = "Error de conexión. Intente más tarde.";
      setErrors({ submit: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        {/* Logo + Título */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src={withBasePath("/favicon.png")}
            alt="Logo"
            width={64}
            height={64}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Inventario
          </h1>
        </div>

        <h2 className="mt-6 mb-6 text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
          Iniciar sesión
        </h2>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <FormField
            label="Usuario"
            type="text"
            placeholder="Tu nombre de usuario"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
          />

          <FormField
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.passwordField}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
}
