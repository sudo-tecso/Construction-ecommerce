"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Coins, Warehouse, CheckCircle2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

const WAREHOUSES = [
  "North Industrial Hub",
  "Coastal Logistics Park",
  "East Rail Terminal",
  "Central Valley Depot",
];

const BRANDS = [
  "Dangote",
  "GHACEM",
  "SteelCo",
  "Weyerhaeuser",
  "Georgia-Pacific",
  "LP Building",
];

interface ProductsFiltersProps {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
    stock?: string;
    minPrice?: string;
    maxPrice?: string;
    warehouses?: string;
    brand?: string;
  };
}

export function ProductsFilters({ searchParams }: ProductsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsObj = useSearchParams();

  // Local state for price range
  const [minPrice, setMinPrice] = useState(searchParams.minPrice || "10");
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice || "50000");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParamsObj.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page"); // Reset page on filter change
      return params.toString();
    },
    [searchParamsObj]
  );

  const toggleWarehouse = (hub: string) => {
    const current = searchParams.warehouses ? searchParams.warehouses.split(",") : [];
    const updated = current.includes(hub)
      ? current.filter((h) => h !== hub)
      : [...current, hub];
    
    router.push(`${pathname}?${createQueryString("warehouses", updated.join(","))}`, { scroll: false });
  };

  const handlePriceChange = () => {
    const params = new URLSearchParams(searchParamsObj.toString());
    params.set("minPrice", minPrice);
    params.set("maxPrice", maxPrice);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-12 bg-white dark:bg-white/5 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm h-fit lg:sticky lg:top-32">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-slate-100">Filters</h2>
        <button 
          onClick={() => router.push(pathname)}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear All
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <Coins className="w-4 h-4 text-primary" />
          Price Range (GHS)
        </h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min</label>
              <input 
                type="number" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max</label>
              <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          
          <div className="relative h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full">
            <div className="absolute h-full w-2/3 left-[15%] bg-primary rounded-full shadow-[0_0_15px_rgba(244,157,37,0.4)]" />
            <div className="absolute size-4 top-1/2 -translate-y-1/2 left-[15%] bg-white border-2 border-primary rounded-full cursor-pointer shadow-md" />
            <div className="absolute size-4 top-1/2 -translate-y-1/2 left-[81%] bg-white border-2 border-primary rounded-full cursor-pointer shadow-md" />
          </div>
        </div>
      </div>

      {/* Warehouses */}
      <div className="space-y-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <Warehouse className="w-4 h-4 text-primary" />
          Hub Inventory
        </h3>
        <div className="space-y-3">
          {WAREHOUSES.map((hub) => {
            const isChecked = searchParams.warehouses?.split(",").includes(hub);
            return (
              <label key={hub} className="flex items-center gap-3 group cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleWarehouse(hub)}
                  className="rounded border-slate-300 dark:border-white/10 text-primary focus:ring-primary size-4 cursor-pointer"
                />
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isChecked ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 group-hover:text-primary"
                )}>
                  {hub}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Availability
        </h3>
        <div className="space-y-3">
          {[
            { label: "In Stock Only", value: "in_stock" },
            { label: "Include Low Stock", value: "low_stock" },
            { label: "Backorder Available", value: "backorder" },
          ].map(({ label, value }) => (
            <label key={value} className="flex items-center gap-3 group cursor-pointer">
              <input
                type="radio"
                name="stock"
                checked={searchParams.stock === value}
                onChange={() => router.push(`${pathname}?${createQueryString("stock", value)}`, { scroll: false })}
                className="text-primary focus:ring-primary size-4 border-slate-300 dark:border-white/10 bg-transparent cursor-pointer"
              />
              <span className={cn(
                "text-sm font-medium transition-colors",
                searchParams.stock === value ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 group-hover:text-primary"
              )}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <Tag className="w-4 h-4 text-primary" />
          Top Brands
        </h3>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((brand) => {
            const isActive = searchParams.brand === brand;
            return (
              <button
                key={brand}
                onClick={() => router.push(`${pathname}?${createQueryString("brand", isActive ? "" : brand)}`, { scroll: false })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                  isActive
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary hover:text-primary"
                )}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
