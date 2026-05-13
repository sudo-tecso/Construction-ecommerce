"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useCallback } from "react";

export function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="relative group">
      <select
        defaultValue={currentSort || "newest"}
        onChange={(e) => {
          router.push(`${pathname}?${createQueryString("sort", e.target.value)}`, { scroll: false });
        }}
        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold py-2 pl-4 pr-10 focus:ring-primary appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
      >
        <option value="newest">Sort by: Popularity</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="stock">Stock Level</option>
      </select>
      <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
    </div>
  );
}
