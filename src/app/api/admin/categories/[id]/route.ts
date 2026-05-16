import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  parentId: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = categoryUpdateSchema.parse(body);

    const category = await prisma.$transaction(async (tx) => {
      const c = await tx.category.update({
        where: { id: params.id },
        data: validatedData,
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "UPDATE_CATEGORY",
        entityType: "CATEGORY",
        entityId: params.id,
        details: validatedData,
      });

      return c;
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update category:", error);
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

  try {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with assigned products" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.delete({
        where: { id: params.id },
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "DELETE_CATEGORY",
        entityType: "CATEGORY",
        entityId: params.id,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
