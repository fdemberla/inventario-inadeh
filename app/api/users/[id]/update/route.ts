import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

// Extract `id` from route params using the new Next.js route handlers style
export async function PUT(req: NextRequest) {
  // Authentication check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { message: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").at(-2);
    const body = await req.json();

    const {
      Username,
      Password,
      RoleID,
      FirstName,
      LastName,
      Phone,
      Email,
      IsActive,
      WarehouseIDs = [],
    } = body;

    let updateUserQuery = "";
    let params: unknown[] = [];

    if (Password && Password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(Password, 10);
      updateUserQuery = `
        UPDATE dbo.Users
        SET
          Username = @param0,
          PasswordHash = @param1,
          RoleID = @param2,
          FirstName = @param3,
          LastName = @param4,
          Phone = @param5,
          Email = @param6,
          IsActive = @param7
        WHERE UserID = @param8
      `;
      params = [
        Username,
        hashedPassword,
        RoleID,
        FirstName,
        LastName,
        Phone,
        Email,
        IsActive ?? true,
        id,
      ];
    } else {
      updateUserQuery = `
        UPDATE dbo.Users
        SET
          Username = @param0,
          RoleID = @param1,
          FirstName = @param2,
          LastName = @param3,
          Phone = @param4,
          Email = @param5,
          IsActive = @param6
        WHERE UserID = @param7
      `;
      params = [
        Username,
        RoleID,
        FirstName,
        LastName,
        Phone,
        Email,
        IsActive ?? true,
        id,
      ];
    }

    // Execute user update
    await sql(updateUserQuery, params);

    // Clear and insert new warehouse associations
    await sql(`DELETE FROM dbo.WarehouseUsers WHERE UserID = @param0`, [id]);

    for (const WarehouseID of WarehouseIDs) {
      await sql(
        `INSERT INTO dbo.WarehouseUsers (UserID, WarehouseID) VALUES (@param0, @param1)`,
        [id, WarehouseID],
      );
    }

    return NextResponse.json({
      message: "Usuario actualizado exitosamente.",
      UserID: id,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error al actualizar el usuario." },
      { status: 500 },
    );
  }
}
