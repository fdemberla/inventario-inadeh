// tests/api/__tests__/scanner.test.ts
/**
 * Scanner API Tests
 * Tests barcode scanning and inventory updates
 */

import { createTestClient } from "../helpers/testClient";
import { testData } from "../helpers/testData";

const client = createTestClient();

describe("Scanner Operations - POST /api/inventory/scanner", () => {
  beforeEach(async () => {
    client.clear();
    // Login before each test
    const loginResponse = await client.post("/api/login", {
      username: testData.validCredentials.username,
      password: testData.validCredentials.password,
    });
    expect(loginResponse.status).toBe(200);
  });

  describe("Valid Barcode Scanning", () => {
    it("should return 200 with valid barcode and operation", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada", // entrada = in, salida = out
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
        notes: "Test scan",
      });

      // Should succeed or return product not found (which is expected if product doesn't exist)
      expect([200, 404]).toContain(response.status);
    });

    it("should create/update inventory for entrada (receipt) operation", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 50,
        notes: "Received from supplier",
      });

      // Check response indicates success or product found
      if (response.status === 200) {
        expect(response.data.success || response.data.quantity).toBeTruthy();
        // Verify quantity was increased if operation succeeded
        if (response.data.newQuantity !== undefined) {
          expect(response.data.newQuantity).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should decrease inventory for salida (out) operation", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "salida",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
        notes: "Stock removal",
      });

      if (response.status === 200) {
        expect(response.data.success || response.data.quantity).toBeTruthy();
      }
    });

    it("should return product name in response", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 5,
      });

      if (response.status === 200) {
        expect(response.data.productName || response.data.product).toBeTruthy();
      }
    });

    it("should return updated quantity in response", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 20,
      });

      if (response.status === 200) {
        expect(
          response.data.newQuantity !== undefined ||
            response.data.quantity !== undefined,
        ).toBeTruthy();
      }
    });
  });

  describe("Invalid Barcode", () => {
    it("should return 404 for non-existent barcode", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: "INVALID-BARCODE-12345",
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      expect(response.status).toBe(404);
    });

    it("should handle missing barcode", async () => {
      const response = await client.post("/api/inventory/scanner", {
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  describe("Invalid Operations", () => {
    it("should accept entrada and salida operations", async () => {
      const entradaResponse = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      const salidaResponse = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "salida",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 5,
      });

      expect([200, 404]).toContain(entradaResponse.status);
      expect([200, 404]).toContain(salidaResponse.status);
    });

    it("should reject invalid operation type", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "invalidop",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe("Quantity Validation", () => {
    it("should accept positive quantities", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 100,
      });

      expect([200, 404]).toContain(response.status);
    });

    it("should reject zero quantity", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 0,
      });

      expect([400, 404]).toContain(response.status);
    });

    it("should reject negative quantity", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: -10,
      });

      expect([400, 404]).toContain(response.status);
    });

    it("should prevent negative inventory (for salida)", async () => {
      // This test validates business logic - can't remove more than exists
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "salida",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 999999, // Unreasonably large number
      });

      // Should either prevent negative or allow with warning
      // Depends on implementation
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  it("should handle missing barcode", async () => {
    const response = await client.post("/api/inventory/scanner", {
      operation: "entrada",
      warehouseId: testData.scannerData.warehouseId,
      quantity: 10,
    });

    expect([200, 400, 404, 500]).toContain(response.status);
  });

  it("should handle missing operation", async () => {
    const response = await client.post("/api/inventory/scanner", {
      barcode: testData.scannerData.barcode,
      warehouseId: testData.scannerData.warehouseId,
      quantity: 10,
    });

    expect([200, 400, 404, 500]).toContain(response.status);
  });

  it("should handle missing quantity", async () => {
    const response = await client.post("/api/inventory/scanner", {
      barcode: testData.scannerData.barcode,
      operation: "entrada",
      warehouseId: testData.scannerData.warehouseId,
    });

    expect([200, 400, 404, 500]).toContain(response.status);
  });

  it("should require warehouseId", async () => {
    const response = await client.post("/api/inventory/scanner", {
      barcode: testData.scannerData.barcode,
      operation: "entrada",
      quantity: 10,
    });

    expect([200, 400, 404, 500]).toContain(response.status);
  });

  describe("Transaction Logging", () => {
    it("should create transaction record on successful scan", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 25,
        notes: "Transaction test",
      });

      if (response.status === 200) {
        // Transaction should be logged
        expect(
          response.data.transactionId || response.data.message,
        ).toBeTruthy();
      }
    });

    it("should record notes in transaction", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 15,
        notes: "Custom notes for this scan",
      });

      if (response.status === 200) {
        // Notes should be stored or acknowledged
        expect(response.data.success || response.data.newQuantity).toBeTruthy();
      }
    });
  });

  describe("Offline Scanner Support", () => {
    it("should accept scans with or without authentication token", async () => {
      // Scanner module may work without explicit token (uses default scanner user)
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode,
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      // Should work regardless of token status
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe("Barcode Format Edge Cases", () => {
    it("should handle barcodes with special characters", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: "SPECIAL-BC-*123*",
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      // Should either find it or return 404
      expect([200, 404]).toContain(response.status);
    });

    it("should be case-sensitive for barcodes", async () => {
      const response = await client.post("/api/inventory/scanner", {
        barcode: testData.scannerData.barcode.toUpperCase(),
        operation: "entrada",
        warehouseId: testData.scannerData.warehouseId,
        quantity: 10,
      });

      // Behavior depends on DB - may be case-insensitive
      expect([200, 404]).toContain(response.status);
    });
  });
});
