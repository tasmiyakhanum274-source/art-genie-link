import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { generateCatalog, type CatalogResult } from "@/lib/catalog.functions";
import { fileToDataUrl, formatPriceRange } from "@/lib/artisan";

export const Route = createFileRoute("/upload")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Add a product with AI — ArtisanLink" },
      {
        name: "description",
        content:
          "Upload one photo and the AI writes the title, description, category, tags, price range and four language versions.",
      },
      { property: "og:title", content: "Add a product with AI — ArtisanLink" },
      {
        property: "og:description",
        content: "One photo becomes a full marketplace listing in four languages.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <UploadPage />
    </RequireAuth>
  ),
});

function UploadPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const runCatalog = useServerFn(generateCatalog);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CatalogResult | null>(null);

  const pickFile = async (next: File | null) => {
    setResult(null);
    setFile(next);
    setPreview(next ? await fileToDataUrl(next) : null);
  };

  const analyse = async () => {
    if (!preview) return;
    setAnalysing(true);
    try {
      const data = await runCatalog({
        data: {
          imageDataUrl: preview,
          location: profile?.location ?? undefined,
          hint: hint.trim() || undefined,
        },
      });
      setResult(data);
      toast.success("Listing drafted — review and edit anything.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The AI could not read this photo.");
    } finally {
      setAnalysing(false);
    }
  };

  const save = async () => {
    if (!user || !file || !result) return;
    setSaving(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({
          artisan_id: user.id,
          title: result.title,
          description: result.description,
          category: result.category,
          craft_type: result.craft_type,
          materials: result.materials,
          tags: result.tags,
          price_min: result.price_min,
          price_max: result.price_max,
          image_url: path,
          location: profile?.location ?? null,
          ai_generated: true,
          status: "published",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      if (result.translations.length > 0) {
        await supabase.from("product_translations").insert(
          result.translations.map((t) => ({
            product_id: inserted.id,
            language: t.language,
            title: t.title,
            description: t.description,
            category: t.category,
          })),
        );
      }

      toast.success("Product published");
      void navigate({ to: "/product/$id", params: { id: inserted.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof CatalogResult>(key: K, value: CatalogResult[K]) =>
    setResult((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">Add a product</h1>
      <p className="text-muted-foreground mt-1">
        Take one clear photo. The AI writes the rest, in English, Hindi, Kannada and Tamil.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card-surface space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="photo">Product photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(event) => void pickFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {preview && (
            <img
              src={preview}
              alt="Selected product"
              className="aspect-4/3 w-full rounded-xl object-cover"
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="hint">Anything to add? (optional)</Label>
            <Textarea
              id="hint"
              rows={3}
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              placeholder="Size, material, how long it took to make..."
            />
          </div>

          <Button className="w-full" disabled={!preview || analysing} onClick={() => void analyse()}>
            {analysing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Reading your photo...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden /> Generate listing with AI
              </>
            )}
          </Button>
        </div>

        <div className="card-surface space-y-4 p-6">
          {!result ? (
            <div className="text-muted-foreground flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center text-sm">
              <Upload className="h-8 w-8 opacity-40" aria-hidden />
              Your generated listing will appear here, ready to edit.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Product name</Label>
                <Input
                  id="title"
                  value={result.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={result.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={result.category}
                    onChange={(event) => update("category", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="craft">Craft type</Label>
                  <Input
                    id="craft"
                    value={result.craft_type}
                    onChange={(event) => update("craft_type", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pmin">Lowest price (₹)</Label>
                  <Input
                    id="pmin"
                    type="number"
                    value={result.price_min}
                    onChange={(event) => update("price_min", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pmax">Highest price (₹)</Label>
                  <Input
                    id="pmax"
                    type="number"
                    value={result.price_max}
                    onChange={(event) => update("price_max", Number(event.target.value))}
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Suggested: {formatPriceRange(result.price_min, result.price_max)} —{" "}
                {result.price_reasoning}
              </p>
              <div className="space-y-2">
                <Label htmlFor="tags">Search tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={result.tags.join(", ")}
                  onChange={(event) =>
                    update(
                      "tags",
                      event.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materials">Materials (comma separated)</Label>
                <Input
                  id="materials"
                  value={result.materials.join(", ")}
                  onChange={(event) =>
                    update(
                      "materials",
                      event.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    )
                  }
                />
              </div>
              <Button className="w-full" disabled={saving} onClick={() => void save()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Publishing...
                  </>
                ) : (
                  "Publish product"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
