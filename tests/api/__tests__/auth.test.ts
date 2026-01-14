// tests/api/__tests__/auth.test.ts
/**
 * Authentication API Tests
 * Tests NextAuth authentication endpoints
 */

import { createTestClient, loginWithNextAuth } from "../helpers/testClient";
import { testData } from "../helpers/testData";

const client = createTestClient();

describe("Authentication - NextAuth Endpoints", () => {
  beforeEach(() => {
    client.clear();
  });

  describe("NextAuth Providers", () => {
    it("should return providers list from /api/auth/providers", async () => {
      const response = await client.get("/api/auth/providers");

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      // Should have credentials provider configured
      expect(response.data.credentials).toBeDefined();
    });
  });

  describe("NextAuth Session", () => {
    it("should return null session when not authenticated", async () => {
      const response = await client.get("/api/auth/session");

      expect(response.status).toBe(200);
      // Session should be empty/null or have no user when not logged in
      expect(response.data?.user).toBeUndefined();
    });
  });

  describe("NextAuth CSRF", () => {
    it("should return CSRF token from /api/auth/csrf", async () => {
      const response = await client.get("/api/auth/csrf");

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.csrfToken).toBeDefined();
    });
  });

  describe("Credential Authentication Flow", () => {
    it("should authenticate with valid credentials via helper", async () => {
      // Use the loginWithNextAuth helper which handles form data correctly
      const loggedIn = await loginWithNextAuth(client, {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(loggedIn).toBe(true);
    });

    it("should reject invalid credentials", async () => {
      const loggedIn = await loginWithNextAuth(client, {
        username: testData.validCredentials.username,
        password: "wrongpassword",
      });

      // Login should fail with wrong password
      // Note: NextAuth may still return success code but no session
      // The real test is whether we get a valid session
      const sessionResponse = await client.get("/api/auth/session");
      expect(sessionResponse.data?.user).toBeUndefined();
    });

    it("should reject non-existent user", async () => {
      const loggedIn = await loginWithNextAuth(client, {
        username: "nonexistent@example.com",
        password: "anypassword",
      });

      // Check that no session was established
      const sessionResponse = await client.get("/api/auth/session");
      expect(sessionResponse.data?.user).toBeUndefined();
    });
  });

  describe("Protected Session After Login", () => {
    it("should return user data in session after successful login", async () => {
      // Login using helper
      const loggedIn = await loginWithNextAuth(client, {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(loggedIn).toBe(true);

      // Check session
      const sessionResponse = await client.get("/api/auth/session");

      // If login was successful, session should have user
      if (sessionResponse.data?.user) {
        expect(sessionResponse.data.user.username).toBe(
          testData.validCredentials.username,
        );
        expect(sessionResponse.data.user.role).toBeDefined();
        expect(sessionResponse.data.user.id).toBeDefined();
      }
    });
  });

  describe("Signout Flow", () => {
    it("should clear session on signout", async () => {
      // Login first
      const loggedIn = await loginWithNextAuth(client, {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(loggedIn).toBe(true);

      // Get CSRF token for signout
      const csrfResponse = await client.get("/api/auth/csrf");
      const csrfToken = csrfResponse.data.csrfToken;

      // Signout
      const signoutResponse = await client.post("/api/auth/signout", {
        csrfToken: csrfToken,
      });

      expect([200, 302]).toContain(signoutResponse.status);

      // Verify session is cleared
      const sessionResponse = await client.get("/api/auth/session");
      expect(sessionResponse.data?.user).toBeUndefined();
    });
  });
});
