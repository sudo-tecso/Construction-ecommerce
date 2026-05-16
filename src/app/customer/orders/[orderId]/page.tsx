import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Ticket, 
  Truck, 
  Package, 
  Clock,
  Printer,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { OrderStepper } from "@/components/shared/OrderStepper";
import Image from "next/image";

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: { product: true }
      },
      ticket: true,
      delivery: {
        include: { driver: true }
      }
    }
  });

  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link href="/customer/orders" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-accent flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-secondary">Order Details</h1>
            <span className="text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-muted rounded-full">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground italic">Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold uppercase tracking-widest text-[10px] h-12">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          <Button className="font-black uppercase tracking-tighter h-12 shadow-xl shadow-accent/20">
            Reorder All Items
          </Button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-[40px] border p-10 shadow-xl">
        <OrderStepper status={order.status} paymentMethod={order.paymentMethod} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Items & Info */}
        <div className="lg:col-span-2 space-y-12">
          {/* Order Items */}
          <div className="space-y-6">
            <h3 className="text-xl font-heading font-black uppercase tracking-tighter text-secondary flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" /> Purchased Materials
            </h3>
            <div className="bg-white rounded-[32px] border overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Qty</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Unit Price</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id} className="group hover:bg-muted/5 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border bg-muted">
                            <Image src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-secondary text-sm">{item.product.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SKU: {item.product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="font-black text-secondary">x{item.quantity}</span>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-muted-foreground">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-secondary">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-8 border shadow-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Delivery Address</h4>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-secondary leading-relaxed">{order.deliveryAddress}</p>
                </div>
             </Card>
             <Card className="p-8 border shadow-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Delivery Status</h4>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Truck className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary">{order.delivery?.status || "Processing"}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {order.delivery?.estimatedDate ? `ETA: ${new Date(order.delivery.estimatedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Awaiting Schedule"}
                    </p>
                  </div>
                </div>
             </Card>
          </div>
        </div>

        {/* Sidebar: Payment & Ticket */}
        <div className="space-y-6">
          <Card className="p-8 border shadow-2xl space-y-8 sticky top-32">
            <div>
              <h3 className="text-xl font-heading font-black uppercase tracking-tighter text-secondary mb-6">Payment Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Method</span>
                  <div className="flex items-center gap-2 font-black text-secondary uppercase tracking-widest text-[10px]">
                    {order.paymentMethod === "ONLINE" ? <CreditCard className="w-3 h-3 text-accent" /> : <Ticket className="w-3 h-3 text-accent" />}
                    {order.paymentMethod}
                  </div>
                </div>
                {order.paystackRef && (
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Reference</span>
                    <span className="font-mono text-[9px] font-bold text-muted-foreground">{order.paystackRef}</span>
                  </div>
                )}
                <div className="h-px bg-muted" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-secondary font-black uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="font-bold text-secondary">{formatCurrency(Number(order.totalAmount) - Number(order.deliveryFee))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-black uppercase tracking-widest text-[10px]">Delivery Fee</span>
                  <span className="font-bold text-secondary">{formatCurrency(Number(order.deliveryFee))}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-secondary font-black uppercase tracking-widest text-xs">Total Amount</span>
                  <span className="text-2xl font-heading font-black text-accent">{formatCurrency(Number(order.totalAmount))}</span>
                </div>
              </div>
            </div>

            {order.ticket && (
               <div className="bg-muted/30 p-6 rounded-3xl border-2 border-dashed border-accent flex flex-col items-center gap-4 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-accent">Pickup Ticket</p>
                 <div className="w-24 h-24 bg-white p-2 rounded-xl border-2 border-muted">
                    <img src={order.ticket.qrCodeUrl || ""} alt="QR Code" className="w-full h-full object-contain" />
                 </div>
                 <p className="text-xl font-heading font-black tracking-widest text-secondary">{order.ticket.ticketCode}</p>
                 <Button asChild variant="secondary" size="sm" className="w-full font-black uppercase tracking-tighter text-[10px]">
                   <Link href={`/customer/orders/${order.id}/ticket`}>View Full Ticket</Link>
                 </Button>
               </div>
            )}

            <div className="p-4 bg-muted/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                Need help with this order? Contact our support line or visit the nearest warehouse.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
