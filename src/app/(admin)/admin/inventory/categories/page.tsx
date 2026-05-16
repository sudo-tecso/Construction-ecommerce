"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Plus, Edit, Trash2, Layers, ChevronRight, Move } from "lucide-react";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/shared/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  parentId: z.string().optional().nullable(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Categories
  const { data: categories, isLoading } = useQuery("admin-categories", async () => {
    const res = await axios.get("/api/admin/categories");
    return res.data;
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true);
      if (selectedCategory) {
        await axios.patch(`/api/admin/categories/${selectedCategory.id}`, data);
        toast.success("Category updated");
      } else {
        await axios.post("/api/admin/categories", data);
        toast.success("Category created");
      }
      queryClient.invalidateQueries("admin-categories");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const deleteMutation = useMutation(
    async (id: string) => {
      await axios.delete(`/api/admin/categories/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-categories");
        toast.success("Category deleted");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || "Failed to delete");
      }
    }
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-secondary tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground font-medium">Organize your products into hierarchical categories.</p>
        </div>
        <button
          onClick={() => {
            setSelectedCategory(null);
            reset({ name: "", slug: "", parentId: null });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y">
                {categories?.map((category: any) => (
                  <div key={category.id} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Layers className="w-5 h-5 text-secondary/40" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-secondary">{category.name}</span>
                           {category.parent && (
                             <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                               <ChevronRight className="w-3 h-3" />
                               Sub of {category.parent.name}
                             </span>
                           )}
                        </div>
                        <p className="text-xs text-muted-foreground">/{category.slug} • {category._count?.products || 0} Products</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          reset({
                            name: category.name,
                            slug: category.slug,
                            parentId: category.parentId,
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-secondary"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this category?")) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-accent/5 rounded-3xl p-8 border border-accent/10 h-fit space-y-4">
           <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <Move className="w-6 h-6 text-white" />
           </div>
           <h3 className="font-black text-secondary text-lg uppercase tracking-tight">Organization Tips</h3>
           <p className="text-sm text-secondary/70 leading-relaxed">
             Use specific categories to help customers find construction materials faster. 
             Sub-categories like &quot;Sands → White Sand&quot; are better for SEO and navigation.
           </p>
           <div className="pt-4 space-y-2">
              <div className="flex items-center gap-3 text-xs font-bold text-secondary">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                 Keep slugs unique and SEO friendly
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-secondary">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                 Product counts update automatically
              </div>
           </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? "Edit Category" : "New Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Category Name</label>
            <input
              {...register("name")}
              placeholder="e.g. Building Materials"
              onChange={(e) => {
                setValue("slug", e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
                setValue("name", e.target.value);
              }}
              className={cn(
                "w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                errors.name && "border-destructive focus:ring-destructive/20 focus:border-destructive"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">URL Slug</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
              <input
                {...register("slug")}
                className="w-full pl-7 pr-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">Parent Category (Optional)</label>
            <select
              {...register("parentId")}
              className="w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
            >
              <option value="">None (Top Level)</option>
              {categories?.filter((c: any) => c.id !== selectedCategory?.id).map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {selectedCategory ? "Update Category" : "Create Category"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
