import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    redirect("/login");
  }

  const [productCount, orderCount, userCount, lowStockCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { stock: { lt: 10 } } })
  ]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Admin <span className="text-primary">Overview</span></h1>
          <p className="text-sm font-medium text-slate-500">Welcome back. Here's what's happening across the platform.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Products", value: productCount, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Orders", value: orderCount, icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Customers", value: userCount, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <Card key={i} className="p-8 border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow duration-300 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-10 border border-slate-200 shadow-sm space-y-8 overflow-hidden relative group rounded-2xl bg-slate-900 text-white hover:shadow-xl transition-all">
           <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Inventory Management</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Update product details, adjust stock levels, or create new material categories.
              </p>
              <Button asChild className="font-black uppercase tracking-tighter h-14 px-8 bg-primary text-background-dark hover:brightness-110 border-0">
                <Link href="/admin/inventory/products">Manage Inventory <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
           </div>
           <Package className="absolute -right-8 -bottom-8 w-48 h-48 text-primary opacity-20 group-hover:rotate-12 transition-transform duration-700" />
        </Card>

        <Card className="p-10 border border-slate-200 shadow-sm space-y-8 overflow-hidden relative group rounded-2xl bg-white hover:shadow-xl transition-all">
           <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Orders & Logistics</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track incoming orders, verify pickup tickets, and manage outgoing deliveries.
              </p>
              <Button asChild variant="outline" className="font-black uppercase tracking-tighter h-14 px-8 border-2 border-slate-200 hover:border-primary hover:text-primary hover:bg-transparent">
                <Link href="/admin/orders">View All Orders <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
           </div>
           <ShoppingBag className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100 group-hover:-rotate-12 transition-transform duration-700" />
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
