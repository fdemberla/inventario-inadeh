import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert user
    const insertUserResult = await sql(
      `
      INSERT INTO inventario.dbo.Users
        (Username, PasswordHash, RoleID, FirstName, LastName, Phone, Email, IsActive)
      OUTPUT INSERTED.UserID
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)
      `,
      [
        Username,
        hashedPassword,
        RoleID,
        FirstName,
        LastName,
        Phone,
        Email,
        IsActive ?? true,
      ],
    );

    const newUserId = insertUserResult.recordset[0].UserID;

    // Insert related warehouses if provided
    for (const WarehouseID of WarehouseIDs) {
      await sql(
        `
        INSERT INTO inventario.dbo.WarehouseUsers (UserID, WarehouseID)
        VALUES (@param0, @param1)
        `,
        [newUserId, WarehouseID],
      );
    }

    return NextResponse.json({
      message: "Usuario creado exitosamente.",
      UserID: newUserId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error al crear el usuario." },
      { status: 500 },
    );
  }
}
