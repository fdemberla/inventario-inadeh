import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getApiAuth, isAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ message: "No tienes permisos de administrador" }, { status: 403 });
    }

    const { categoryName, description, parentCategoryID } = await req.json();

    if (!categoryName) {
      return NextResponse.json(
        { message: "Category name is required." },
        { status: 400 },
      );
    }

    await sql(
      `INSERT INTO Categories (CategoryName, ParentCategoryID, Description)
       VALUES (@param0, @param1, @param2)`,
      [categoryName, parentCategoryID ?? null, description ?? null],
    );

    return NextResponse.json({ message: "Category created successfully." });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Error creating category." },
      { status: 500 },
    );
  }
}
