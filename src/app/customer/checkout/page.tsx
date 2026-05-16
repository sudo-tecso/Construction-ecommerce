"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { nanoid } from "nanoid";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ShoppingCart, Truck, CreditCard, Check, ChevronLeft,
  MapPin, Store, Loader2, Trash2, Info, Warehouse, Lock,
  Ticket, Package, QrCode,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import axios from "axios";

const deliverySchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),
  method: z.enum(["DELIVERY", "PICKUP"]),
});
type DeliveryValues = z.infer<typeof deliverySchema>;

const STEPS = [
  { id: 1, label: "Cart Review", icon: ShoppingCart },
  { id: 2, label: "Delivery", icon: Truck },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Confirm", icon: Check },
];

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "TICKET">("ONLINE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDelivery, setSavedDelivery] = useState<DeliveryValues | null>(null);

  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, updateQuantity, removeItem, getTotal } = useCartStore();
  const subtotal = getTotal();

  const form = useForm<DeliveryValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      method: "DELIVERY",
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.setValue("fullName", session.user.name || "");
      form.setValue("phone", (session.user as any)?.phone || "");
    }
  }, [session, form]);

  useEffect(() => {
    if (items.length === 0 && step < 4) router.push("/products");
  }, [items, step, router]);

  const deliveryMethod = form.watch("method");
  const deliveryFee = deliveryMethod === "DELIVERY" ? 50 : 0;
  const finalTotal = subtotal + deliveryFee;

  const handleFinalSubmit = async (delivery: DeliveryValues) => {
    setIsSubmitting(true);
    try {
      const paystackRef =
        paymentMethod === "ONLINE" ? `EGS-${nanoid(10)}` : undefined;

      const { data } = await axios.post("/api/orders", {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        deliveryDetails: delivery,
        paymentMethod,
        totalAmount: finalTotal,
        deliveryFee,
        paystackRef,
      });

      const { orderId } = data;

      if (paymentMethod === "ONLINE") {
        const PaystackPop = (await import("@paystack/inline-js")).default;
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
          email: session?.user?.email || "",
          amount: Math.round(finalTotal * 100),
          currency: "GHS",
          reference: paystackRef!,
          onSuccess: async (transaction: { reference: string }) => {
            try {
              await axios.post(`/api/orders/${orderId}/verify-payment`, {
                reference: transaction.reference,
              });
              clearCart();
              router.push(`/customer/orders/${orderId}/success`);
            } catch {
              toast.error("Payment succeeded but verification failed. Contact support.");
              setIsSubmitting(false);
            }
          },
          onCancel: () => {
            toast.error("Payment cancelled");
            setIsSubmitting(false);
          },
        });
      } else {
        clearCart();
        router.push(`/customer/orders/${orderId}/ticket`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Order failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: DeliveryValues) => {
    if (step === 2) setSavedDelivery(values);
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    // Step 4: final submission
    await handleFinalSubmit(savedDelivery || values);
  };

  const currentDelivery = savedDelivery || form.getValues();

  return (
    <div className="bg-background-light min-h-screen pt-10 pb-20">
      <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-20">

        {/* ── Progress Bar ── */}
        <div className="relative flex items-start justify-between mb-14 max-w-2xl mx-auto px-4">
          <div className="absolute top-6 left-4 right-4 h-px bg-slate-200" />
          <div
            className="absolute top-6 left-4 h-px bg-primary transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, right: "unset" }}
          />
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white",
                  done ? "border-primary bg-primary text-white" :
                  active ? "border-primary text-primary shadow-md scale-110" : "border-slate-200 text-slate-400"
                )}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest hidden sm:block text-center",
                  active || done ? "text-slate-900" : "text-slate-400"
                )}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-10">
          {/* ── Main Panel ── */}
          <div className="flex-1">

            {/* Step 1: Cart Review */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">Your Cart</h1>
                  <p className="text-slate-500 mt-1">Review items before continuing.</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border-l-4 border-primary">
                  <Warehouse className="text-primary w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-slate-900 font-bold text-sm">Shipment from Main Warehouse</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Standard Delivery — 2-3 Business Days</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-5 items-center">
                      <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">SKU: {item.productId.slice(0, 8).toUpperCase()}</p>
                        <p className="text-primary font-bold text-sm mt-1">{formatCurrency(item.price)}<span className="text-slate-400 font-normal"> / unit</span></p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-md bg-white shadow-sm hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center">−</button>
                          <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-md bg-white shadow-sm hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center">+</button>
                        </div>
                        <p className="font-black text-slate-900 w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
                        <button type="button" onClick={() => removeItem(item.productId)}
                          className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Delivery Details */}
            {step === 2 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-8">Delivery Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name</label>
                    <Input {...form.register("fullName")} placeholder="Full name" className="h-12 border-slate-200 focus-visible:ring-primary" />
                    {form.formState.errors.fullName && <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Phone Number</label>
                    <Input {...form.register("phone")} placeholder="024 XXX XXXX" className="h-12 border-slate-200 focus-visible:ring-primary" />
                    {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Delivery Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "DELIVERY", icon: MapPin, label: "Home Delivery", sub: `+ ${formatCurrency(50)} fee` },
                      { value: "PICKUP", icon: Store, label: "Store Pickup", sub: "Free of charge" },
                    ].map(({ value, icon: Icon, label, sub }) => (
                      <label key={value} className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                        deliveryMethod === value ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                      )}>
                        <input type="radio" {...form.register("method")} value={value} className="hidden" />
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center",
                          deliveryMethod === value ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm">{label}</p>
                          <p className="text-xs text-slate-500">{sub}</p>
                        </div>
                        {deliveryMethod === value && <Check className="w-5 h-5 text-primary shrink-0" />}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {deliveryMethod === "DELIVERY" ? "Delivery Address" : "Location / Branch"}
                  </label>
                  <textarea {...form.register("address")}
                    className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm resize-none transition-all"
                    placeholder={deliveryMethod === "DELIVERY" ? "Full delivery address..." : "Nearest branch or pickup details..."} />
                  {form.formState.errors.address && <p className="text-xs text-red-500">{form.formState.errors.address.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">How Would You Like to Pay?</h2>
                <p className="text-slate-500 mb-8">Choose your preferred payment method.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Online Payment */}
                  <label className={cn(
                    "relative flex flex-col items-center text-center gap-5 p-8 rounded-2xl border-2 cursor-pointer transition-all group",
                    paymentMethod === "ONLINE" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-slate-200 hover:border-slate-300"
                  )}>
                    <input type="radio" name="pay" onChange={() => setPaymentMethod("ONLINE")} checked={paymentMethod === "ONLINE"} className="hidden" />
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all",
                      paymentMethod === "ONLINE" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <Lock className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black tracking-tight text-slate-900">Pay Online Now</h4>
                      <p className="text-sm text-slate-500 mt-2">Card or mobile money via Paystack</p>
                      <p className="text-xs text-slate-400 mt-1">Instant, secure, encrypted</p>
                    </div>
                    {paymentMethod === "ONLINE" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </label>

                  {/* Ticket-to-Store */}
                  <label className={cn(
                    "relative flex flex-col items-center text-center gap-5 p-8 rounded-2xl border-2 cursor-pointer transition-all group",
                    paymentMethod === "TICKET" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-slate-200 hover:border-slate-300"
                  )}>
                    <input type="radio" name="pay" onChange={() => setPaymentMethod("TICKET")} checked={paymentMethod === "TICKET"} className="hidden" />
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all",
                      paymentMethod === "TICKET" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <QrCode className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black tracking-tight text-slate-900">Ticket-to-Store</h4>
                      <p className="text-sm text-slate-500 mt-2">Get a QR ticket, pay at our store</p>
                      <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">No Online Fee</span>
                    </div>
                    {paymentMethod === "TICKET" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </label>
                </div>

                <div className={cn(
                  "mt-6 p-4 rounded-xl border text-sm",
                  paymentMethod === "ONLINE" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-amber-50 border-amber-200 text-amber-800"
                )}>
                  {paymentMethod === "ONLINE"
                    ? "💳 You'll be redirected to Paystack's secure checkout. Your order ships immediately after payment."
                    : "🎫 A unique QR code ticket (e.g. BM-K7X2P) is generated. Take it to any EGS store within 48 hours to pay and collect."}
                </div>
              </div>
            )}

            {/* Step 4: Order Confirmation Summary */}
            {step === 4 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Review Your Order</h2>
                <p className="text-slate-500 mb-8">Please confirm everything looks correct before submitting.</p>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Items ({items.length})
                  </h3>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4 p-4">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-black text-slate-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Delivery
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Name</span>
                    <span className="font-semibold text-slate-900">{currentDelivery.fullName}</span>
                    <span className="text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-900">{currentDelivery.phone}</span>
                    <span className="text-slate-500">Method</span>
                    <span className="font-semibold text-slate-900">
                      {currentDelivery.method === "DELIVERY" ? `Home Delivery (+${formatCurrency(50)})` : "Store Pickup (Free)"}
                    </span>
                    <span className="text-slate-500">Address</span>
                    <span className="font-semibold text-slate-900">{currentDelivery.address}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {paymentMethod === "ONLINE" ? <Lock className="w-5 h-5 text-primary" /> : <QrCode className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{paymentMethod === "ONLINE" ? "Pay Online via Paystack" : "Ticket-to-Store"}</p>
                      <p className="text-xs text-slate-500">{paymentMethod === "ONLINE" ? "Secure card/mobile money" : "QR code, pay at store within 48h"}</p>
                    </div>
                  </div>
                </div>

                {/* Total Breakdown */}
                <div className="space-y-3 border-t border-dashed border-slate-200 pt-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Delivery fee</span>
                    <span className="font-semibold">{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Free"}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className="lg:w-96 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <h2 className="text-slate-900 text-xl font-black mb-6 pb-4 border-b border-slate-100">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {step > 1 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-slate-900">{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Free"}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-black text-slate-900 uppercase tracking-tight">Total</span>
                  <span className="text-2xl font-black text-primary">{formatCurrency(step > 1 ? finalTotal : subtotal)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:brightness-110 text-slate-900 py-6 rounded-xl font-black text-base shadow-md border-0 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : step < 4 ? (
                    step === 3 ? "Review Order →" : `Continue to ${STEPS[step].label} →`
                  ) : paymentMethod === "ONLINE" ? (
                    `Pay ${formatCurrency(finalTotal)} with Paystack`
                  ) : (
                    "Generate My Ticket 🎫"
                  )}
                </Button>

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors py-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to {STEPS[step - 2].label}
                  </button>
                )}

                <p className="text-center text-slate-400 text-xs flex items-center justify-center gap-2 mt-1">
                  <Lock className="w-3 h-3" /> Secured by EGS · Powered by Paystack
                </p>
              </div>

              {step === 1 && (
                <div className="mt-6 p-4 bg-slate-900 text-white rounded-xl relative overflow-hidden">
                  <Info className="w-4 h-4 text-primary absolute top-4 right-4" />
                  <p className="text-xs font-bold mb-1">Pro Logistics Tip</p>
                  <p className="text-slate-400 text-xs leading-relaxed">Heavy items like cement and rebar ship from our <strong>Main Warehouse</strong> for optimal bulk rates.</p>
                  <Truck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                </div>
              )}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
