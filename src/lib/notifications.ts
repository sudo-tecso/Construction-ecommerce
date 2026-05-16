import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ORDERS = "Ekuase General Supplies <orders@ekuasegs.com>";
const FROM_TICKETS = "Ekuase General Supplies <tickets@ekuasegs.com>";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderData {
  id: string;
  totalAmount: number;
  items?: OrderItem[];
}

interface TicketData {
  ticketCode: string;
  orderId: string;
  qrCodeBase64?: string;
  totalAmount: number;
  expiresAt: string;
  items?: OrderItem[];
}

function itemsTable(items: OrderItem[]): string {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">GH₵ ${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");
}

export const sendOrderConfirmationEmail = async (
  email: string,
  orderData: OrderData
) => {
  const itemsHtml =
    orderData.items?.length
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#888;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#888;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsTable(orderData.items)}</tbody>
        </table>`
      : "";

  try {
    await resend.emails.send({
      from: FROM_ORDERS,
      to: email,
      subject: `✅ Order Confirmed — #${orderData.id.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <div style="background:#1e293b;padding:32px 40px;">
            <h1 style="color:#f59e0b;margin:0;font-size:28px;letter-spacing:-1px;">Ekuase General Supplies</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Construction Materials & Supplies</p>
          </div>
          <div style="padding:32px 40px;">
            <h2 style="color:#1e293b;margin:0 0 8px;">Payment Confirmed!</h2>
            <p style="color:#64748b;margin:0 0 24px;">Thank you for your purchase. Your order is being processed.</p>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Order Reference</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#1e293b;font-family:monospace;">#${orderData.id.slice(-8).toUpperCase()}</p>
            </div>
            ${itemsHtml}
            <div style="border-top:2px solid #f1f5f9;padding-top:16px;text-align:right;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Total Paid</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#f59e0b;">GH₵ ${orderData.totalAmount.toFixed(2)}</p>
            </div>
            <div style="margin-top:32px;padding:20px;background:#ecfdf5;border-radius:8px;border-left:4px solid #10b981;">
              <p style="margin:0;font-size:14px;color:#065f46;font-weight:600;">What happens next?</p>
              <p style="margin:8px 0 0;font-size:13px;color:#047857;">Our warehouse team will prepare your order. You'll receive an SMS when your items are dispatched (ETA: 24-48 hours).</p>
            </div>
          </div>
          <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Ekuase General Supplies. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Order confirmation email failed:", error);
  }
};

export const sendTicketEmail = async (email: string, ticketData: TicketData) => {
  const itemsHtml =
    ticketData.items?.length
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#888;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#888;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsTable(ticketData.items)}</tbody>
        </table>`
      : "";

  const expiryStr = ticketData.expiresAt
    ? new Date(ticketData.expiresAt).toLocaleString("en-GH", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "48 hours from now";

  const qrImgHtml = ticketData.qrCodeBase64
    ? `<img src="${ticketData.qrCodeBase64}" alt="QR Code" style="width:200px;height:200px;display:block;margin:16px auto;" />`
    : "";

  try {
    await resend.emails.send({
      from: FROM_TICKETS,
      to: email,
      subject: `🎫 Your Store Ticket is Ready — ${ticketData.ticketCode}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <div style="background:#1e293b;padding:32px 40px;">
            <h1 style="color:#f59e0b;margin:0;font-size:28px;letter-spacing:-1px;">Ekuase General Supplies</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Construction Materials & Supplies</p>
          </div>
          <div style="padding:32px 40px;text-align:center;">
            <h2 style="color:#1e293b;margin:0 0 8px;">Your Ticket is Ready!</h2>
            <p style="color:#64748b;margin:0 0 24px;">Present this QR code at our store to pay and collect your items.</p>
            <div style="background:#f8fafc;border-radius:12px;padding:24px;display:inline-block;margin:0 auto;">
              ${qrImgHtml}
              <p style="margin:8px 0 0;font-size:32px;font-weight:900;font-family:monospace;color:#1e293b;letter-spacing:4px;">${ticketData.ticketCode}</p>
            </div>
            <div style="margin:24px 0;padding:16px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa;">
              <p style="margin:0;font-size:13px;color:#c2410c;font-weight:600;">⏰ Ticket expires: ${expiryStr}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#9a3412;">After expiry, the ticket is invalidated and items may be restocked.</p>
            </div>
          </div>
          <div style="padding:0 40px 32px;text-align:left;">
            <h3 style="color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Order Summary</h3>
            ${itemsHtml}
            <div style="border-top:2px solid #f1f5f9;padding-top:16px;text-align:right;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Total Due at Store</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#f59e0b;">GH₵ ${Number(ticketData.totalAmount).toFixed(2)}</p>
            </div>
          </div>
          <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Ekuase General Supplies. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Ticket email failed:", error);
  }
};
