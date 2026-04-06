import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCloudFormationTemplate } from "@/domain/services/cloudformation";
import type { ArchitectureNode } from "@/domain/entities/node";
import type { ConnectionEdge } from "@/domain/entities/edge";

const bodySchema = z.object({
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
  projectName: z.string().default("AWS Architecture"),
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
    const { projectName } = parsed.data;

    const template = generateCloudFormationTemplate(nodes, edges, projectName);

    return NextResponse.json({ template });
  } catch (err) {
    console.error("[POST /api/export/cloudformation]", err);
    return NextResponse.json(
      {
        error: "CloudFormation generation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
