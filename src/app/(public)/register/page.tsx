"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import axios from "axios";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid Ghana phone format (10-15 digits)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      if (response.data.success) {
        toast.success("Registration successful! Signing you in...");
        
        // Auto-login after registration
        const loginResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (loginResult?.error) {
          router.push("/login");
        } else {
          window.location.href = "/customer/dashboard";
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="bg-white p-8 md:p-12 shadow-sm rounded-2xl border border-slate-200">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-slate-900">Create Account</h1>
            <p className="text-slate-500 text-sm font-medium">Join Ekuase General Supplies today and start building better.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
              <Input
                {...register("name")}
                placeholder="John Doe"
                disabled={isLoading}
                className={cn("border-slate-200 h-12 focus-visible:ring-primary", errors.name && "border-red-500")}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                <Input
                  {...register("email")}
                  placeholder="john@example.com"
                  type="email"
                  disabled={isLoading}
                  className={cn("border-slate-200 h-12 focus-visible:ring-primary", errors.email && "border-red-500")}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 font-bold uppercase">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</label>
                <Input
                  {...register("phone")}
                  placeholder="0240000000"
                  disabled={isLoading}
                  className={cn("border-slate-200 h-12 focus-visible:ring-primary", errors.phone && "border-red-500")}
                />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 font-bold uppercase">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                <Input
                  {...register("password")}
                  placeholder="••••••••"
                  type="password"
                  disabled={isLoading}
                  className={cn("border-slate-200 h-12 focus-visible:ring-primary", errors.password && "border-red-500")}
                />
                {errors.password && (
                  <p className="text-[10px] text-red-500 font-bold uppercase">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm Password</label>
                <Input
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  type="password"
                  disabled={isLoading}
                  className={cn("border-slate-200 h-12 focus-visible:ring-primary", errors.confirmPassword && "border-red-500")}
                />
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-500 font-bold uppercase">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button className="w-full h-14 bg-primary text-background-dark font-black uppercase tracking-tighter text-lg hover:brightness-110 shadow-lg shadow-primary/10 rounded-lg border-0" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-black tracking-widest">Or register with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-14 flex gap-3 text-sm font-black uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 rounded-lg"
            onClick={() => signIn("google", { callbackUrl: "/customer/dashboard" })}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <p className="mt-10 text-center text-xs text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-black hover:underline ml-1">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
