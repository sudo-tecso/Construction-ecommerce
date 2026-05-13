"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSession } from "next-auth/react";
import { Heart, ShoppingCart, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number | any;
    images: string[];
    category: string;
    stock: number;
    sku: string;
    description?: string | null;
  };
}

// In the prototype, there are specific hub labels like "NORTH HUB", "EAST RAIL", etc.
// We'll generate a deterministic hub label based on the SKU for the visual effect.
const HUB_LABELS: Record<number, string> = {
  0: "NORTH HUB",
  1: "EAST RAIL",
  2: "COASTAL",
  3: "CENTRAL",
};

function getHubLabel(sku: string): string {
  const sum = sku.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return HUB_LABELS[sum % 4];
}

function getUnitLabel(category: string): string {
  const map: Record<string, string> = {
    Timber: "Per LF",
    Steel: "Per Unit",
    Tiles: "Per M²",
    Roofing: "Per Sheet",
    Plumbing: "Per Unit",
    Electrical: "Per Unit",
    Cement: "Per Bag",
    Paint: "Per Litre",
    Hardware: "Per Unit",
    Tools: "Per Unit",
  };
  return map[category] ?? "Per Unit";
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { data: session } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const isWishlisted = isInWishlist(product.id);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 10;

  const stockLabel = outOfStock ? "Backorder" : lowStock ? "Low Stock" : "In Stock";
  const stockColor = outOfStock 
    ? "bg-rose-500" 
    : lowStock 
    ? "bg-amber-500" 
    : "bg-emerald-500";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.images[0] || "/placeholder.png",
        maxStock: product.stock,
      },
      1
    );
    toast.success("Added to cart!");
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id, !!session);
    toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <div className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Wishlist Button - Added for functionality */}
      <button
        onClick={handleWishlist}
        className={cn(
          "absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md border transition-all",
          isWishlisted 
            ? "bg-primary text-slate-900 border-primary" 
            : "bg-white/60 text-slate-400 border-transparent hover:bg-white hover:text-red-500"
        )}
      >
        <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
      </button>

      <Link href={`/products/${product.sku}`} className="flex flex-col flex-1">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={product.images[0] || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* SKU Badge */}
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#221a10]/90 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-slate-500">
            SKU: {product.sku.slice(0, 10).toUpperCase()}
          </div>
          
          {/* Stock Badge */}
          <div className={cn(
            "absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight text-white",
            stockColor
          )}>
            <span className="size-1.5 rounded-full bg-white"></span>
            {stockLabel}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
            <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg border border-primary/20 whitespace-nowrap shrink-0">
              {getHubLabel(product.sku)}
            </div>
          </div>
          
          <p className="text-slate-500 text-xs mb-4 line-clamp-2">
            {product.description || `Professional grade ${product.category.toLowerCase()} for industrial construction applications.`}
          </p>

          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {getUnitLabel(product.category)}
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(Number(product.price))}
              </span>
            </div>
            
            {outOfStock ? (
              <button 
                onClick={handleAddToCart}
                className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 cursor-not-allowed"
                disabled
              >
                <Bell className="w-4 h-4" />
                NOTIFY
              </button>
            ) : (
              <button 
                onClick={handleAddToCart}
                className="bg-primary text-slate-900 px-4 py-2 rounded-lg font-black text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                ADD
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
