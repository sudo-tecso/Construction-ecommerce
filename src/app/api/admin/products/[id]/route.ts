import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const productUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  categoryId: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().min(1).optional(),
  images: z.array(z.string()).max(5).optional(),
  isActive: z.boolean().optional(),
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
    const validatedData = productUpdateSchema.parse(body);

    if (validatedData.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          sku: validatedData.sku,
          NOT: { id: params.id }
        },
      });

      if (existingProduct) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: params.id },
        data: validatedData,
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: params.id,
        details: validatedData,
      });

      return p;
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const soft = searchParams.get("soft") !== "false"; // Default to soft delete

  try {
    if (soft) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: params.id },
          data: { isActive: false },
        });

        await createAuditLog({
          adminId: session.user.id!,
          action: "SOFT_DELETE_PRODUCT",
          entityType: "PRODUCT",
          entityId: params.id,
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.product.delete({
          where: { id: params.id },
        });

        await createAuditLog({
          adminId: session.user.id!,
          action: "HARD_DELETE_PRODUCT",
          entityType: "PRODUCT",
          entityId: params.id,
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
