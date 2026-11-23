// lib/mobile-auth.ts
// Mobile authentication utilities using JWT with jose library
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { NextRequest } from "next/server";

// Mobile user payload interface (matches NextAuth session structure)
export interface MobileUserPayload extends JWTPayload {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Token expiration time (7 days, matching NextAuth config)
const TOKEN_EXPIRATION = "7d";

// Get the secret as Uint8Array for jose library
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token for mobile authentication
 * Uses the same secret as NextAuth for consistency
 */
export async function signMobileToken(user: {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .setSubject(String(user.id))
    .sign(secret);

  return token;
}

/**
 * Verify a mobile JWT token and return the user payload
 * Returns null if token is invalid or expired
 */
export async function verifyMobileToken(
  token: string
): Promise<MobileUserPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);

    // Validate required fields exist
    if (
      typeof payload.id !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "number"
    ) {
      return null;
    }

    return payload as MobileUserPayload;
  } catch {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 * Returns null if header is missing or malformed
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Get mobile session from request
 * Extracts Bearer token and verifies it
 * Returns the user payload or null if not authenticated
 */
export async function getMobileSession(
  request: NextRequest
): Promise<MobileUserPayload | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }
  return verifyMobileToken(token);
}

/**
 * Sanitize user input for logging (remove sensitive data)
 */
export function sanitizeForLog(username: string): string {
  // Only log first 3 characters for privacy
  if (username.length <= 3) {
    return "***";
  }
  return username.slice(0, 3) + "***";
}
