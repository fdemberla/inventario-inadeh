/**
 * lib/db.ts must open ONE pool per process, even when many requests ask for
 * it at the same time, and must retry after a failed connection.
 */
const connect = jest.fn();
const created: number[] = [];

jest.mock("mssql", () => {
  class ConnectionPool {
    constructor() {
      created.push(1);
    }
    connect = connect;
    request() {
      return { input: jest.fn(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
    }
  }
  return { ConnectionPool, Transaction: jest.fn(), Request: jest.fn() };
});

describe("getPool", () => {
  beforeEach(() => {
    jest.resetModules();
    created.length = 0;
    connect.mockReset();
    delete (globalThis as { __mssqlPoolPromise?: unknown }).__mssqlPoolPromise;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shares a single connection between concurrent first requests", async () => {
    connect.mockImplementation(() => new Promise((r) => setTimeout(r, 20)));
    const { getPool } = await import("@/lib/db");
    const pools = await Promise.all(Array.from({ length: 20 }, () => getPool()));
    expect(created).toHaveLength(1);
    expect(new Set(pools).size).toBe(1);
  });

  it("does not connect just because the module was imported", async () => {
    await import("@/lib/db");
    await new Promise((r) => setTimeout(r, 10));
    expect(created).toHaveLength(0);
  });

  it("reuses the pool across module reloads (dev HMR)", async () => {
    connect.mockResolvedValue(undefined);
    const first = await (await import("@/lib/db")).getPool();
    jest.resetModules(); // simulates a recompile: fresh module, same process
    const second = await (await import("@/lib/db")).getPool();
    expect(second).toBe(first);
    expect(created).toHaveLength(1);
  });

  it("retries on the next call after the connection fails", async () => {
    jest.useFakeTimers();
    connect.mockRejectedValue(new Error("down"));
    const { getPool } = await import("@/lib/db");
    const failing = getPool();
    const assertion = expect(failing).rejects.toThrow("down");
    await jest.runAllTimersAsync(); // skip the retry back-off
    await assertion;
    jest.useRealTimers();

    connect.mockResolvedValue(undefined);
    await expect(getPool()).resolves.toBeDefined();
  });
});
