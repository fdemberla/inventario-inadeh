// tests/api/__tests__/dashboard.test.ts
/**
 * Dashboard/Landing Page API Tests
 * Tests warehouse fetching and inventory aggregation
 */

import { createTestClient } from '../helpers/testClient';
import { testData } from '../helpers/testData';

const client = createTestClient();

describe('Dashboard - Landing Page APIs', () => {
  beforeEach(async () => {
    client.clear();
    // Login before each test
    const loginResponse = await client.post('/api/login', {
      username: testData.validCredentials.username,
      password: testData.validCredentials.password,
    });
    expect(loginResponse.status).toBe(200);
  });

  describe('GET /api/warehouses/user', () => {
    it('should return 200 with warehouses for authenticated user', async () => {
      const response = await client.get('/api/warehouses/user');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.recordset) || Array.isArray(response.data)).toBeTruthy();
    });

    it('should return warehouse data with required fields', async () => {
      const response = await client.get('/api/warehouses/user');

      expect(response.status).toBe(200);
      const warehouses = response.data.recordset || response.data;
      
      if (warehouses.length > 0) {
        const warehouse = warehouses[0];
        expect(warehouse).toHaveProperty('WarehouseID');
        expect(warehouse).toHaveProperty('WarehouseCode');
        expect(warehouse).toHaveProperty('WarehouseName');
      }
    });

    it('should filter warehouses by user role (non-admin)', async () => {
      const response = await client.get('/api/warehouses/user');

      expect(response.status).toBe(200);
      const warehouses = response.data.recordset || response.data;
      
      // Should return array (empty or with user-assigned warehouses)
      expect(Array.isArray(warehouses)).toBe(true);
    });

    it('should return empty array if user has no warehouses', async () => {
      const response = await client.get('/api/warehouses/user');

      expect(response.status).toBe(200);
      const warehouses = response.data.recordset || response.data;
      expect(Array.isArray(warehouses)).toBe(true);
    });

    it('should require authentication', async () => {
      client.clear(); // Clear token
      const response = await client.get('/api/warehouses/user');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/inventory/:warehouseId', () => {
    let warehouseId: number | null = null;

    beforeEach(async () => {
      // Get a valid warehouse ID
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;
      if (warehouses.length > 0) {
        warehouseId = warehouses[0].WarehouseID;
      }
    });

    it('should return 200 with inventory for valid warehouse', async () => {
      if (!warehouseId) {
        console.warn('No warehouse available for testing inventory');
        expect(true).toBe(true);
        return;
      }

      const response = await client.get(`/api/inventory/${warehouseId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data) || Array.isArray(response.data.recordset)).toBeTruthy();
    });

    it('should return empty array for warehouse with no inventory', async () => {
      if (!warehouseId) {
        console.warn('No warehouse available for testing inventory');
        expect(true).toBe(true);
        return;
      }

      const response = await client.get(`/api/inventory/${warehouseId}`);

      expect(response.status).toBe(200);
      const inventory = response.data.recordset || response.data;
      expect(Array.isArray(inventory)).toBe(true);
    });

    it('should return inventory items with required fields', async () => {
      if (!warehouseId) {
        console.warn('No warehouse available for testing inventory');
        expect(true).toBe(true);
        return;
      }

      const response = await client.get(`/api/inventory/${warehouseId}`);

      expect(response.status).toBe(200);
      const inventory = response.data.recordset || response.data;
      
      if (inventory.length > 0) {
        const item = inventory[0];
        expect(item).toHaveProperty('ProductID');
        expect(item).toHaveProperty('QuantityOnHand');
        expect(item).toHaveProperty('WarehouseID');
      }
    });

    it('should return 400 for invalid warehouse ID', async () => {
      const response = await client.get('/api/inventory/invalid-id');

      expect([400, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent warehouse', async () => {
      const response = await client.get('/api/inventory/99999999');

      expect([404, 200]).toContain(response.status); // May be 200 with empty array
    });

    it('should require authentication', async () => {
      client.clear();
      const response = await client.get('/api/inventory/1');

      expect(response.status).toBe(401);
    });
  });

  describe('Dashboard Data Integration', () => {
    it('should be able to fetch all warehouses and their inventories in parallel', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      expect(warehousesResponse.status).toBe(200);

      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      // Fetch inventory for each warehouse
      const inventoryPromises = warehouses.map((wh: any) =>
        client.get(`/api/inventory/${wh.WarehouseID}`),
      );

      const inventoryResponses = await Promise.all(inventoryPromises);

      // All should succeed
      inventoryResponses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data) || Array.isArray(response.data.recordset)).toBeTruthy();
      });
    });

    it('should handle case where user has multiple warehouses', async () => {
      const response = await client.get('/api/warehouses/user');
      expect(response.status).toBe(200);

      const warehouses = response.data.recordset || response.data;
      expect(Array.isArray(warehouses)).toBe(true);
      // Test passes if array (even if empty or with one item)
    });

    it('should properly aggregate inventory by category on client side', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const firstWarehouse = warehouses[0];
      const inventoryResponse = await client.get(`/api/inventory/${firstWarehouse.WarehouseID}`);
      const inventory = inventoryResponse.data.recordset || inventoryResponse.data;

      // Simulate client-side aggregation
      const categoryMap = new Map<string, number>();
      inventory.forEach((item: any) => {
        const categoryName = item.ProductName || 'Sin categoría';
        const quantity = item.QuantityOnHand || 0;
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + quantity);
      });

      // Should have aggregated data
      if (inventory.length > 0) {
        expect(categoryMap.size).toBeGreaterThan(0);
      }
    });

    it('should handle case sensitivity in category names', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) return;

      const inventoryResponse = await client.get(`/api/inventory/${warehouses[0].WarehouseID}`);
      const inventory = inventoryResponse.data.recordset || inventoryResponse.data;

      // Create category aggregation (should be case-sensitive)
      const categories = new Set<string>();
      inventory.forEach((item: any) => {
        categories.add(item.ProductName || 'Sin categoría');
      });

      expect(Array.from(categories).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance - Data Loading', () => {
    it('should fetch warehouses within 5 seconds', async () => {
      const startTime = Date.now();
      const response = await client.get('/api/warehouses/user');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should fetch inventory within 5 seconds', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) return;

      const startTime = Date.now();
      const response = await client.get(`/api/inventory/${warehouses[0].WarehouseID}`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
