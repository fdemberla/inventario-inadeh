import { NextRequest, NextResponse } from "next/server";
import { requireWarehouse } from "@/lib/authz";
import { ALLOWED_PERIODS, getWarehouseKpis } from "@/lib/reports/kpis";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const guard = await requireWarehouse(req, id);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 90);
  if (!(ALLOWED_PERIODS as readonly number[]).includes(days)) {
    return NextResponse.json(
      { message: `days debe ser uno de: ${ALLOWED_PERIODS.join(", ")}` },
      { status: 400 },
    );
  }

  const categoryParam = searchParams.get("category");
  let categoryId: number | null = null;
  if (categoryParam && categoryParam !== "todas") {
    if (!/^\d+$/.test(categoryParam)) {
      return NextResponse.json({ message: "Categoría inválida" }, { status: 400 });
    }
    categoryId = parseInt(categoryParam, 10);
  }

  try {
    const data = await getWarehouseKpis(parseInt(id, 10), days, categoryId);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error computing warehouse KPIs:", error);
    return NextResponse.json({ message: "Error al calcular los indicadores" }, { status: 500 });
  }
}
