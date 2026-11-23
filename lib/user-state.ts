// lib/user-state.ts
// Re-checks a user's current role / active status in the database.
// JWTs (web and mobile) live for 7 days; without this, deactivating or
// demoting a user would only take effect when their token expires.
import { rawSql } from "@/lib/db";

interface UserState {
  role: number;
  isActive: boolean;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<number, { state: UserState | null; expires: number }>();

/**
 * Returns the user's current role and active flag, or null if the user no
 * longer exists. Cached for 30s per user to avoid one query per request.
 */
export async function getCurrentUserState(
  userId: number,
): Promise<UserState | null> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expires > now) return hit.state;

  const rows = (await rawSql(
    `SELECT RoleID, IsActive FROM dbo.Users WHERE UserID = @param0`,
    [userId],
  )) as { RoleID: number; IsActive: boolean | number }[];

  const state: UserState | null =
    rows && rows.length > 0
      ? { role: Number(rows[0].RoleID), isActive: Boolean(rows[0].IsActive) }
      : null;

  cache.set(userId, { state, expires: now + CACHE_TTL_MS });
  return state;
}

/** Drop a cached entry, e.g. right after an admin edits that user. */
export function invalidateUserState(userId: number): void {
  cache.delete(userId);
}
