"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { X, Upload, Loader2, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be at least 0"),
  categoryId: z.string().min(1, "Category is required"),
  stock: z.number().int().min(0, "Stock must be at least 0"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string()).max(5, "Max 5 images allowed"),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // The product object if editing
  categories: any[];
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  initialData,
  categories,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      stock: 0,
      sku: "",
      images: [],
      isActive: true,
    },
  });

  const images = watch("images");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          name: "",
          description: "",
          price: 0,
          categoryId: "",
          stock: 0,
          sku: `PROD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          images: [],
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (isEditing) {
        await axios.patch(`/api/admin/products/${initialData.id}`, data);
        toast.success("Product updated successfully");
      } else {
        await axios.post("/api/admin/products", data);
        toast.success("Product created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (url: string) => {
    setValue("images", images.filter((img) => img !== url));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add New Product"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Product Name</label>
            <input
              {...register("name")}
              placeholder="e.g. 5-inch Solid Blocks"
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                errors.name && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            />
            {errors.name && <p className="text-[10px] font-bold text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Category</label>
            <select
              {...register("categoryId")}
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none",
                errors.categoryId && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-[10px] font-bold text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">SKU</label>
            <input
              {...register("sku")}
              placeholder="SKU-XXXXX"
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                errors.sku && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            />
            {errors.sku && <p className="text-[10px] font-bold text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Price (GHS)</label>
            <input
              {...register("price", { valueAsNumber: true })}
              type="number"
              step="0.01"
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                errors.price && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            />
            {errors.price && <p className="text-[10px] font-bold text-destructive">{errors.price.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Stock Quantity</label>
            <input
              {...register("stock", { valueAsNumber: true })}
              type="number"
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                errors.stock && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            />
            {errors.stock && <p className="text-[10px] font-bold text-destructive">{errors.stock.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Images (Max 5)</label>
          <div className="grid grid-cols-5 gap-4">
            {images.map((url, index) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border bg-muted">
                <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <div className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer relative">
                <UploadButton
                  endpoint="productImage"
                  onClientUploadComplete={(res) => {
                    if (res) {
                      const newImages = [...images, ...res.map((f) => f.url)].slice(0, 5);
                      setValue("images", newImages);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`ERROR! ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-accent hover:bg-accent/90 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg",
                    allowedContent: "hidden",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 py-4 border-t">
          <input
            {...register("isActive")}
            type="checkbox"
            className="w-4 h-4 rounded text-accent focus:ring-accent"
          />
          <label className="text-sm font-bold text-secondary">Visible on Storefront</label>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-secondary hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
