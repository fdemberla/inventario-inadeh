import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 },
      );
    }

    const query = `SELECT * FROM Categories WHERE CategoryID = @param0`;
    const result = await rawSql(query, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ category: result[0] });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
