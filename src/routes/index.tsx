import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Sparkles, Languages, IndianRupee, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { CATEGORIES, type Product } from "@/lib/artisan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArtisanLink — Handmade crafts, catalogued by AI" },
      {
        name: "description",
        content:
          "Discover handmade crafts directly from artisans. Every listing is catalogued and priced with AI, in English, Hindi, Kannada and Tamil.",
      },
      { property: "og:title", content: "ArtisanLink — Handmade crafts, catalogued by AI" },
      {
        property: "og:description",
        content:
          "Browse handmade products from marginalized artisans and contact makers directly.",
      },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "price-low" | "price-high">("new");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState<string>("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const filtered = useMemo(() => {
    let list = products ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.title, p.description, p.category, p.craft_type ?? "", ...p.tags, ...p.materials]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (category) list = list.filter((p) => p.category === category);
    if (location !== "all") list = list.filter((p) => (p.location ?? "") === location);
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (minPrice.trim() && Number.isFinite(min)) {
      list = list.filter((p) => Number(p.price_max || p.price_min) >= min);
    }
    if (maxPrice.trim() && Number.isFinite(max)) {
      list = list.filter((p) => Number(p.price_min) <= max);
    }
    const sorted = [...list];
    if (sort === "price-low") sorted.sort((a, b) => Number(a.price_min) - Number(b.price_min));
    if (sort === "price-high") sorted.sort((a, b) => Number(b.price_max) - Number(a.price_max));
    return sorted;
  }, [products, search, category, sort, location, minPrice, maxPrice]);

  const locations = useMemo(() => {
    const set = new Set((products ?? []).map((p) => p.location).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtersActive =
    Boolean(category) || location !== "all" || minPrice.trim() !== "" || maxPrice.trim() !== "";

  const clearFilters = () => {
    setCategory(null);
    setLocation("all");
    setMinPrice("");
    setMaxPrice("");
  };

  const sortOptions = [
    ["new", t("home.sortNew")],
    ["price-low", t("home.sortLow")],
    ["price-high", t("home.sortHigh")],
  ] as const;

  return (
    <PageShell wide>
      {/* Hero */}
      <section className="card-surface animate-rise relative overflow-hidden p-8 sm:p-12">
        <div className="bg-gradient-warm pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {t("home.badge")}
          </span>
          <h1 className="mt-4 text-4xl leading-tight font-semibold sm:text-5xl">
            {t("home.titleA")} <span className="text-gradient-warm">{t("home.titleB")}</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">{t("home.lead")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-warm border-0">
              <Link to="/upload">{t("home.startSelling")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">{t("home.howItWorks")}</Link>
            </Button>
          </div>
          <div className="text-muted-foreground mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" aria-hidden /> {t("home.f1")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Languages className="text-primary h-4 w-4" aria-hidden /> {t("home.f2")}
            </span>
            <span className="inline-flex items-center gap-2">
              <IndianRupee className="text-primary h-4 w-4" aria-hidden /> {t("home.f3")}
            </span>
          </div>
        </div>
      </section>

      {/* Search + filters */}
      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="h-12 rounded-xl pl-9"
              aria-label={t("home.searchLabel")}
            />
          </div>
          <div className="flex gap-2">
            {sortOptions.map(([value, label]) => (
              <Button
                key={value}
                variant={sort === value ? "default" : "outline"}
                onClick={() => setSort(value)}
                className="h-12 rounded-xl"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={category === null ? "secondary" : "ghost"}
            onClick={() => setCategory(null)}
            className="rounded-full"
          >
            {t("home.allCrafts")}
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "secondary" : "ghost"}
              onClick={() => setCategory(c)}
              className="rounded-full"
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{t("home.price")}</span>
            <Input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder={t("home.min")}
              aria-label={t("home.min")}
              className="h-10 w-24 rounded-xl"
            />
            <span className="text-muted-foreground text-sm">{t("home.to")}</span>
            <Input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder={t("home.max")}
              aria-label={t("home.max")}
              className="h-10 w-24 rounded-xl"
            />
          </div>

          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-10 w-56 rounded-xl" aria-label={t("home.allLocations")}>
              <SelectValue placeholder={t("home.allLocations")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("home.allLocations")}</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full">
              {t("home.clearFilters")}
            </Button>
          )}
          <span className="text-muted-foreground ml-auto text-sm">
            {filtered.length} {filtered.length === 1 ? t("home.productOne") : t("home.products")}
          </span>
        </div>
      </section>

      {/* Grid */}
      <section className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 p-14 text-center">
            <Store className="text-muted-foreground h-10 w-10" aria-hidden />
            <h2 className="text-lg font-semibold">{t("home.emptyTitle")}</h2>
            <p className="text-muted-foreground max-w-sm text-sm">{t("home.emptyBody")}</p>
            <Button asChild className="bg-gradient-warm mt-2 border-0">
              <Link to="/upload">{t("home.emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
