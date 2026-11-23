import { rawSql } from "@/lib/db";
import { ApiUser, isAdmin } from "@/lib/api-auth";

/**
 * Checks if the given user has access to a specific warehouse.
 * Admins have access to all warehouses.
 * Standard users must have an entry in the WarehouseUsers table.
 * 
 * @param user The authenticated user
 * @param warehouseId The ID of the warehouse to check
 * @returns boolean indicating if the user has access
 */
export async function canAccessWarehouse(user: ApiUser, warehouseId: number | string): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user)) return true; // Admins have global access

  const parsedId = typeof warehouseId === "string" ? parseInt(warehouseId, 10) : warehouseId;
  
  if (isNaN(parsedId)) return false;

  const query = `
    SELECT 1 
    FROM dbo.WarehouseUsers 
    WHERE UserID = @param0 AND WarehouseID = @param1
  `;
  
  try {
    const result = await rawSql(query, [user.id, parsedId]);
    return result && result.length > 0;
  } catch (error) {
    console.error("Error checking warehouse permissions:", error);
    return false;
  }
}
