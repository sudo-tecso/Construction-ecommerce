import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        },
        parent: true
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    const category = await prisma.$transaction(async (tx) => {
      const c = await tx.category.create({
        data: validatedData,
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "CREATE_CATEGORY",
        entityType: "CATEGORY",
        entityId: c.id,
        details: validatedData,
      });

      return c;
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
