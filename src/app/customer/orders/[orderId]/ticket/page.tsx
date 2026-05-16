"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Download, Share2, Printer, MapPin, Clock, AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Dynamically imported to avoid SSR issues
let jsPDF: any;
let html2canvas: any;

interface TicketData {
  id: string;
  ticketCode: string;
  qrCodeUrl: string | null;
  status: string;
  expiresAt: string;
  order: {
    id: string;
    totalAmount: number;
    deliveryAddress: string | null;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      product: { name: string; images: string[] };
    }[];
  };
}

export default function TicketPage() {
  const params = useParams();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;

  const [data, setData] = useState<TicketData | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get(`/api/orders/${orderId}/ticket`)
      .then((r) => setData(r.data))
      .catch(() => console.error("Failed to fetch ticket"));
  }, [orderId]);

  useEffect(() => {
    if (!data?.expiresAt) return;
    const tick = () => {
      const diff = new Date(data.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      if (!html2canvas) html2canvas = (await import("html2canvas")).default;
      if (!jsPDF) jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(ticketRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save(`EGS-Ticket-${data?.ticketCode}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
    setIsDownloading(false);
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const msg = `Hi Ekuase GS! Here is my order ticket:\n\n*Ticket:* ${data.ticketCode}\n*Total Due:* GH₵ ${Number(data.order.totalAmount).toFixed(2)}\n*Expires:* ${new Date(data.expiresAt).toLocaleString("en-GH")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles injected via a regular style tag in head via globals.css alternative */}
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      <div className="bg-background-light min-h-screen py-16">
        <div className="max-w-2xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-10 no-print">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Your Ticket is Ready!</h1>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Present this QR code at any Ekuase General Supplies warehouse within 48 hours to pay and collect your items.
            </p>
          </div>

          {/* ── Ticket Card ── */}
          <div
            ref={ticketRef}
            className="bg-white rounded-[32px] shadow-2xl border-2 border-primary overflow-hidden relative"
          >
            {/* Ticket Header */}
            <div className="bg-slate-900 p-8 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Ticket ID</p>
                <h2 className="text-3xl font-black tracking-tighter text-white font-mono">{data.ticketCode}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Status</p>
                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${isExpired ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"}`}>
                  {isExpired ? "Expired" : "Valid"}
                </span>
              </div>
            </div>

            {/* Perforation */}
            <div className="relative flex items-center px-6 py-3">
              <div className="absolute -left-4 w-8 h-8 rounded-full bg-background-light border-r-2 border-primary/30" />
              <div className="flex-1 border-t-2 border-dashed border-slate-200" />
              <div className="absolute -right-4 w-8 h-8 rounded-full bg-background-light border-l-2 border-primary/30" />
            </div>

            <div className="px-8 pb-10 space-y-8 flex flex-col items-center">
              {/* QR Code */}
              {data.qrCodeUrl && (
                <div className="w-56 h-56 p-3 border-4 border-slate-100 rounded-3xl bg-white shadow-inner">
                  <img src={data.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Ticket Code large */}
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Ticket Code</p>
                <p className="text-4xl font-black font-mono tracking-[0.2em] text-slate-900">{data.ticketCode}</p>
              </div>

              {/* Expiry Countdown */}
              <div className={`w-full flex items-center gap-3 p-4 rounded-2xl ${isExpired ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                <AlertCircle className={`w-5 h-5 shrink-0 ${isExpired ? "text-red-500" : "text-amber-600"}`} />
                <div>
                  <p className={`text-sm font-bold ${isExpired ? "text-red-700" : "text-amber-800"}`}>
                    {isExpired ? "This ticket has expired" : `Expires in: ${timeLeft}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(data.expiresAt).toLocaleString("en-GH", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="w-full border-t border-dashed border-slate-200 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Items in this Order
                </h3>
                <div className="space-y-3">
                  {data.order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                      )}
                      <span className="flex-1 font-medium text-slate-900 text-sm">{item.product.name}</span>
                      <span className="text-slate-500 text-xs">×{item.quantity}</span>
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="w-full flex justify-between items-center border-t border-slate-100 pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Due at Store</span>
                <span className="text-3xl font-black text-primary">{formatCurrency(Number(data.order.totalAmount))}</span>
              </div>

              {/* Store Location */}
              <div className="w-full flex items-center gap-2 text-slate-500 text-xs">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold uppercase tracking-wider">Pickup Branch: Accra Central — Main Warehouse</span>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
            <Button
              onClick={downloadPDF}
              disabled={isDownloading}
              variant="outline"
              size="lg"
              className="h-14 gap-3 font-black uppercase tracking-widest"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Download PDF
            </Button>

            <Button
              onClick={shareWhatsApp}
              size="lg"
              className="h-14 gap-3 font-black uppercase tracking-widest bg-[#25D366] hover:bg-[#128C7E] border-none text-white"
            >
              <Share2 className="w-5 h-5" />
              Share via WhatsApp
            </Button>

            <Button
              onClick={() => window.print()}
              variant="outline"
              size="lg"
              className="sm:col-span-2 h-12 gap-3 font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
            >
              <Printer className="w-4 h-4" />
              Print Ticket
            </Button>
          </div>

          <div className="mt-8 text-center no-print">
            <Link href="/products" className="text-sm font-black text-primary hover:underline uppercase tracking-widest">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
