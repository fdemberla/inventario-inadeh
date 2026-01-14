"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getDB } from "@/lib/localdb";
import { FormField, Button, Card } from "@/app/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      setErrors({ password: "La contraseña es requerida" });
      setIsLoading(false);
      return;
    }

    const db = await getDB();

    if (!navigator.onLine) {
      // Try offline login with saved credentials
      const user = await db.get("users", username);
      if (user && user.password === password) {
        toast.success(`Modo offline. Bienvenido ${username}`);
        router.push("/dashboard");
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
        await db.put("users", { username, password });
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
          <Image src="/favicon.png" alt="Logo" width={64} height={64} />
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
            error={errors.password}
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
