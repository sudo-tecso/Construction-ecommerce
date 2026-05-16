import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0),
  sku: z.string().min(1),
  images: z.array(z.string()).max(5),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          Category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    // Check SKU uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingProduct) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          ...validatedData,
          category: "", // Legacy field in schema, but CategoryId is relation
        },
      });

      await createAuditLog({
        adminId: session.user.id!,
        action: "CREATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: p.id,
        details: validatedData,
      });

      return p;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
