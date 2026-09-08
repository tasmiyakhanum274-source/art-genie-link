import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Eye, Heart, Package, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/lib/artisan";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your dashboard — ArtisanLink" },
      {
        name: "description",
        content: "Track your listings, views, buyer interest and notifications in one place.",
      },
      { property: "og:title", content: "Your dashboard — ArtisanLink" },
      {
        property: "og:description",
        content: "Listings, views, buyer interest and notifications at a glance.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [{ data: products }, { count: interest }, { count: unread }] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("artisan_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("buyer_interest")
          .select("id", { count: "exact", head: true })
          .eq("artisan_id", user!.id),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("is_read", false),
      ]);
      const list = (products ?? []) as Product[];
      return {
        products: list,
        views: list.reduce((sum, item) => sum + (item.views ?? 0), 0),
        interest: interest ?? 0,
        unread: unread ?? 0,
      };
    },
  });

  const stats = [
    { label: t("dash.products"), value: data?.products.length ?? 0, icon: Package },
    { label: t("dash.views"), value: data?.views ?? 0, icon: Eye },
    { label: t("dash.interest"), value: data?.interest ?? 0, icon: Heart },
    { label: t("dash.unread"), value: data?.unread ?? 0, icon: Bell },
  ];

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            {t("dash.greeting")}
            {profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">{t("dash.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> {t("dash.addProduct")}
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <stat.icon className="text-primary h-5 w-5" aria-hidden />
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("dash.latest")}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/my-products">{t("dash.manageAll")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (data?.products.length ?? 0) === 0 ? (
        <div className="card-surface mt-4 p-10 text-center">
          <p className="text-muted-foreground">{t("dash.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/upload">{t("dash.emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data!.products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
