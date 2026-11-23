import { getNavSections, isPathActive, isSectionActive } from "@/lib/navigation";

const ADMIN = 1;
const GENERAL = 2;

const allPaths = (role: number) =>
  getNavSections(role).flatMap((s) => [s.path, ...s.links.map((l) => l.path)]);

describe("getNavSections", () => {
  it("gives admins every section, including Reportes", () => {
    const keys = getNavSections(ADMIN).map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "inicio", "inventario", "productos", "reportes",
        "categorias", "unidades", "proveedores", "depositos", "usuarios",
      ]),
    );
  });

  it("never shows admin-only pages to GENERAL users", () => {
    const paths = allPaths(GENERAL);
    for (const p of [
      "/dashboard/users", "/dashboard/warehouse", "/dashboard/categories",
      "/dashboard/units", "/dashboard/suppliers", "/dashboard/products/create",
    ]) {
      expect(paths).not.toContain(p);
    }
    expect(paths).toContain("/dashboard/reports");
  });

  it("puts at most 4 sections in the mobile bar", () => {
    for (const role of [ADMIN, GENERAL]) {
      expect(getNavSections(role).filter((s) => s.primary).length).toBeLessThanOrEqual(4);
    }
  });

  it("treats an unknown role as non-admin", () => {
    expect(allPaths(undefined as unknown as number)).not.toContain("/dashboard/users");
  });
});

describe("active route matching", () => {
  it("only matches /dashboard exactly", () => {
    expect(isPathActive("/dashboard", "/dashboard")).toBe(true);
    expect(isPathActive("/dashboard/products", "/dashboard")).toBe(false);
  });

  it("matches sub-pages but not the create page for the list link", () => {
    expect(isPathActive("/dashboard/products/edit/4", "/dashboard/products")).toBe(true);
    expect(isPathActive("/dashboard/products/create", "/dashboard/products")).toBe(false);
    expect(isPathActive("/dashboard/productsX", "/dashboard/products")).toBe(false);
  });

  it("marks the section of any nested page", () => {
    const units = getNavSections(ADMIN).find((s) => s.key === "unidades")!;
    expect(isSectionActive("/dashboard/units/3/edit", units)).toBe(true);
    expect(isSectionActive("/dashboard/units/create", units)).toBe(true);
    expect(isSectionActive("/dashboard/users", units)).toBe(false);
  });
});
