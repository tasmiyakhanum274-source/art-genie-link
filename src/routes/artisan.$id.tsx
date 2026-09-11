import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import type { Product, Profile } from "@/lib/artisan";

export const Route = createFileRoute("/artisan/$id")({
  head: () => ({
    meta: [
      { title: "Artisan profile — ArtisanLink" },
      {
        name: "description",
        content: "Meet the maker: their craft speciality, region, story and every product they list.",
      },
      { property: "og:title", content: "Artisan profile — ArtisanLink" },
      {
        property: "og:description",
        content: "Craft speciality, region, story and full product list for this maker.",
      },
    ],
  }),
  component: ArtisanProfilePage,
});

function ArtisanProfilePage() {
  const { id } = Route.useParams();
  const { t } = useLanguage();


  const { data, isLoading } = useQuery({
    queryKey: ["artisan-profile", id],
    queryFn: async () => {
      const [{ data: profile }, { data: products }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("products")
          .select("*")
          .eq("artisan_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
      ]);
      return {
        profile: (profile as Profile) ?? null,
        products: (products ?? []) as Product[],
      };
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </PageShell>
    );
  }

  if (!data?.profile) {
    return (
      <PageShell>
        <div className="card-surface mx-auto max-w-md p-10 text-center">
          <h1 className="text-2xl font-semibold">{t("artisans.notFound")}</h1>
          <Button asChild className="mt-6">
            <Link to="/artisans">{t("artisans.browseAll")}</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const { profile, products } = data;

  return (
    <PageShell wide>
      <section className="card-surface p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">{profile.full_name}</h1>
        <p className="text-muted-foreground mt-1">
          {profile.craft_specialty ?? t("artisans.defaultCraft")}
        </p>
        <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
          {profile.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden /> {profile.location}
            </span>
          )}
          {profile.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-4 w-4" aria-hidden /> {profile.phone}
            </span>
          )}
        </div>
        {profile.bio && <p className="mt-4 max-w-3xl text-sm leading-relaxed">{profile.bio}</p>}
      </section>

      <h2 className="mt-10 text-xl font-semibold">
        {t("artisans.productsBy")} {profile.full_name}
      </h2>
      {products.length === 0 ? (
        <p className="card-surface text-muted-foreground mt-4 p-10 text-center">
          {t("artisans.noProducts")}
        </p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
