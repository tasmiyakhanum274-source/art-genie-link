import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MessageCircle, Search, Sparkles, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { recommendRelated } from "@/lib/recommend.functions";
import { formatPriceRange, type Product } from "@/lib/artisan";

export const Route = createFileRoute("/buyer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your buyer home — ArtisanLink" },
      {
        name: "description",
        content:
          "Your saved crafts, enquiries with artisans and AI picks chosen from what you like.",
      },
      { property: "og:title", content: "Your buyer home — ArtisanLink" },
      {
        property: "og:description",
        content: "Saved crafts, artisan enquiries and AI recommendations in one place.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <BuyerHome />
    </RequireAuth>
  ),
});

type Interest = {
  id: string;
  product_id: string;
  kind: string;
  message: string | null;
  created_at: string;
};

function BuyerHome() {
  const { user, profile } = useAuth();
  const rank = useServerFn(recommendRelated);

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-home", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("buyer_interest")
        .select("id, product_id, kind, message, created_at")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const interests = (rows ?? []) as Interest[];

      const ids = Array.from(new Set(interests.map((i) => i.product_id)));
      let products: Product[] = [];
      if (ids.length > 0) {
        const { data: prods } = await supabase.from("products").select("*").in("id", ids);
        products = (prods ?? []) as Product[];
      }
      const byId = new Map(products.map((p) => [p.id, p]));
      return { interests, byId };
    },
  });

  const savedProducts = (data?.interests ?? [])
    .filter((i) => i.kind === "save")
    .map((i) => data!.byId.get(i.product_id))
    .filter(Boolean) as Product[];
  const enquiries = (data?.interests ?? []).filter((i) => i.kind === "enquiry");

  const seed = savedProducts[0] ?? null;

  const { data: picks, isLoading: picksLoading } = useQuery({
    queryKey: ["buyer-picks", user?.id, seed?.id ?? "none"],
    enabled: Boolean(user) && !isLoading,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      const seenIds = new Set((data?.interests ?? []).map((i) => i.product_id));
      const candidates = ((rows ?? []) as Product[]).filter((p) => !seenIds.has(p.id));
      if (candidates.length === 0) return [] as Product[];
      if (!seed) return candidates.slice(0, 4);

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
        data: { current: compact(seed), candidates: candidates.map(compact), limit: 4 },
      });
      const byId = new Map(candidates.map((p) => [p.id, p]));
      const ranked = ids.map((id) => byId.get(id)).filter(Boolean) as Product[];
      return ranked.length ? ranked : candidates.slice(0, 4);
    },
  });

  const firstName = (profile?.full_name || "there").split(" ")[0];

  const stats = [
    { label: "Saved crafts", value: savedProducts.length, icon: Heart },
    { label: "Enquiries sent", value: enquiries.length, icon: MessageCircle },
    { label: "AI picks for you", value: picks?.length ?? 0, icon: Sparkles },
  ];

  return (
    <PageShell wide>
      <section className="card-surface animate-rise relative overflow-hidden p-8">
        <div className="bg-gradient-indigo pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-semibold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Everything you saved, every artisan you contacted, and fresh crafts chosen by AI from
            the pieces you like.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-warm border-0">
              <Link to="/">
                <Search className="mr-2 h-4 w-4" aria-hidden /> Browse the marketplace
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/artisans">
                <Store className="mr-2 h-4 w-4" aria-hidden /> Meet the artisans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-surface p-5">
            <Icon className="text-primary h-5 w-5" aria-hidden />
            <p className="mt-3 text-2xl font-semibold">{value}</p>
            <p className="text-muted-foreground text-sm">{label}</p>
          </div>
        ))}
      </section>

      {/* AI picks */}
      <section className="mt-12">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="text-primary h-5 w-5" aria-hidden /> Picked for you
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {seed
            ? "Based on the crafts you saved — matched on technique, material and price."
            : "Fresh arrivals from artisans. Save a few pieces and these become personal."}
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {picksLoading || isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))
            : (picks ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!picksLoading && !isLoading && (picks?.length ?? 0) === 0 && (
          <p className="text-muted-foreground mt-4 text-sm">
            No other products to suggest yet — check back as artisans add more.
          </p>
        )}
      </section>

      {/* Saved */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your saved crafts</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/saved">See all</Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="card-surface mt-5 p-10 text-center">
            <Heart className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
            <p className="text-muted-foreground mt-3 text-sm">
              Nothing saved yet. Tap the heart on any product to keep it here.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Start browsing</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {savedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Enquiries */}
      <section className="mt-12 mb-4">
        <h2 className="text-xl font-semibold">Your enquiries</h2>
        {isLoading ? (
          <Skeleton className="mt-5 h-32 rounded-2xl" />
        ) : enquiries.length === 0 ? (
          <div className="card-surface mt-5 p-10 text-center">
            <MessageCircle className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
            <p className="text-muted-foreground mt-3 text-sm">
              You have not messaged an artisan yet. Open any product and send your first enquiry.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {enquiries.map((enquiry) => {
              const product = data!.byId.get(enquiry.product_id);
              return (
                <li key={enquiry.id} className="card-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{product?.title ?? "Product"}</p>
                      {product && (
                        <p className="text-muted-foreground text-sm">
                          {product.category} ·{" "}
                          {formatPriceRange(product.price_min, product.price_max, product.currency)}
                        </p>
                      )}
                      {enquiry.message && (
                        <p className="mt-2 text-sm leading-relaxed">“{enquiry.message}”</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">
                        {new Date(enquiry.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/product/$id" params={{ id: enquiry.product_id }}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
