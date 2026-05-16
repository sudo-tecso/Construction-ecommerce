import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const stockSchema = z.object({
  stock: z.number().int().min(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stock } = stockSchema.parse(body);

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: params.id },
        data: { stock },
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "UPDATE_STOCK",
        entityType: "PRODUCT",
        entityId: params.id,
        details: { newStock: stock },
      });

      return p;
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update stock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
