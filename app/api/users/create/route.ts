import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function POST(req: Request) {
  // Authentication check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { message: "No autorizado" },
      { status: 401 }
    );
  }

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

    // Validation
    if (!Username || Username.trim() === "") {
      return NextResponse.json(
        { message: "El nombre de usuario es requerido." },
        { status: 400 }
      );
    }
    if (!Password || Password.trim() === "") {
      return NextResponse.json(
        { message: "La contraseña es requerida." },
        { status: 400 }
      );
    }
    if (!FirstName || FirstName.trim() === "") {
      return NextResponse.json(
        { message: "El nombre es requerido." },
        { status: 400 }
      );
    }
    if (!LastName || LastName.trim() === "") {
      return NextResponse.json(
        { message: "El apellido es requerido." },
        { status: 400 }
      );
    }
    if (!Email || Email.trim() === "") {
      return NextResponse.json(
        { message: "El email es requerido." },
        { status: 400 }
      );
    }
    if (!RoleID) {
      return NextResponse.json(
        { message: "El rol es requerido." },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return NextResponse.json(
        { message: "El formato del email es inválido." },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingUser = await sql(
      `SELECT UserID FROM dbo.Users WHERE Email = @param0`,
      [Email]
    );
    if (existingUser.recordset.length > 0) {
      return NextResponse.json(
        { message: "Ya existe un usuario con este email." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert user
    const insertUserResult = await sql(
      `
      INSERT INTO dbo.Users
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
        INSERT INTO dbo.WarehouseUsers (UserID, WarehouseID)
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
