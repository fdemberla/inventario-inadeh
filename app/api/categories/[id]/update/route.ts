import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Accessing id directly from params
    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 },
      );
    }

    // Extracting data from the request body
    const { categoryName, description, parentCategoryID } = await req.json();

    if (!categoryName) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 },
      );
    }

    // SQL Update Query
    const updateQuery = `
      UPDATE Categories
      SET CategoryName = @param0,
          Description = @param1,
          ParentCategoryID = @param2,
          ModifiedDate = SYSUTCDATETIME()
      WHERE CategoryID = @param3
    `;

    // Array of parameters to pass to SQL query
    const paramsArray = [
      categoryName,
      description ?? null,
      parentCategoryID ?? null,
      categoryId,
    ];

    // Executing the SQL query
    await sql(updateQuery, paramsArray);

    return NextResponse.json(
      { message: "Category updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
