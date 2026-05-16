import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        orderId: params.orderId,
        order: { userId: session.user.id },
      },
      include: {
        order: {
          include: {
            items: {
              include: { product: { select: { name: true, images: true } } },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ticket fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
