// tests/api/helpers/testData.ts
/**
 * Test fixtures and data factory for consistent test data
 */

export const testData = {
  // Valid credentials for testing
  validCredentials: {
    username: "admin",
    password: "admin",
  },

  invalidCredentials: {
    username: "nonexistent",
    password: "wrongpassword",
  },

  // Test user data
  testUser: {
    FirstName: "Test",
    LastName: "User",
    Email: "testuser@example.com",
    IsActive: true,
    RoleID: 2, // General user
  },

  testAdminUser: {
    FirstName: "Admin",
    LastName: "Test",
    Email: "admin@example.com",
    IsActive: true,
    RoleID: 1, // Admin
  },

  // Test category data
  testCategory: {
    CategoryName: "Test Category",
    Description: "A test category for automated tests",
  },

  testCategory2: {
    CategoryName: "Test Category 2",
    Description: "Another test category",
  },

  // Test unit data
  testUnit: {
    UnitName: "Test Unit",
    Abbreviation: "TU",
  },

  testUnit2: {
    UnitName: "Kilogram",
    Abbreviation: "kg",
  },

  // Test supplier data
  testSupplier: {
    SupplierName: "Test Supplier",
    ContactPerson: "John Doe",
    Phone: "123-456-7890",
    Email: "supplier@example.com",
    Address: "123 Test Street",
    IsActive: true,
  },

  // Test warehouse data (will be populated from DB)
  testWarehouse: {
    WarehouseCode: "TST-WH",
    WarehouseName: "Test Warehouse",
    MainLocationID: 1, // Adjust based on actual DB
    IsActive: true,
  },

  // Test product data
  testProduct: {
    ProductName: "Test Product",
    InternalSKU: "TST-SKU-001",
    Barcode: "TST-BARCODE-001",
    CategoryID: 1, // Will be set dynamically
    UnitID: 1, // Will be set dynamically
    Cost: 10.0,
    Description: "A test product for automated tests",
  },

  testProduct2: {
    ProductName: "Test Product 2",
    InternalSKU: "TST-SKU-002",
    Barcode: "TST-BARCODE-002",
    CategoryID: 1,
    UnitID: 1,
    Cost: 20.0,
    Description: "Another test product",
  },

  // Test inventory data
  testInventory: {
    ProductID: 1, // Will be set dynamically
    WarehouseID: 1, // Will be set dynamically
    QuantityOnHand: 100,
    QuantityReserved: 10,
    ReorderLevel: 20,
  },

  // Test scanner/inventory transaction data
  scannerData: {
    warehouseId: 1, // Will be set dynamically
    barcode: "TST-BARCODE-001",
    operation: "entrada", // 'entrada' or 'salida'
    quantity: 50,
    notes: "Test scan",
  },

  // Test inventory update data
  inventoryUpdate: {
    productId: 1, // Will be set dynamically
    warehouseId: 1, // Will be set dynamically
    newQuantity: 150,
    updateType: "table",
  },
};

/**
 * Generate unique test data with timestamps to avoid conflicts
 */
export function generateUniqueTestData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const uniqueId = `${timestamp}-${random}`;

  return {
    category: {
      ...testData.testCategory,
      CategoryName: `TestCat-${uniqueId}`,
    },
    unit: {
      ...testData.testUnit,
      UnitName: `TestUnit-${uniqueId}`,
    },
    supplier: {
      ...testData.testSupplier,
      SupplierName: `TestSupplier-${uniqueId}`,
    },
    product: {
      ...testData.testProduct,
      ProductName: `TestProduct-${uniqueId}`,
      Barcode: `TST-BC-${uniqueId}`,
      InternalSKU: `TST-SKU-${uniqueId}`,
    },
    user: {
      ...testData.testUser,
      Email: `testuser-${uniqueId}@example.com`,
    },
  };
}
