"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Alert } from "flowbite-react";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";

// Forzar la página a ser dinámica
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Redirigir si ya está autenticado CON JWT token (no solo NextAuth)
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Verificar si tiene JWT token (login completo)
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Solo redirigir si tiene tanto sesión NextAuth como JWT token del sistema
          if (data?.user && document.cookie.includes("token=")) {
            toast.success(`Bienvenido ${data.user.name || data.user.email}`);
            router.push(callbackUrl);
          }
        }
      } catch {
        console.log("No hay sesión activa");
      }
    };

    if (status === "authenticated") {
      checkAuthStatus();
    }
  }, [session, status, router, callbackUrl]);

  const handleMicrosoftSystemLogin = useCallback(async () => {
    if (!session?.user?.email) {
      console.log("No hay email en la sesión");
      return;
    }

    setLoading(true);
    toast.success(`Autenticado con Microsoft: ${session.user.email}`);

    try {
      console.log("Llamando a /api/auth/microsoft-login...");
      const response = await fetch("/api/auth/microsoft-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Respuesta del login:", data);

      if (response.ok) {
        toast.success(`¡Bienvenido ${data.user.username}!`);
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Usuario no encontrado en el sistema");
        if (response.status === 404) {
          toast.error("Contacte al administrador para agregar su cuenta", {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Microsoft system login error:", error);
      toast.error("Error al conectar con el sistema");
    }
    setLoading(false);
  }, [session, router]);

  // Detectar si viene de Microsoft OAuth y hacer login automático
  useEffect(() => {
    const microsoftParam = searchParams.get("microsoft");

    if (
      microsoftParam === "success" &&
      session?.user?.email &&
      status === "authenticated"
    ) {
      console.log(
        "Detectado microsoft=success, intentando login automático...",
      );
      handleMicrosoftSystemLogin();
    }
  }, [session, status, searchParams, handleMicrosoftSystemLogin]);

  // Mostrar errores de autenticación
  useEffect(() => {
    if (error) {
      const errorMessages = {
        OAuthCallback:
          "Error en la autenticación con Microsoft. Intenta de nuevo.",
        Callback: "Error de callback. Verifica la configuración.",
        OAuthAccountNotLinked:
          "Esta cuenta ya está asociada con otro método de login.",
        EmailCreateAccount: "No se pudo crear la cuenta con este email.",
        Signin: "Error al iniciar sesión. Intenta de nuevo.",
        OAuthSignin: "Error con el proveedor OAuth.",
        OAuthCreateAccount: "No se pudo crear cuenta con OAuth.",
        SessionRequired: "Debes iniciar sesión para acceder.",
        default: "Ocurrió un error durante la autenticación.",
      };

      const message =
        errorMessages[error as keyof typeof errorMessages] ||
        errorMessages.default;
      toast.error(message);
    }
  }, [error]);

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      console.log("Iniciando login con Microsoft...");

      const result = await signIn("azure-ad", {
        callbackUrl: callbackUrl,
        redirect: true, // Permitir redirección automática
      });

      console.log("Resultado del signIn:", result);

      if (result?.error) {
        console.error("Error en signIn:", result.error);
        toast.error("Error al iniciar sesión con Microsoft");
      }
    } catch (error) {
      console.error("Microsoft login error:", error);
      toast.error("Error al conectar con Microsoft");
    }
    setLoading(false);
  };

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
        <Card className="w-full max-w-md border-0 bg-white shadow-lg dark:bg-gray-800">
          <div className="p-6 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Verificando sesión...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md border-0 bg-white shadow-lg dark:bg-gray-800">
        <div className="flex flex-col items-center gap-3 pt-4">
          <Image src="/favicon.png" alt="Logo" width={64} height={64} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Sistema de Inventario
          </h1>
        </div>

        {error && (
          <div className="mb-4 px-4">
            <Alert color="failure">
              <span className="font-medium">Error de autenticación!</span>{" "}
              {error}
            </Alert>
          </div>
        )}

        {/* Mostrar información de sesión de Microsoft si existe */}
        {session?.user?.email && (
          <div className="mx-4 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              Autenticado como: <strong>{session.user.email}</strong>
            </p>
          </div>
        )}

        <div className="mb-4 px-4">
          <Button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full border-0 bg-blue-600 text-white hover:bg-blue-700"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            {loading ? "Conectando..." : "Continuar con Microsoft"}
          </Button>
        </div>

        {/* Botón para hacer login manual después de Microsoft */}
        {session?.user?.email && (
          <div className="mb-4 px-4">
            <Button
              onClick={handleMicrosoftSystemLogin}
              disabled={loading}
              className="w-full border-0 bg-green-600 text-white hover:bg-green-700"
            >
              {loading ? "Conectando al sistema..." : "Acceder al Sistema"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
