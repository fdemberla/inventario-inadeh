// tests/api/helpers/testClient.ts
/**
 * Test HTTP client that handles authentication and API calls
 * Manages JWT tokens from cookies
 */

interface TestClientOptions {
  baseUrl?: string;
  token?: string;
}

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
  setCookie?: string;
}

// Use global fetch (available in Node 18+) or require node-fetch
import { withBasePath } from "@/lib/utils";

const fetchFn = typeof fetch !== "undefined" ? fetch : require("node-fetch");

export class TestClient {
  private baseUrl: string;
  private token: string | null = null;
  private cookies: Map<string, string> = new Map();

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:3000";
    this.token = options.token || null;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get cookies as header string
   */
  getCookieHeader(): string {
    if (this.cookies.size === 0) return "";
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  /**
   * Perform GET request
   */
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint);
  }

  /**
   * Perform POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, body);
  }

  /**
   * Perform PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, body);
  }

  /**
   * Perform DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint);
  }

  /**
   * Internal request method
   */
  private async request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    // Auto-prepend basePath if endpoint doesn't already have it
    const basePath = "/inventario";
    const normalizedEndpoint = endpoint.startsWith(basePath)
      ? endpoint
      : `${basePath}${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add token to Authorization header if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    // Add stored cookies
    if (this.cookies.size > 0) {
      headers["Cookie"] = Array.from(this.cookies.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetchFn(url, options);
      let data: T = {} as T;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        }
      } catch (e) {
        // Response body is not JSON
      }

      // Extract and store cookies from Set-Cookie header
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        this.parseCookie(setCookie);
      }

      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        setCookie: setCookie || undefined,
      };
    } catch (error) {
      // If fetch itself fails (network error, etc), return error response
      console.error("Test client error:", error);
      return {
        status: 0,
        data: {
          error: error instanceof Error ? error.message : "Network error",
        } as T,
        headers: {},
      };
    }
  }

  /**
   * Parse cookies from Set-Cookie header (handles multiple cookies)
   */
  private parseCookie(setCookieHeader: string): void {
    // Set-Cookie can have multiple cookies separated by commas
    // But cookie values can also contain commas, so we split carefully
    // NextAuth format: name=value; Path=/; HttpOnly, name2=value2; Path=/; HttpOnly
    const cookies = setCookieHeader.split(/,(?=\s*[^;=]+=)/);
    for (const cookie of cookies) {
      const cookieParts = cookie.trim().split(";")[0].split("=");
      if (cookieParts.length >= 2) {
        const name = cookieParts[0].trim();
        const value = cookieParts.slice(1).join("=").trim();
        this.cookies.set(name, value);
      }
    }
  }

  /**
   * Clear all stored tokens and cookies
   */
  clear(): void {
    this.token = null;
    this.cookies.clear();
  }

  /**
   * Set a cookie for subsequent requests
   */
  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }
}

/**
 * Create a new test client instance
 */
export function createTestClient(options?: TestClientOptions): TestClient {
  return new TestClient(options);
}

/**
 * Authenticate using NextAuth credentials provider
 * This is used for integration tests that need authenticated sessions
 */
export async function loginWithNextAuth(
  client: TestClient,
  credentials: { username: string; password: string },
): Promise<boolean> {
  try {
    // Step 1: Get CSRF token (use raw paths; basePath is already in Next.js config)
    const csrfResponse = await client.get<{ csrfToken: string }>(
      "/inventario/api/auth/csrf",
    );
    const csrfToken = csrfResponse.data?.csrfToken;

    if (!csrfToken) {
      console.error("Failed to get CSRF token");
      return false;
    }

    // Step 2: Authenticate with NextAuth credentials endpoint
    // NextAuth expects form data, but our client sends JSON
    // We need to make a direct fetch call for this
    const baseUrl = client.getBaseUrl();
    const formData = new URLSearchParams();
    formData.append("csrfToken", csrfToken);
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);
    formData.append("callbackUrl", "/inventario/dashboard");
    formData.append("json", "true");

    // Must include the CSRF cookie from the previous request
    const cookieHeader = client.getCookieHeader();

    const response = await fetchFn(
      `${baseUrl}/inventario/api/auth/callback/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: formData.toString(),
        redirect: "manual", // Don't follow redirects automatically
      },
    );

    // NextAuth sets session cookie on successful auth
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      // Parse and store all cookies
      const cookies = setCookie.split(",").map((c) => c.trim());
      for (const cookie of cookies) {
        const cookieParts = cookie.split(";")[0].split("=");
        if (cookieParts.length >= 2) {
          const name = cookieParts[0].trim();
          const value = cookieParts.slice(1).join("=").trim();
          // Store cookie in client
          client.setCookie(name, value);
        }
      }
    }

    // Check if authentication was successful by verifying session
    // NextAuth v5 may return various status codes, so we verify via session
    const sessionResponse = await client.get<{ user?: unknown }>(
      "/inventario/api/auth/session",
    );
    return !!sessionResponse.data?.user;
  } catch (error) {
    console.error("NextAuth login error:", error);
    return false;
  }
}
