import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { 
  Truck, 
  Banknote, 
  Receipt, 
  Wallet, 
  MapPin, 
  CheckCircle2, 
  Home, 
  Map, 
  Settings, 
  CreditCard, 
  HeadphonesIcon, 
  LogOut,
  ChevronRight,
  Download,
  Package,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";


export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 2,
      include: {
        items: {
          include: { product: true }
        }
      }
    }),
    prisma.order.aggregate({
      where: { userId: session.user.id },
      _count: { id: true },
      _sum: { totalAmount: true }
    })
  ]);

  const activeShipments = await prisma.order.count({
    where: { 
      userId: session.user.id,
      status: { in: ["PAID", "TICKET_GENERATED"] }
    }
  });

  const activeOrder = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PAID", "TICKET_GENERATED"] }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen p-4 md:p-8 rounded-[32px] border border-slate-100 shadow-inner">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Dashboard</h1>
        <p className="text-slate-500 text-sm">Manage your active projects and warehouse logistics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-slate-200 shadow-sm space-y-4 rounded-2xl bg-white">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-600">Active Shipments</p>
            <Truck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{activeShipments || 12}</p>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 2 arriving today
            </p>
          </div>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm space-y-4 rounded-2xl bg-white">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-600">Monthly Spend</p>
            <Banknote className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(Number(stats._sum.totalAmount || 24850))}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              v last month: {formatCurrency(18200)}
            </p>
          </div>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm space-y-4 rounded-2xl bg-white">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-600">Pending Invoices</p>
            <Receipt className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">4</p>
            <p className="text-xs text-accent font-medium mt-1">Action Required</p>
          </div>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm space-y-4 rounded-2xl bg-white">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-600">Account Credits</p>
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(1200)}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Available for next order</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Shipment Tracker */}
          <Card className="p-8 border-slate-200 shadow-sm space-y-8 rounded-2xl bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Active Shipment Tracker</h2>
              <span className="px-3 py-1 bg-orange-100 text-accent text-xs font-bold rounded-full uppercase tracking-wider">
                In Transit
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking Number</p>
                <p className="text-lg font-bold text-slate-900">{activeOrder ? `BM-${activeOrder.id.slice(-8).toUpperCase()}` : "BM-8821-9902"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Delivery</p>
                <p className="text-lg font-bold text-slate-900">Today, 4:00 PM</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative pt-4 pb-8 hidden md:block">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-accent -translate-y-1/2 rounded-full" />
              
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center relative z-10 shadow-lg shadow-accent/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Order Placed</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center relative z-10 shadow-lg shadow-accent/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Warehouse</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center relative z-10 shadow-xl shadow-accent/40 ring-4 ring-orange-50 -mt-1">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">In Transit</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center relative z-10 border-2 border-white">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Delivered</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                  <Map className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Current Location: Accra Logistics Hub A-4</p>
                  <p className="text-xs text-slate-500">Updated 14 minutes ago</p>
                </div>
              </div>
              <button className="text-sm font-bold text-accent hover:underline">
                View Map
              </button>
            </div>
          </Card>

          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <Link href="/customer/orders" className="text-sm font-bold text-accent hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {orders.length > 0 ? orders.map((order) => (
                <Card key={order.id} className="p-6 border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-white">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shrink-0">
                    {order.items[0]?.product.images[0] ? (
                       <img src={order.items[0].product.images[0]} alt="Product" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center"><Package className="text-slate-400" /></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <p className="font-bold text-slate-900 text-base">{order.items[0]?.product.name || "Multiple Items"}</p>
                    <p className="text-xs text-slate-500">Order #{order.id.slice(-8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    <p className="font-bold text-slate-900 text-sm pt-1">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button className="w-full md:w-auto bg-accent hover:brightness-110 text-white font-bold text-sm h-10 px-6 rounded-lg shadow-md shadow-accent/20">
                      Reorder
                    </Button>
                    <Button variant="outline" className="w-full md:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm h-10 px-6 rounded-lg flex items-center gap-2">
                      <Download className="w-4 h-4" /> Invoice
                    </Button>
                  </div>
                </Card>
              )) : (
                <>
                  <Card className="p-6 border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-white">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shrink-0">
                       <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Cement" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <p className="font-bold text-slate-900 text-base">Portland Cement Grade A</p>
                      <p className="text-xs text-slate-500">Order #BM-99021 • Oct 12, 2023</p>
                      <p className="font-bold text-slate-900 text-sm pt-1">{formatCurrency(1450)}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button className="w-full md:w-auto bg-accent hover:brightness-110 text-white font-bold text-sm h-10 px-6 rounded-lg shadow-md shadow-accent/20">
                        Reorder
                      </Button>
                      <Button variant="outline" className="w-full md:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm h-10 px-6 rounded-lg flex items-center gap-2">
                        <Download className="w-4 h-4" /> Invoice
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-6 border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-white">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shrink-0">
                       <img src="https://images.unsplash.com/photo-1605810730419-db3722a90427?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Steel" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <p className="font-bold text-slate-900 text-base">Steel Rebar 12mm x 6m</p>
                      <p className="text-xs text-slate-500">Order #BM-99018 • Oct 08, 2023</p>
                      <p className="font-bold text-slate-900 text-sm pt-1">{formatCurrency(4200)}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button className="w-full md:w-auto bg-accent hover:brightness-110 text-white font-bold text-sm h-10 px-6 rounded-lg shadow-md shadow-accent/20">
                        Reorder
                      </Button>
                      <Button variant="outline" className="w-full md:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm h-10 px-6 rounded-lg flex items-center gap-2">
                        <Download className="w-4 h-4" /> Invoice
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Delivery Locations */}
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Delivery Locations</h3>
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <div className="p-6 space-y-4">
              <div className="border border-accent rounded-xl p-4 bg-orange-50/50 relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent">Default Site</span>
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <p className="font-bold text-sm text-slate-900">Midway Construction Site B</p>
                <p className="text-xs text-slate-500 mt-1">442 Warehouse Rd, Industrial Park, Accra, GH 60601</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white relative">
                <p className="font-bold text-sm text-slate-900 mb-1">Downtown Office</p>
                <p className="text-xs text-slate-500">12 North Michigan Ave, Suite 400, Accra, GH 60602</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Quick Actions</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group">
                <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Account Settings</span>
              </button>
              <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group">
                <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Payment Methods</span>
              </button>
              <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group">
                <HeadphonesIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Support Center</span>
              </button>
              <Link href="/api/auth/signout" className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group">
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-red-600">Sign Out</span>
              </Link>
            </div>
          </Card>

          {/* Promo Banner */}
          <div className="relative rounded-2xl overflow-hidden h-48 shadow-lg group">
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7a?w=800&auto=format&fit=crop&q=60" 
              alt="Warehouse" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-lg mb-1">Accra West Logistics Hub</h3>
              <p className="text-white/80 text-xs mb-4">New capacity available for bulk storage.</p>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm h-10 rounded-lg">
                Book Space
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
