/**
 * A07: login throttling and revalidation of users with long-lived tokens.
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/db", () => ({ rawSql: jest.fn() }));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/mobile-auth", () => ({ getMobileSession: jest.fn() }));

import { rawSql } from "@/lib/db";
import { auth } from "@/auth";
import { getApiAuth } from "@/lib/api-auth";
import { invalidateUserState } from "@/lib/user-state";
import {
  loginRetryAfter,
  recordLoginFailure,
  recordLoginSuccess,
  clientIp,
} from "@/lib/rate-limit";

describe("login rate limit", () => {
  it("blocks after 5 failures for the same user+IP and resets on success", () => {
    const u = "victim", ip = "10.0.0.1";
    for (let i = 0; i < 5; i++) {
      expect(loginRetryAfter(u, ip)).toBe(0);
      recordLoginFailure(u, ip);
    }
    expect(loginRetryAfter(u, ip)).toBeGreaterThan(0);
    // other users from another IP are unaffected
    expect(loginRetryAfter("other", "10.0.0.2")).toBe(0);
    recordLoginSuccess(u, ip);
    expect(loginRetryAfter(u, ip)).toBe(0);
  });

  it("caps one username across rotating IPs", () => {
    for (let i = 0; i < 20; i++) recordLoginFailure("target", `1.1.1.${i}`);
    expect(loginRetryAfter("target", "9.9.9.9")).toBeGreaterThan(0);
  });

  it("prefers nginx X-Real-IP over client-controlled X-Forwarded-For", () => {
    const h = new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "6.6.6.6" });
    expect(clientIp(h)).toBe("1.2.3.4");
  });
});

describe("getApiAuth revalidates the token's user against the DB", () => {
  const req = new NextRequest("http://localhost:3000/api/x");

  beforeEach(() => {
    jest.clearAllMocks();
    invalidateUserState(2);
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 2, role: 1, username: "ex-admin" }, // stale role in JWT
    });
  });

  it("rejects a deactivated user", async () => {
    (rawSql as jest.Mock).mockResolvedValue([{ RoleID: 1, IsActive: false }]);
    expect((await getApiAuth(req)).user).toBeNull();
  });

  it("rejects a deleted user", async () => {
    (rawSql as jest.Mock).mockResolvedValue([]);
    expect((await getApiAuth(req)).user).toBeNull();
  });

  it("uses the current DB role, not the one in the token", async () => {
    (rawSql as jest.Mock).mockResolvedValue([{ RoleID: 2, IsActive: true }]);
    expect((await getApiAuth(req)).user?.role).toBe(2);
  });

  it("fails closed if the DB check errors", async () => {
    (rawSql as jest.Mock).mockRejectedValue(new Error("db down"));
    expect((await getApiAuth(req)).user).toBeNull();
  });
});
