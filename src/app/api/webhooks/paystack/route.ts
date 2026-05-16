import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = req.headers.get("x-paystack-signature");

  const body = await req.text();
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;

    // Look up by paystackRef (stored at order creation)
    const order = await prisma.order.findFirst({
      where: { paystackRef: reference },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (order && order.status !== "PAID") {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      // Send confirmation email as fallback (in case inline callback failed)
      try {
        await sendOrderConfirmationEmail(order.user.email!, {
          id: order.id,
          totalAmount: Number(order.totalAmount),
          items: order.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
        });
      } catch (e) {
        console.error("Webhook confirmation email failed:", e);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
