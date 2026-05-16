import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const statusFilter = searchParams.status;
  
  const orders = await prisma.order.findMany({
    where: { 
      userId: session.user.id,
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {})
    },
    include: {
      _count: { select: { items: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  const tabs = ["ALL", "PENDING", "PAID", "DELIVERED", "TICKET_GENERATED", "CANCELLED"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-heading font-black uppercase tracking-tighter text-secondary">My Orders</h1>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white px-4 py-2 rounded-full border">
          <ShoppingBag className="w-4 h-4 text-accent" />
          <span>Total: {orders.length} Orders</span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/customer/orders${tab === "ALL" ? "" : `?status=${tab}`}`}
            className={cn(
              "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
              (statusFilter === tab || (!statusFilter && tab === "ALL"))
                ? "bg-secondary border-secondary text-white shadow-lg"
                : "bg-white border-muted text-muted-foreground hover:border-accent hover:text-accent"
            )}
          >
            {tab.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border shadow-xl flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-black uppercase tracking-tighter text-secondary">No Orders Found</h3>
              <p className="text-muted-foreground font-medium italic">You haven't placed any orders in this category yet.</p>
            </div>
            <Button asChild className="font-black uppercase tracking-tighter h-14 px-10">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          orders.map((order) => (
            <Link 
              key={order.id} 
              href={`/customer/orders/${order.id}`}
              className="block group"
            >
              <div className="bg-white rounded-3xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-2xl hover:border-accent hover:-translate-y-1">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-secondary font-black group-hover:bg-accent group-hover:text-white transition-colors">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</p>
                    <p className="font-black text-secondary uppercase tracking-tighter">#{order.id.slice(-8)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-8 md:gap-12">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                    <p className="text-sm font-bold text-secondary">{new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items</p>
                    <p className="text-sm font-bold text-secondary">{order._count.items} Products</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method</p>
                    <p className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-muted rounded-md text-secondary">
                      {order.paymentMethod}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</p>
                    <p className="text-sm font-black text-accent">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-muted">
                   <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2",
                        order.status === "PAID" ? "border-green-500 bg-green-50 text-green-700" :
                        order.status === "TICKET_GENERATED" ? "border-accent bg-accent/5 text-accent" :
                        "border-muted bg-muted/50 text-muted-foreground"
                      )}>
                        {order.status.replace("_", " ")}
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center text-muted-foreground group-hover:border-accent group-hover:text-accent transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
