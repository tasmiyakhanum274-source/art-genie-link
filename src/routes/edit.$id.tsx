import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/artisan";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit product — ArtisanLink" },
      { name: "description", content: "Update the details, price range and tags of your listing." },
      { property: "og:title", content: "Edit product — ArtisanLink" },
      { property: "og:description", content: "Update details, price range and tags." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EditProductPage />
    </RequireAuth>
  ),
});

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["edit-product", id],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (product as Product) ?? null;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        craft_type: form.craft_type,
        materials: form.materials,
        tags: form.tags,
        price_min: form.price_min,
        price_max: form.price_max,
      })
      .eq("id", form.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Changes saved");
    void navigate({ to: "/my-products" });
  };

  if (isLoading || !form) {
    return (
      <PageShell>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">Edit product</h1>
      <div className="card-surface mt-6 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Product name</Label>
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="craft">Craft type</Label>
            <Input
              id="craft"
              value={form.craft_type ?? ""}
              onChange={(e) => set("craft_type", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pmin">Lowest price (₹)</Label>
            <Input
              id="pmin"
              type="number"
              value={form.price_min}
              onChange={(e) => set("price_min", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pmax">Highest price (₹)</Label>
            <Input
              id="pmax"
              type="number"
              value={form.price_max}
              onChange={(e) => set("price_max", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Search tags (comma separated)</Label>
          <Input
            id="tags"
            value={form.tags.join(", ")}
            onChange={(e) =>
              set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="materials">Materials (comma separated)</Label>
          <Input
            id="materials"
            value={form.materials.join(", ")}
            onChange={(e) =>
              set("materials", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
            }
          />
        </div>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </PageShell>
  );
}
