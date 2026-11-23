"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import { getDB } from "@/lib/localdb";
import { FormField, Button, Card, Input } from "@/app/components/ui";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen bg-surface-muted">
      {/* Lado Izquierdo: Branding y Fondo (oculto en móviles) */}
      <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-azul to-[#003070] p-12 lg:flex lg:w-1/2 xl:w-3/5">
        {/* Mesh Gradient / Efectos de fondo */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] animate-pulse rounded-full bg-white/10 blur-[120px] duration-[8000ms]" />
          <div className="absolute -right-[10%] bottom-[10%] h-[50%] w-[50%] animate-pulse rounded-full bg-brand-verde/20 blur-[120px] duration-[10000ms] delay-700" />
        </div>
        
        {/* Contenido branding */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-3 shadow-[inset_0_1px_3px_rgba(255,255,255,0.3)] backdrop-blur-md">
            <Image
              src={withBasePath("/favicon.png")}
              alt="Logo INADEH"
              width={60}
              height={60}
              className="drop-shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight lg:text-5xl">
              Sistema de Inventario
            </h1>
            <p className="mt-4 max-w-lg text-lg text-blue-100/90 leading-relaxed">
              Plataforma centralizada para la gestión, control y auditoría de los recursos en todas nuestras sedes.
            </p>
          </div>
        </div>

        {/* Footer del branding */}
        <div className="relative z-10 text-sm text-blue-200/60">
          &copy; {new Date().getFullYear()} INADEH. Todos los derechos reservados.
        </div>
      </div>

      {/* Lado Derecho: Formulario de Login */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 xl:w-2/5 relative">
        {/* En móviles, mostrar el logo aquí si se desea, o mesh gradients sutiles */}
        <div className="pointer-events-none absolute inset-0 z-0 lg:hidden">
          <div className="absolute -top-[20%] -right-[20%] h-[60%] w-[60%] rounded-full bg-brand-azul/10 blur-[100px]" />
        </div>

        <div className="mx-auto w-full max-w-md relative z-10">
          <div className="mb-10 text-center lg:text-left">
            {/* Logo solo visible en móvil */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-azul/10 p-3 dark:bg-white/5 lg:hidden">
              <Image
                src={withBasePath("/favicon.png")}
                alt="Logo INADEH"
                width={60}
                height={60}
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-fg">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          <Card className="shadow-xl">
            {/* Error Message */}
            {errors.submit && (
              <div role="alert" className="mb-6 rounded-xl bg-danger/10 p-4 text-sm font-medium text-danger-fg flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <FormField
                label="Usuario"
                type="text"
                autoComplete="username"
                placeholder="Tu nombre de usuario"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <div className="w-full space-y-2">
                <div className="flex items-center gap-1">
                  <label htmlFor="password" className="text-fg text-sm font-semibold">
                    Contraseña
                    <span aria-hidden="true" className="text-danger-fg ml-1">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    aria-describedby={errors.passwordField ? "password-error" : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.passwordField}
                    className="pr-12"
                    icon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-pressed={showPassword}
                    className="text-fg-muted hover:text-fg focus-visible:outline-focus absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus-visible:outline-2"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.passwordField && (
                  <p id="password-error" role="alert" className="text-danger-fg mt-1 text-sm font-medium">{errors.passwordField}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full text-base"
                >
                  {isLoading ? "Verificando..." : "Iniciar Sesión"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
