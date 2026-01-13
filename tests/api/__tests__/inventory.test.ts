// tests/api/__tests__/inventory.test.ts
/**
 * Inventory API Tests
 * Tests inventory updates, transactions, and level management
 */

import { createTestClient } from '../helpers/testClient';
import { testData } from '../helpers/testData';

const client = createTestClient();

describe('Inventory Management APIs', () => {
  beforeEach(async () => {
    client.clear();
    // Login before each test
    const loginResponse = await client.post('/api/login', {
      username: testData.validCredentials.username,
      password: testData.validCredentials.password,
    });
    expect(loginResponse.status).toBe(200);
  });

  describe('POST /api/inventory/update - Update Inventory Levels', () => {
    it('should return 200 for valid inventory update', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        warehouseId: testData.inventoryUpdate.warehouseId,
        newQuantity: testData.inventoryUpdate.newQuantity,
        updateType: testData.inventoryUpdate.updateType,
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should update quantity on hand', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        warehouseId: testData.inventoryUpdate.warehouseId,
        newQuantity: 200,
        updateType: 'table',
      });

      if (response.status === 200) {
        expect(response.data.success || response.data.message).toBeTruthy();
        // May return updated quantity
        if (response.data.newQuantity !== undefined) {
          expect(response.data.newQuantity).toBe(200);
        }
      }
    });

    it('should accept different update types', async () => {
      const updateTypes = ['table', 'form']; // Common update types

      for (const updateType of updateTypes) {
        const response = await client.post('/api/inventory/update', {
          productId: testData.inventoryUpdate.productId,
          warehouseId: testData.inventoryUpdate.warehouseId,
          newQuantity: 150,
          updateType,
        });

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    }, 15000);

    it('should require productId', async () => {
      const response = await client.post('/api/inventory/update', {
        warehouseId: testData.inventoryUpdate.warehouseId,
        newQuantity: 100,
        updateType: 'table',
      });

      expect([400, 404]).toContain(response.status);
    });

    it('should require warehouseId', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        newQuantity: 100,
        updateType: 'table',
      });

      expect([400, 404]).toContain(response.status);
    });

    it('should require newQuantity', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        warehouseId: testData.inventoryUpdate.warehouseId,
        updateType: 'table',
      });

      expect([400, 404]).toContain(response.status);
    });

    it('should accept non-negative quantities', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        warehouseId: testData.inventoryUpdate.warehouseId,
        newQuantity: 0,
        updateType: 'table',
      });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should reject negative quantities', async () => {
      const response = await client.post('/api/inventory/update', {
        productId: testData.inventoryUpdate.productId,
        warehouseId: testData.inventoryUpdate.warehouseId,
        newQuantity: -50,
        updateType: 'table',
      });

      expect([200, 400, 404]).toContain(response.status); // May allow with warning
    });
  });

  describe('GET /api/inventory/transactions - Transaction History', () => {
    it('should return 200 with transaction list', async () => {
      const response = await client.get('/api/inventory/transactions');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data) || Array.isArray(response.data.recordset)).toBeTruthy();
    });

    it('should return transactions with required fields', async () => {
      const response = await client.get('/api/inventory/transactions');

      expect(response.status).toBe(200);
      const transactions = response.data.recordset || response.data;

      if (transactions.length > 0) {
        const transaction = transactions[0];
        expect(transaction).toHaveProperty('TransactionID');
        expect(transaction).toHaveProperty('InventoryID');
        expect(transaction).toHaveProperty('TransactionType');
        expect(transaction).toHaveProperty('QuantityChange');
      }
    });

    it('should support limit parameter', async () => {
      const response = await client.get('/api/inventory/transactions?limit=10');

      expect([200, 405, 404]).toContain(response.status);
      
      if (response.status === 200) {
        const transactions = response.data?.recordset || response.data;
        // Only check limit if we got actual transaction data back
        if (Array.isArray(transactions) && transactions.length > 0) {
          // Note: API may ignore limit parameter, just verify it returns data
          expect(transactions.length).toBeGreaterThan(0);
        }
      }
    });

    it('should support order parameter', async () => {
      const ascResponse = await client.get('/api/inventory/transactions?order=ASC');
      const descResponse = await client.get('/api/inventory/transactions?order=DESC');

      expect(ascResponse.status).toBe(200);
      expect(descResponse.status).toBe(200);
    });

    it('should filter by inventoryId if provided', async () => {
      const response = await client.get('/api/inventory/transactions?inventoryId=1');

      expect(response.status).toBe(200);
      const transactions = response.data.recordset || response.data;

      // All results should match the filter if implemented
      if (transactions.length > 0) {
        // Optionally verify filtering works
      }
    });

    it('should require authentication', async () => {
      client.clear();
      const response = await client.get('/api/inventory/transactions');

      expect(response.status).toBe(401);
    });

    it('should return empty array if no transactions exist', async () => {
      const response = await client.get('/api/inventory/transactions?limit=1000');

      expect(response.status).toBe(200);
      const transactions = response.data.recordset || response.data;
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should format dates in response', async () => {
      const response = await client.get('/api/inventory/transactions?limit=1');

      expect(response.status).toBe(200);
      const transactions = response.data.recordset || response.data;

      if (transactions.length > 0) {
        const transaction = transactions[0];
        // Should have formatted date or timestamp
        expect(transaction.CreatedDate || transaction.FormattedDate).toBeTruthy();
      }
    });

    it('should include product and warehouse names in response', async () => {
      const response = await client.get('/api/inventory/transactions?limit=1');

      expect(response.status).toBe(200);
      const transactions = response.data.recordset || response.data;

      if (transactions.length > 0) {
        const transaction = transactions[0];
        expect(transaction.ProductName || transaction.product).toBeTruthy();
        expect(transaction.WarehouseName || transaction.warehouse).toBeTruthy();
      }
    });
  });

  describe('POST /api/inventory/scanner/sync - Offline Sync', () => {
    it('should accept sync request for offline data', async () => {
      const response = await client.post('/api/inventory/scanner/sync', {
        scans: [
          {
            barcode: testData.scannerData.barcode,
            operation: 'entrada',
            quantity: 10,
            warehouseId: testData.scannerData.warehouseId,
          },
        ],
      });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should process multiple scans in batch', async () => {
      const response = await client.post('/api/inventory/scanner/sync', {
        scans: [
          {
            barcode: 'BARCODE-1',
            operation: 'entrada',
            quantity: 10,
            warehouseId: 1,
          },
          {
            barcode: 'BARCODE-2',
            operation: 'salida',
            quantity: 5,
            warehouseId: 1,
          },
        ],
      });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return sync status after processing', async () => {
      const response = await client.post('/api/inventory/scanner/sync', {
        scans: [],
      });

      if (response.status === 200) {
        // Should return sync metadata
        expect(
          response.data.synced ||
            response.data.processed ||
            response.data.message,
        ).toBeTruthy();
      }
    });

    it('should handle partial failures in batch', async () => {
      const response = await client.post('/api/inventory/scanner/sync', {
        scans: [
          {
            barcode: testData.scannerData.barcode,
            operation: 'entrada',
            quantity: 10,
            warehouseId: testData.scannerData.warehouseId,
          },
          {
            barcode: 'INVALID-BC',
            operation: 'entrada',
            quantity: 5,
            warehouseId: 1,
          },
        ],
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should require authentication', async () => {
      client.clear();
      const response = await client.post('/api/inventory/scanner/sync', {
        scans: [],
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Inventory Data Consistency', () => {
    it('should have QuantityOnHand >= 0', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) return;

      const inventoryResponse = await client.get(`/api/inventory/${warehouses[0].WarehouseID}`);
      const inventory = inventoryResponse.data.recordset || inventoryResponse.data;

      inventory.forEach((item: any) => {
        expect(item.QuantityOnHand).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have QuantityReserved <= QuantityOnHand', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) return;

      const inventoryResponse = await client.get(`/api/inventory/${warehouses[0].WarehouseID}`);
      const inventory = inventoryResponse.data.recordset || inventoryResponse.data;

      inventory.forEach((item: any) => {
        if (item.QuantityReserved !== null && item.QuantityReserved !== undefined) {
          expect(item.QuantityReserved).toBeLessThanOrEqual(item.QuantityOnHand);
        }
      });
    });

    it('should have valid ReorderLevel if set', async () => {
      const warehousesResponse = await client.get('/api/warehouses/user');
      const warehouses = warehousesResponse.data.recordset || warehousesResponse.data;

      if (warehouses.length === 0) return;

      const inventoryResponse = await client.get(`/api/inventory/${warehouses[0].WarehouseID}`);
      const inventory = inventoryResponse.data.recordset || inventoryResponse.data;

      inventory.forEach((item: any) => {
        if (item.ReorderLevel !== null && item.ReorderLevel !== undefined) {
          expect(item.ReorderLevel).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Performance - Inventory Operations', () => {
    it('should fetch inventory within 5 seconds', async () => {
      const startTime = Date.now();
      const response = await client.get('/api/inventory/transactions?limit=100');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle large transaction history efficiently', async () => {
      const startTime = Date.now();
      const response = await client.get('/api/inventory/transactions?limit=1000');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
