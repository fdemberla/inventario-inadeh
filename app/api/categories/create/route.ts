import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
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
