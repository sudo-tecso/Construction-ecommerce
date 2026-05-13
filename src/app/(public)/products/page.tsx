import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductsFilters } from "@/components/storefront/ProductsFilters";
import { SortDropdown } from "@/components/storefront/SortDropdown";
import {
  ChevronRight,
  Download,
  Search,
  ChevronLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop Construction Materials | Ekuase General Supplies",
  description:
    "High-performance structural timber, steel, and framing materials sourced for commercial industrial projects.",
};

interface ProductsPageProps {
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

async function ProductGrid({ searchParams }: ProductsPageProps) {
  const { 
    category, 
    search, 
    sort, 
    page = "1", 
    stock,
    minPrice,
    maxPrice 
  } = searchParams;
  
  const limit = 9; // Grid of 3x3
  const skip = (parseInt(page) - 1) * limit;

  const where: any = {
    isActive: true,
    ...(category && {
      category: { equals: category, mode: "insensitive" },
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(stock === "in_stock" && { stock: { gt: 0 } }),
    ...(stock === "low_stock" && { stock: { gt: 0, lt: 10 } }),
    ...(stock === "backorder" && { stock: { equals: 0 } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      }
    }),
  };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "stock") orderBy = { stock: "desc" };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({ 
      where, 
      orderBy, 
      skip, 
      take: limit,
      include: { Category: true }
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = parseInt(page);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300">
          <Filter className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-slate-100">
            No materials found
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-xs font-medium uppercase tracking-widest leading-loose">
            Adjust your filters or try a different search term.
          </p>
        </div>
        <Link href="/products">
          <button className="rounded-lg font-black bg-primary text-slate-900 h-10 px-8 uppercase tracking-widest text-[10px] hover:brightness-110 transition-all">
            Clear all
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-10 border-t border-slate-200 dark:border-white/10">
          <Link
            href={{
              query: { ...searchParams, page: Math.max(1, currentPage - 1) },
            }}
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
          >
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Simplified pagination for visual parity
            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
              return (
                <Link
                  key={pageNum}
                  href={{ query: { ...searchParams, page: pageNum } }}
                >
                  <button
                    className={cn(
                      "size-10 flex items-center justify-center rounded-lg font-black transition-all text-xs uppercase",
                      currentPage === pageNum
                        ? "bg-primary text-slate-900"
                        : "border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    {pageNum}
                  </button>
                </Link>
              );
            }
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>;
            }
            return null;
          })}

          <Link
            href={{
              query: { ...searchParams, page: Math.min(totalPages, currentPage + 1) },
            }}
            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
          >
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 h-[420px] overflow-hidden">
          <div className="aspect-[4/3] bg-slate-100 dark:bg-white/10" />
          <div className="p-5 space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-slate-100 dark:bg-white/10 rounded w-full" />
            <div className="h-10 bg-slate-100 dark:bg-white/10 rounded w-1/2 mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const currentCategory = searchParams.category || "";

  return (
    <main className="min-h-screen bg-[#f8f7f5] dark:bg-[#221a10] pt-32 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-20">
        {/* Breadcrumbs & Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/products" className="hover:text-primary transition-colors">Materials</Link>
            {currentCategory && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-900 dark:text-slate-100">{currentCategory}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 uppercase text-slate-900 dark:text-slate-100 leading-[0.9]">
                {currentCategory || "Lumber & Framing"}
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                High-performance structural timber, steel, and framing materials sourced for commercial industrial projects.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                <Download className="w-4 h-4 text-primary" />
                Price List PDF
              </button>
              
              <Suspense fallback={<div className="w-32 h-12 bg-white rounded-lg animate-pulse" />}>
                <SortDropdown currentSort={searchParams.sort || "newest"} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Filters */}
          <Suspense fallback={<div className="w-72 h-[600px] bg-white rounded-2xl animate-pulse" />}>
            <ProductsFilters searchParams={searchParams} />
          </Suspense>

          {/* Product Grid Area */}
          <div className="flex-1 w-full space-y-10">
            {/* Search Bar - Integrated from prototype feel */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <form action="/products">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchParams.search}
                  placeholder="Search by SKU, Name or Material..."
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold shadow-sm"
                />
                {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
              </form>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
