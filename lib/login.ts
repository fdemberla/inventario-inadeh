// lib/login.ts
import { getPool } from "@/lib/db";
import bcrypt from "bcryptjs";

// Hash of a random string: compared against when the user doesn't exist so
// that response time doesn't reveal which usernames are valid.
const DUMMY_HASH =
  "$2b$10$FtjaUxSqtjHGmDlBuGnaYupX4SWBlle7uDH0HkljIgKgJeKv8Hgia";

// Login function specifically for user authentication
export async function loginUser(username: string, password: string) {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      // No explicit type: mssql infers NVarChar for strings. Passing a type
      // object (sql.NVarChar) breaks when the shared pool was created by an
      // earlier instance of the mssql module (dev recompiles), since types
      // are compared by identity.
      .input("Username", username)
      .query(
        `SELECT UserID, Username, PasswordHash, RoleID, FirstName, LastName, Email, IsActive
         FROM Users WHERE Username = @Username`,
      );

    const user = result.recordset[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user?.PasswordHash ?? DUMMY_HASH,
    );

    // Same message for unknown user, wrong password and inactive account
    if (!user || !isPasswordValid || !user.IsActive) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, user }; // Return user if login is successful
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Database error during login");
  }
}
