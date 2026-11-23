// lib/authz.ts
// Authorization guards for API route handlers.
//
// Every route must enforce its own access rules: the middleware only checks
// that *some* session exists (and skips verification for /mobile/ Bearer
// routes), it never checks roles or warehouse ownership.
//
// Usage:
//   const guard = await requireAdmin(req);
//   if (guard.error) return guard.error;
//   const { user } = guard;
import { NextRequest, NextResponse } from "next/server";
import { getApiAuth, isAdmin, type ApiUser } from "@/lib/api-auth";
import { canAccessWarehouse } from "@/lib/permissions";

export type Guard =
  | { user: ApiUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "No autorizado" },
    { status: 401 },
  );

const forbidden = (message: string) =>
  NextResponse.json({ success: false, message }, { status: 403 });

/** Any authenticated, active user (web session or mobile token). */
export async function requireUser(req: NextRequest): Promise<Guard> {
  const { user } = await getApiAuth(req);
  if (!user) return { error: unauthorized() };
  return { user };
}

/** Authenticated user with the ADMIN role. */
export async function requireAdmin(req: NextRequest): Promise<Guard> {
  const guard = await requireUser(req);
  if (guard.error) return guard;
  if (!isAdmin(guard.user)) {
    return { error: forbidden("No tienes permisos de administrador") };
  }
  return guard;
}

/** Authenticated user assigned to the given warehouse (admins: any). */
export async function requireWarehouse(
  req: NextRequest,
  warehouseId: number | string | null | undefined,
): Promise<Guard> {
  const guard = await requireUser(req);
  if (guard.error) return guard;
  if (!(await userCanAccessWarehouse(guard.user, warehouseId))) {
    return { error: forbidden("No tienes permiso para acceder a este almacén") };
  }
  return guard;
}

/** For handlers that touch several warehouses (e.g. batch sync). */
export async function userCanAccessWarehouse(
  user: ApiUser,
  warehouseId: number | string | null | undefined,
): Promise<boolean> {
  if (warehouseId === null || warehouseId === undefined || warehouseId === "")
    return false;
  if (!/^\d+$/.test(String(warehouseId))) return false;
  return canAccessWarehouse(user, warehouseId);
}
