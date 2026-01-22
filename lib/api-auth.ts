// lib/api-auth.ts
// Unified authentication helper for API routes
// Supports both NextAuth web sessions and mobile Bearer tokens
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getMobileSession, MobileUserPayload } from "@/lib/mobile-auth";

// Unified user interface for both auth methods
export interface ApiUser {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Auth result interface
export interface ApiAuthResult {
  user: ApiUser | null;
  authMethod: "web" | "mobile" | null;
}

/**
 * Get authenticated user from either web session or mobile Bearer token
 * Checks Bearer token first (for mobile), then falls back to NextAuth session (for web)
 *
 * Usage in API routes:
 * ```typescript
 * const { user, authMethod } = await getApiAuth(request);
 * if (!user) {
 *   return NextResponse.json({ message: "No autorizado" }, { status: 401 });
 * }
 * // user.id, user.username, user.role, etc.
 * ```
 */
export async function getApiAuth(request: NextRequest): Promise<ApiAuthResult> {
  // Check for mobile Bearer token first
  const mobileSession = await getMobileSession(request);
  if (mobileSession) {
    return {
      user: {
        id: mobileSession.id,
        username: mobileSession.username,
        role: mobileSession.role,
        firstName: mobileSession.firstName,
        lastName: mobileSession.lastName,
        email: mobileSession.email,
      },
      authMethod: "mobile",
    };
  }

  // Fall back to NextAuth web session
  const webSession = await auth();
  if (webSession?.user) {
    return {
      user: {
        id: webSession.user.id,
        username: webSession.user.username,
        role: webSession.user.role,
        firstName: webSession.user.firstName,
        lastName: webSession.user.lastName,
        email: webSession.user.email,
      },
      authMethod: "web",
    };
  }

  // Not authenticated
  return { user: null, authMethod: null };
}

/**
 * Simple helper that just returns the user or null
 * For use when you don't need to know the auth method
 */
export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
  const { user } = await getApiAuth(request);
  return user;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: ApiUser): boolean {
  return user.role === 1; // USER_ROLES.ADMIN
}

/**
 * Type guard for MobileUserPayload
 */
export function isMobileUser(
  payload: MobileUserPayload | null
): payload is MobileUserPayload {
  return payload !== null;
}
