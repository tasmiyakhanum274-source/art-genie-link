import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES, formatPriceRange, type Product, type Profile, type Translation } from "@/lib/artisan";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Handmade product — ArtisanLink" },
      {
        name: "description",
        content:
          "Full details of a handmade craft piece: materials, craft technique, price range and the artisan behind it.",
      },
      { property: "og:title", content: "Handmade product — ArtisanLink" },
      {
        property: "og:description",
        content: "Materials, craft technique, price range and direct contact with the maker.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!product) return null;

      const [{ data: artisan }, { data: translations }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", product.artisan_id).maybeSingle(),
        supabase.from("product_translations").select("*").eq("product_id", id),
      ]);

      return {
        product: product as Product,
        artisan: (artisan as Profile) ?? null,
        translations: (translations ?? []) as Translation[],
      };
    },
  });

  useEffect(() => {
    void supabase.rpc("increment_product_views", { _product_id: id });
  }, [id]);

  const { data: saved } = useQuery({
    queryKey: ["saved", id, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("buyer_interest")
        .select("id")
        .eq("product_id", id)
        .eq("buyer_id", user!.id)
        .eq("kind", "save");
      return (rows?.length ?? 0) > 0;
    },
  });

  const record = async (kind: "save" | "enquiry", text?: string) => {
    if (!user || !data?.product) {
      toast.error("Please sign in first.");
      return;
    }
    const { error } = await supabase.from("buyer_interest").insert({
      product_id: data.product.id,
      artisan_id: data.product.artisan_id,
      buyer_id: user.id,
      kind,
      message: text ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["saved", id, user.id] });
    void queryClient.invalidateQueries({ queryKey: ["saved-products"] });
    toast.success(kind === "save" ? "Saved to your list" : "Message sent to the artisan");
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-4/3 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data?.product) {
    return (
      <PageShell>
        <div className="card-surface mx-auto max-w-md p-10 text-center">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back to the marketplace</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const { product, artisan, translations } = data;

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="card-surface overflow-hidden">
          <ProductImage
            path={product.image_url}
            alt={product.title}
            className="aspect-4/3 h-full w-full"
          />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {product.category}
              {product.craft_type ? ` · ${product.craft_type}` : ""}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{product.title}</h1>
            <p className="text-primary mt-2 text-2xl font-semibold">
              {formatPriceRange(product.price_min, product.price_max, product.currency)}
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" aria-hidden /> {product.views} views
            </span>
            {product.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden /> {product.location}
              </span>
            )}
            {product.ai_generated && (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-4 w-4" aria-hidden /> AI catalogued
              </span>
            )}
          </div>

          <Tabs defaultValue="en">
            <TabsList>
              {LANGUAGES.map((lang) => (
                <TabsTrigger key={lang.code} value={lang.code}>
                  {lang.native}
                </TabsTrigger>
              ))}
            </TabsList>
            {LANGUAGES.map((lang) => {
              const t = translations.find((row) => row.language === lang.code);
              return (
                <TabsContent key={lang.code} value={lang.code} className="pt-4">
                  <h2 className="text-lg font-medium">{t?.title ?? product.title}</h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {t?.description ?? product.description}
                  </p>
                </TabsContent>
              );
            })}
          </Tabs>

          {product.materials.length > 0 && (
            <div>
              <p className="text-sm font-medium">Materials</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.materials.map((m) => (
                  <Badge key={m} variant="secondary" className="font-normal">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {artisan && (
            <div className="card-surface flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{artisan.full_name}</p>
                <p className="text-muted-foreground text-sm">
                  {artisan.craft_specialty ?? "Artisan"}
                  {artisan.location ? ` · ${artisan.location}` : ""}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/artisan/$id" params={{ id: artisan.id }}>
                  View profile
                </Link>
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant={saved ? "secondary" : "default"}
              onClick={() => void record("save")}
              disabled={Boolean(saved)}
            >
              <Heart className="mr-2 h-4 w-4" aria-hidden />
              {saved ? "Saved" : "Save this product"}
            </Button>
          </div>

          <div className="card-surface space-y-3 p-4">
            <p className="inline-flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" aria-hidden /> Contact the artisan
            </p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell the artisan what you are looking for, quantity and delivery city."
              rows={3}
            />
            <Button
              disabled={sending || message.trim().length < 5}
              onClick={async () => {
                setSending(true);
                await record("enquiry", message.trim());
                setMessage("");
                setSending(false);
              }}
            >
              Send enquiry
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
