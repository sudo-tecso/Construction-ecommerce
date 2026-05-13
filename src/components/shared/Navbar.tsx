"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";

export const Navbar = () => {
  const { data: session } = useSession();
  const totalItems = useCartStore((state) => state.getItemCount());

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-4 md:px-20 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="size-10 bg-white rounded flex items-center justify-center overflow-hidden">
            <img alt="Ekuase General Supplies Logo" className="w-full h-full object-contain" src="/logo.png"/>
          </div>
          <h2 className="text-xl font-black tracking-tight uppercase">Ekuase General Supplies</h2>
        </Link>
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/products">Materials</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/warehouses">Warehouses</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/services">Hire Professionals</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/products">Products</Link>
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/orders">Track Order</Link>
        </nav>
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/cart">
            <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-[20px] mr-2">shopping_cart</span>
              <span className="text-sm font-bold">Cart</span>
              {totalItems > 0 && (
                <span className="ml-1 bg-primary text-background-dark text-[10px] px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </Link>
          {session ? (
            <button onClick={() => signOut()} className="flex items-center justify-center rounded-lg h-10 px-5 bg-slate-900 text-white hover:brightness-110 transition-all">
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          ) : (
            <Link href="/login">
              <button className="flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-background-dark hover:brightness-110 transition-all">
                <span className="text-sm font-bold">Sign In</span>
              </button>
            </Link>
          )}
          <div className="size-10 rounded-full border-2 border-primary/20 bg-slate-200 overflow-hidden cursor-pointer">
            <img alt="User Profile" className="w-full h-full object-cover" data-alt="Professional contractor profile headshot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrmR1ESLuSDBEfF3cxO8Gkmjx_9GQe0gwNe2h4iMtG20EJkwF7kOoPoQkCbuCWh3oW4Ylf0MSNSJROaRp7jKJF7gY2VFpQ4QDXdagggYAmm7SxqgiNka_T-WbOMnwI_jOODD8hFwxiFOqUhQP0s09-_3ggPYOf7LSJ9joY_Mvv-cvT6d4Wc0HH4QCPk_C2cHRe0Rma8I926UZcPug8g4XNABYAmhli6pqDkUra22fV6HqKdSs7dLHyMstEAeWDGIXakh4483sjMwK_"/>
          </div>
        </div>
      </div>
    </header>
  );
};
