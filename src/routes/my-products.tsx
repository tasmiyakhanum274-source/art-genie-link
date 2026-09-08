import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductImage } from "@/components/ProductImage";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { formatPriceRange, type Product } from "@/lib/artisan";

export const Route = createFileRoute("/my-products")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My products — ArtisanLink" },
      {
        name: "description",
        content: "Edit, unpublish or remove the handmade products you have listed.",
      },
      { property: "og:title", content: "My products — ArtisanLink" },
      { property: "og:description", content: "Manage every listing you have created." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyProductsPage />
    </RequireAuth>
  ),
});

function MyProductsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-products", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("artisan_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (products ?? []) as Product[];
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("mine.removed"));
    void queryClient.invalidateQueries({ queryKey: ["my-products", user?.id] });
  };

  const toggleStatus = async (product: Product) => {
    const next = product.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("products").update({ status: next }).eq("id", product.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["my-products", user?.id] });
  };

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t("mine.title")}</h1>
        <Button asChild>
          <Link to="/upload">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> {t("dash.addProduct")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="card-surface text-muted-foreground mt-8 p-10 text-center">
          {t("mine.empty")}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {data!.map((product) => (
            <div
              key={product.id}
              className="card-surface flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap"
            >
              <ProductImage
                path={product.image_url}
                alt={product.title}
                className="h-20 w-20 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{product.title}</p>
                  <Badge variant={product.status === "published" ? "secondary" : "outline"}>
                    {product.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate text-sm">{product.category}</p>
                <p className="text-primary text-sm font-medium">
                  {formatPriceRange(product.price_min, product.price_max, product.currency)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void toggleStatus(product)}>
                  {product.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/edit/$id" params={{ id: product.id }}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Edit {product.title}</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(product.id)}>
                  <Trash2 className="text-destructive h-4 w-4" aria-hidden />
                  <span className="sr-only">Delete {product.title}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
