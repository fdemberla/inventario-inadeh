import { ConnectionPool } from "mssql";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "mssql",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true, // for local dev
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: ConnectionPool | null = null;

/**
 * Attempts to connect to SQL Server with retries.
 * @param maxRetries Maximum number of retry attempts (default: 5)
 * @param retryDelayMs Initial delay between retries in ms (default: 2000)
 */
async function connectWithRetry(
  maxRetries = 5,
  retryDelayMs = 2000,
): Promise<ConnectionPool> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const mssql = await import("mssql");
      const newPool = new mssql.ConnectionPool(config);
      await newPool.connect();
      console.log("✅ Successfully connected to SQL Server!");
      return newPool;
    } catch (err) {
      lastError = err;
      attempt++;
      console.error(
        `❌ Connection attempt ${attempt} failed. Retrying in ${retryDelayMs / 1000}s...`,
      );
      console.error("Error details:", err.message);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        retryDelayMs *= 2; // Exponential backoff (2s, 4s, 8s, ...)
      }
    }
  }

  console.error("🔥 All connection attempts failed. Last error:", lastError);
  throw lastError; // Re-throw the last error
}

export async function getPool() {
  if (!pool) {
    pool = await connectWithRetry(); // Uses default: 5 retries, starting at 2s delay
  }
  return pool;
}

// SQL helper function
export async function sql(query: string, params = []) {
  const pool = await getPool();
  const request = pool.request();

  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });

  return request.query(query);
}

// lib/db.ts
export async function rawSql(query: string, params: unknown[]) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters to the request
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Executing query:", query);
      console.log("With parameters:", params);
      console.log(
        "Parameter types:",
        params.map((p) => typeof p),
      );
    }

    const result = await request.query(query);

    // Optional: Log result in development
    if (process.env.NODE_ENV === "development") {
      console.log("Query result:", {
        rowsAffected: result.rowsAffected,
        recordset: result.recordset ? result.recordset.slice(0, 3) : null, // Show first 3 rows
      });
    }

    return result.recordset;
  } catch (err) {
    console.error("Error executing raw SQL:", err);
    throw new Error(`Database query failed: ${err.message} - Query: ${query}`);
  }
}

export async function withTransaction(
  callback: (transaction) => Promise<unknown>,
) {
  const pool = await poolPromise;
  const transaction = new (await import("mssql")).Transaction(pool);
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function executeInTransaction(
  queries: { query: string; params: [] }[],
) {
  const pool = await getPool();
  const transaction = new Transaction(pool);

  try {
    await transaction.begin();

    for (const { query, params } of queries) {
      const request = new SqlRequest(transaction);
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      await request.query(query);
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Adding poolPromise function to return a pool as a Promise
export const poolPromise = getPool();
