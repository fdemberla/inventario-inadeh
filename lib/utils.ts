/**
 * Utilidades comunes
 */

/**
 * Combina múltiples clases CSS condicionalmente
 * @example
 * cn("px-4", error && "border-red-500", className)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Obtiene error message amigable
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

/**
 * Obtiene el basePath configurado para la app.
 */
export function getBasePath(): string {
  return normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
}

/**
 * Prefija el basePath a una ruta interna.
 */
export function withBasePath(path: string): string {
  const basePath = getBasePath();
  if (!basePath) return path;
  if (!path) return basePath;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  if (path.startsWith("/")) return `${basePath}${path}`;
  return `${basePath}/${path}`;
}

/**
 * Remueve el basePath de una ruta interna.
 */
export function stripBasePath(path: string): string {
  const basePath = getBasePath();
  if (!basePath) return path;
  if (path === basePath) return "/";
  if (path.startsWith(`${basePath}/`)) return path.slice(basePath.length);
  return path;
}
