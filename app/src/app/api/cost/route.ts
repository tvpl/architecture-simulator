import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildCostBreakdown } from "@/domain/services/cost";
import type { ArchitectureNode } from "@/domain/entities/node";

const bodySchema = z.object({
  nodes: z.array(z.record(z.string(), z.unknown())),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const nodes = parsed.data.nodes as unknown as ArchitectureNode[];
    const breakdown = buildCostBreakdown(nodes);
    const totalMonthlyCostUSD = breakdown.reduce((sum, item) => sum + item.monthlyCostUSD, 0);

    return NextResponse.json({ totalMonthlyCostUSD, breakdown });
  } catch (err) {
    console.error("[POST /api/cost]", err);
    return NextResponse.json(
      { error: "Cost calculation failed", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
