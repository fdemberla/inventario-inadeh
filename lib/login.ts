// lib/login.ts
import { poolPromise } from "@/lib/db";
import * as sql from "mssql"; // Use mssql for SQL types
import bcrypt from "bcryptjs";

// Login function specifically for user authentication
export async function loginUser(username: string, password: string) {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("Username", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE Username = @Username");

    const user = result.recordset[0];

    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, user }; // Return user if login is successful
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Database error during login");
  }
}
