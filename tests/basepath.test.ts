import { getBasePath, stripBasePath, withBasePath } from "@/lib/utils";

describe("basePath helpers", () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    if (originalBasePath === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    }
  });

  it("returns empty basePath when env is unset", () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;

    expect(getBasePath()).toBe("");
    expect(withBasePath("/dashboard")).toBe("/dashboard");
    expect(stripBasePath("/dashboard")).toBe("/dashboard");
  });

  it("normalizes and applies basePath", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "inventario/";

    expect(getBasePath()).toBe("/inventario");
    expect(withBasePath("/dashboard")).toBe("/inventario/dashboard");
    expect(withBasePath("dashboard")).toBe("/inventario/dashboard");
    expect(withBasePath("/inventario/dashboard")).toBe("/inventario/dashboard");
  });

  it("strips basePath from paths", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/inventario";

    expect(stripBasePath("/inventario/dashboard")).toBe("/dashboard");
    expect(stripBasePath("/inventario")).toBe("/");
    expect(stripBasePath("/dashboard")).toBe("/dashboard");
  });
});
