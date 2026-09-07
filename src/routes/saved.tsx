import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/lib/artisan";

export const Route = createFileRoute("/saved")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Saved products — ArtisanLink" },
      { name: "description", content: "The handmade pieces you bookmarked to revisit or buy." },
      { property: "og:title", content: "Saved products — ArtisanLink" },
      { property: "og:description", content: "Your bookmarked handmade pieces in one list." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SavedPage />
    </RequireAuth>
  ),
});

function SavedPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-products", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("buyer_interest")
        .select("product_id")
        .eq("buyer_id", user!.id)
        .eq("kind", "save");
      if (error) throw error;
      const ids = Array.from(new Set((rows ?? []).map((row) => row.product_id)));
      if (ids.length === 0) return [] as Product[];
      const { data: products } = await supabase.from("products").select("*").in("id", ids);
      return (products ?? []) as Product[];
    },
  });

  return (
    <PageShell wide>
      <h1 className="text-3xl font-semibold">Saved products</h1>

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-muted-foreground">You have not saved anything yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse the marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
