"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  AlertTriangle, 
  ShoppingBag, 
  Ticket, 
  Truck, 
  Users, 
  Briefcase, 
  UserSquare2, 
  FileBarChart,
  LogOut,
  ChevronRight,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Logo } from "@/components/shared/Logo";

const SECTIONS = [
  {
    title: "Inventory",
    items: [
      { name: "Products", href: "/admin/inventory/products", icon: Package },
      { name: "Categories", href: "/admin/inventory/categories", icon: Layers },
      { name: "Low Stock Alerts", href: "/admin/inventory/low-stock", icon: AlertTriangle },
    ]
  },
  {
    title: "Orders",
    items: [
      { name: "All Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Ticket Verification", href: "/admin/orders/verify", icon: Ticket },
      { name: "Outgoing Deliveries", href: "/admin/orders/deliveries", icon: Truck },
    ]
  },
  {
    title: "Workforce",
    items: [
      { name: "Employees", href: "/admin/workforce/employees", icon: Users },
      { name: "Payroll", href: "/admin/workforce/payroll", icon: Briefcase },
      { name: "Service Providers", href: "/admin/workforce/providers", icon: UserSquare2 },
    ]
  },
  {
    title: "Reports",
    items: [
      { name: "Sales Reports", href: "/admin/reports/sales", icon: FileBarChart },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background-light flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-8 border-b border-slate-200">
          <Link href="/admin/dashboard" className="flex flex-col items-center group">
            <Logo size="md" />
            <div className="mt-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8 no-scrollbar">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 relative group",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-500")} />
                      <span className="text-xs font-bold">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-black rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-l-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-black text-white">
              {session?.user?.name?.includes("BuildMart") ? "E" : (session?.user?.name?.[0] || "A")}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate">{session?.user?.name?.replace("BuildMart", "EGS")}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{session?.user?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-72 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 px-12 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
             <LayoutDashboard className="w-4 h-4" />
             <ChevronRight className="w-3 h-3 text-slate-300" />
             <span className="text-slate-900">{pathname.split("/").pop()?.replace("-", " ")}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
               <div className="text-right">
                 <p className="text-xs font-black text-slate-900">{session?.user?.name?.replace("BuildMart", "EGS")}</p>
                 <p className="text-[9px] font-black text-primary uppercase tracking-widest">EGS Admin</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 border border-slate-200">
                 {session?.user?.name?.includes("BuildMart") ? "E" : session?.user?.name?.[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
