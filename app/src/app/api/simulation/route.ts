import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSimulation } from "@/domain/services/simulation-engine";
import type { ArchitectureNode } from "@/domain/entities/node";
import type { ConnectionEdge } from "@/domain/entities/edge";

const bodySchema = z.object({
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
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
    const edges = parsed.data.edges as unknown as ConnectionEdge[];

    const result = runSimulation(nodes, edges);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/simulation]", err);
    return NextResponse.json(
      { error: "Simulation failed", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
