import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { sendTicketEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, deliveryDetails, paymentMethod, totalAmount, deliveryFee, paystackRef } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          deliveryFee,
          paymentMethod,
          status: paymentMethod === "TICKET" ? "TICKET_GENERATED" : "PENDING",
          deliveryAddress: deliveryDetails.address,
          // Store the pre-generated ref so the webhook can look it up
          paystackRef: paymentMethod === "ONLINE" && paystackRef ? paystackRef : null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      if (paymentMethod === "TICKET") {
        const ticketCode = `BM-${nanoid(5).toUpperCase()}`;
        const qrCodeBase64 = await QRCode.toDataURL(ticketCode, {
          width: 400,
          margin: 2,
          color: { dark: "#1e293b", light: "#ffffff" },
        });

        // 48 hours from now, explicitly set (schema default is fallback)
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const ticket = await tx.ticket.create({
          data: {
            orderId: order.id,
            ticketCode,
            qrCodeUrl: qrCodeBase64,
            status: "PENDING",
            expiresAt,
          },
        });

        try {
          await sendTicketEmail(session.user.email!, {
            ticketCode,
            orderId: order.id,
            qrCodeBase64,
            totalAmount,
            expiresAt: expiresAt.toISOString(),
            items: order.items.map((i: any) => ({
              name: i.product.name,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            })),
          });
        } catch (emailErr) {
          console.error("Ticket email failed:", emailErr);
        }

        return { order, ticket };
      }

      return { order };
    });

    return NextResponse.json({ orderId: result.order.id });
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
