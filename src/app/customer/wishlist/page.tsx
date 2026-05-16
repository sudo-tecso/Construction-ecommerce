import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Image from "next/image";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: true
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-black uppercase tracking-tighter text-secondary">My Wishlist</h1>
          <p className="text-sm font-medium text-muted-foreground italic">Save materials for your future projects.</p>
        </div>
        {wishlistItems.length > 0 && (
          <Button className="font-black uppercase tracking-tighter h-12 shadow-xl shadow-accent/20">
            <ShoppingBag className="w-4 h-4 mr-2" /> Add All to Cart
          </Button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border shadow-xl flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-heading font-black uppercase tracking-tighter text-secondary">Your Wishlist is Empty</h3>
            <p className="text-muted-foreground font-medium italic">Start browsing our catalog to save your favorite materials.</p>
          </div>
          <Button asChild className="font-black uppercase tracking-tighter h-14 px-10">
            <Link href="/products">Explore Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-none shadow-2xl rounded-[32px] bg-white transition-all duration-500 hover:-translate-y-2">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image 
                  src={item.product.images[0] || "/placeholder.jpg"} 
                  alt={item.product.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent">{item.product.category}</p>
                  <h4 className="text-xl font-heading font-black uppercase tracking-tighter text-secondary group-hover:text-accent transition-colors">
                    {item.product.name}
                  </h4>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <p className="text-2xl font-heading font-black text-secondary">{formatCurrency(Number(item.product.price))}</p>
                  <Button size="sm" className="font-black uppercase tracking-tighter h-10 px-6 rounded-xl">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
