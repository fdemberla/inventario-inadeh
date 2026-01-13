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
const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

export class TestClient {
  private baseUrl: string;
  private token: string | null = null;
  private cookies: Map<string, string> = new Map();

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
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
   * Perform GET request
   */
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * Perform POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /**
   * Perform PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /**
   * Perform DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Internal request method
   */
  private async request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add token to Authorization header if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add stored cookies
    if (this.cookies.size > 0) {
      headers['Cookie'] = Array.from(this.cookies.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetchFn(url, options);
      let data: T = {} as T;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }
      } catch (e) {
        // Response body is not JSON
      }

      // Extract and store cookies from Set-Cookie header
      const setCookie = response.headers.get('set-cookie');
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
      console.error('Test client error:', error);
      return {
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Network error' } as T,
        headers: {},
      };
    }
  }

  /**
   * Parse cookie from Set-Cookie header
   */
  private parseCookie(setCookieHeader: string): void {
    const cookieParts = setCookieHeader.split(';')[0].split('=');
    if (cookieParts.length === 2) {
      this.cookies.set(cookieParts[0].trim(), cookieParts[1].trim());
    }
  }

  /**
   * Clear all stored tokens and cookies
   */
  clear(): void {
    this.token = null;
    this.cookies.clear();
  }
}

/**
 * Create a new test client instance
 */
export function createTestClient(options?: TestClientOptions): TestClient {
  return new TestClient(options);
}
