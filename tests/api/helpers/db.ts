// tests/api/helpers/db.ts
/**
 * Database test utilities with transaction management
 * Ensures data isolation between tests using automatic rollback
 */

import { ConnectionPool, Transaction } from "mssql";

let testPool: ConnectionPool | null = null;

/**
 * Get or create test database connection pool
 */
export async function getTestPool(): Promise<ConnectionPool> {
  if (testPool) {
    return testPool;
  }

  // Use test database configuration from environment
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "mssql",
    database: process.env.DB_DATABASE || "InventarioInadeh",
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  const mssql = await import("mssql");
  testPool = new mssql.ConnectionPool(config);

  try {
    await testPool.connect();
    console.log("✅ Test database connected");
  } catch (error) {
    console.error("❌ Test database connection failed:", error);
    throw error;
  }

  return testPool;
}

/**
 * Execute a query within a transaction that auto-rollbacks
 * Perfect for test isolation
 */
export async function executeInTestTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  const pool = await getTestPool();
  const mssql = await import("mssql");
  const transaction = new mssql.Transaction(pool);

  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.rollback(); // Always rollback to keep DB clean
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
    throw error;
  }
}

/**
 * Execute a raw SQL query for test setup/cleanup
 */
export async function executeSql(
  query: string,
  params: unknown[] = [],
): Promise<any> {
  const pool = await getTestPool();
  const request = pool.request();

  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });

  try {
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("SQL execution error:", error);
    throw error;
  }
}

/**
 * Get a single record by ID
 */
export async function getById(
  table: string,
  id: number,
  idColumn: string = "ID",
): Promise<any> {
  const query = `SELECT * FROM ${table} WHERE ${idColumn} = @param0`;
  const result = await executeSql(query, [id]);
  return result?.[0] || null;
}

/**
 * Insert test data and return the created record
 */
export async function insertTestData(
  table: string,
  data: Record<string, unknown>,
): Promise<any> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const columnList = columns.join(", ");
  const paramList = columns.map((_, i) => `@param${i}`).join(", ");

  const query = `
    INSERT INTO ${table} (${columnList})
    OUTPUT INSERTED.*
    VALUES (${paramList})
  `;

  try {
    const result = await executeSql(query, values);
    return result?.[0] || null;
  } catch (error) {
    console.error(`Failed to insert into ${table}:`, error);
    throw error;
  }
}

/**
 * Delete test data
 */
export async function deleteTestData(
  table: string,
  condition: string,
  params: unknown[] = [],
): Promise<number> {
  const query = `DELETE FROM ${table} WHERE ${condition}`;
  try {
    const result = await executeSql(query, params);
    return result?.rowsAffected?.[0] || 0;
  } catch (error) {
    console.error(`Failed to delete from ${table}:`, error);
    throw error;
  }
}

/**
 * Close test database connection
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    try {
      await testPool.close();
      testPool = null;
      console.log("✅ Test database connection closed");
    } catch (error) {
      console.error("Error closing test pool:", error);
    }
  }
}

/**
 * Cleanup test data - useful in afterEach hooks
 */
export async function cleanupTestData(
  tables: { table: string; condition: string; params?: unknown[] }[],
): Promise<void> {
  for (const { table, condition, params = [] } of tables) {
    try {
      await deleteTestData(table, condition, params);
    } catch (error) {
      console.warn(`Cleanup warning for ${table}:`, error);
    }
  }
}
