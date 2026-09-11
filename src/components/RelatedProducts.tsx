import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { recommendRelated } from "@/lib/recommend.functions";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/lib/artisan";

/** AI-ranked "You may also like" strip shown under a product. */
export function RelatedProducts({ product }: { product: Product }) {
  const rank = useServerFn(recommendRelated);
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["related", product.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .neq("id", product.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      const candidates = (rows ?? []) as Product[];
      if (candidates.length === 0) return [] as Product[];

      const compact = (p: Product) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        craft_type: p.craft_type,
        tags: p.tags ?? [],
        materials: p.materials ?? [],
        price_min: Number(p.price_min) || 0,
        location: p.location,
      });

      const { ids } = await rank({
        data: {
          current: compact(product),
          candidates: candidates.map(compact),
          limit: 4,
        },
      });
      const byId = new Map(candidates.map((p) => [p.id, p]));
      return ids.map((id) => byId.get(id)).filter(Boolean) as Product[];
    },
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="mt-14">
      <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="text-primary h-5 w-5" aria-hidden /> {t("related.title")}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">{t("related.subtitle")}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))
          : data!.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
