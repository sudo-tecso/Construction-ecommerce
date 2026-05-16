"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Truck, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function OrderSuccessPage() {
  const { orderId } = useParams();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff5c00", "#1a1a1a", "#ffffff"],
    });
  }, []);

  return (
    <div className="bg-background min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="flex flex-col items-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-xl">
            <CheckCircle className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter text-secondary">Payment Successful!</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Order ID: #{String(orderId).slice(-8).toUpperCase()}</p>
          </div>

          <div className="bg-white p-8 rounded-[40px] border shadow-2xl w-full text-left space-y-6">
            <h3 className="text-xl font-heading font-black uppercase tracking-tighter text-secondary flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" /> What Happens Next?
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="font-black text-secondary">1</span>
                </div>
                <div>
                  <p className="font-bold text-secondary uppercase tracking-tight text-sm">Processing Order</p>
                  <p className="text-xs text-muted-foreground">Our warehouse team is picking your items.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="font-black text-secondary">2</span>
                </div>
                <div>
                  <p className="font-bold text-secondary uppercase tracking-tight text-sm">Delivery Scheduled</p>
                  <p className="text-xs text-muted-foreground">You will receive an SMS when your items leave the warehouse.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-secondary uppercase tracking-tight text-sm">ETA: 24-48 Hours</p>
                  <p className="text-xs text-muted-foreground">Standard delivery time for your region.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Button asChild size="lg" className="h-16 font-black uppercase tracking-tighter shadow-xl shadow-accent/20">
              <Link href="/customer/dashboard">
                Track Your Order <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 font-black uppercase tracking-tighter">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
