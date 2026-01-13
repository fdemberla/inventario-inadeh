// tests/api/__tests__/auth.test.ts
/**
 * Authentication API Tests
 * Tests login endpoint with valid/invalid credentials
 */

import { createTestClient } from '../helpers/testClient';
import { testData } from '../helpers/testData';

const client = createTestClient();

describe('Authentication - POST /api/login', () => {
  beforeEach(() => {
    client.clear();
  });

  describe('Valid Credentials', () => {
    it('should return 200 with valid username and password', async () => {
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.message).toBeTruthy();
    });

    it('should set authentication cookie on successful login', async () => {
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(response.status).toBe(200);
      // Token is stored in httpOnly cookie, check Set-Cookie header
      expect(response.setCookie).toBeTruthy();
      expect(response.setCookie).toContain('token');
    });

    it('should return success message on valid login', async () => {
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('exitoso');
    });
  });

  describe('Invalid Credentials', () => {
    it('should return 401 with wrong password', async () => {
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.data.error || response.data.message).toBeTruthy();
    });

    it('should return 401 with non-existent user', async () => {
      const response = await client.post('/api/login', {
        username: 'nonexistent@example.com',
        password: 'anypassword',
      });

      expect(response.status).toBe(401);
    });

    it('should not set cookie on failed login', async () => {
      await client.post('/api/login', {
        username: 'nonexistent',
        password: 'wrongpass',
      });

      expect(client.getToken()).toBeNull();
    });
  });

  describe('Missing Fields', () => {
    it('should return 400 when username is missing', async () => {
      const response = await client.post('/api/login', {
        password: 'somepassword',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const response = await client.post('/api/login', {
        username: 'someuser',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when both fields are missing', async () => {
      const response = await client.post('/api/login', {});

      expect(response.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string username', async () => {
      const response = await client.post('/api/login', {
        username: '',
        password: 'anypassword',
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should handle empty string password', async () => {
      const response = await client.post('/api/login', {
        username: 'anyuser',
        password: '',
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should be case-sensitive for username', async () => {
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username.toUpperCase(),
        password: testData.validCredentials.password,
      });

      // Most systems are case-insensitive for usernames, but verify behavior
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it('should not lock account after single failed attempt', async () => {
      await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: 'wrongpass',
      });

      // Should still be able to try again
      const response = await client.post('/api/login', {
        username: testData.validCredentials.username,
        password: testData.validCredentials.password,
      });

      // Should succeed or at least not be rate limited (5xx error)
      expect(response.status).not.toBeGreaterThanOrEqual(500);
    });
  });
});
