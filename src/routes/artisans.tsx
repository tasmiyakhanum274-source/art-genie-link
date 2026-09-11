import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import type { Profile } from "@/lib/artisan";

export const Route = createFileRoute("/artisans")({
  head: () => ({
    meta: [
      { title: "Meet the artisans — ArtisanLink" },
      {
        name: "description",
        content:
          "Browse the makers behind the crafts: their region, speciality and the products they list on ArtisanLink.",
      },
      { property: "og:title", content: "Meet the artisans — ArtisanLink" },
      {
        property: "og:description",
        content: "Discover craftspeople by region and speciality, and contact them directly.",
      },
    ],
  }),
  component: ArtisansPage,
});

function ArtisansPage() {
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["artisan-directory"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "artisan")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (profiles ?? []) as Profile[];
    },
  });

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">{t("artisans.title")}</h1>
      <p className="text-muted-foreground mt-2">{t("artisans.lead")}</p>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="card-surface text-muted-foreground mt-8 p-10 text-center">
          {t("artisans.empty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((artisan) => (
            <Link
              key={artisan.id}
              to="/artisan/$id"
              params={{ id: artisan.id }}
              className="card-surface animate-rise p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center gap-3">
                <span className="bg-gradient-indigo text-accent-foreground flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold">
                  {(artisan.full_name || "A").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">
                    {artisan.full_name || t("artisans.defaultName")}
                  </h2>
                  <p className="text-muted-foreground truncate text-sm">
                    {artisan.craft_specialty || t("artisans.defaultCraft")}
                  </p>
                </div>
              </div>
              {artisan.location && (
                <p className="text-muted-foreground mt-3 inline-flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {artisan.location}
                </p>
              )}
              {artisan.bio && (
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{artisan.bio}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
