/**
 * AI cataloging server functions.
 * Runs on the server so the AI gateway key is never exposed to the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODEL = "google/gemini-3.7-flash";

const inputSchema = z.object({
  imageDataUrl: z.string().min(32),
  location: z.string().optional(),
  hint: z.string().optional(),
});

export type CatalogResult = {
  title: string;
  seo_title: string;
  description: string;
  category: string;
  craft_type: string;
  materials: string[];
  tags: string[];
  price_min: number;
  price_max: number;
  price_reasoning: string;
  translations: { language: string; title: string; description: string; category: string }[];
};

const SYSTEM_PROMPT = `You are an expert Indian handicraft cataloguer and market pricing analyst helping marginalized artisans sell online.
Look at the product photo and produce a marketplace-ready listing.

Rules:
- title: appealing, 3-8 words, no ALL CAPS.
- seo_title: search-friendly, under 70 characters, includes craft + material + use.
- description: 60-110 words, warm and factual, mentions craft technique, material, finish and typical use. Never invent an artisan's name.
- category: pick the closest of: Textiles & Weaving, Pottery & Ceramics, Woodcraft, Metalwork, Jewellery, Painting & Art, Bamboo & Cane, Leathercraft, Stone Carving, Home Decor.
- craft_type: the specific traditional craft if recognisable (e.g. Channapatna lacquerware, Ikat weaving, Terracotta).
- materials: 1-5 short material names.
- tags: 5-8 lowercase search tags.
- price_min / price_max: a realistic Indian retail price range in INR (whole numbers), based on craft type, materials, visible complexity, size, labour hours and region. price_max must be greater than price_min.
- price_reasoning: one short sentence explaining the estimate.
- translations: the same title, description and category rendered in language codes en, hi, kn and ta (English, Hindi, Kannada, Tamil). Use natural native script, not transliteration.

Reply with ONLY a JSON object, no markdown fences.`;

export const generateCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<CatalogResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const context = [
      data.location ? `Artisan location: ${data.location}.` : "",
      data.hint ? `Artisan note about the product: ${data.hint}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Catalogue this handmade product. ${context}`.trim(),
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (response.status === 429) {
      throw new Error("Too many requests right now. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits are exhausted. Please top up the workspace to continue.");
    }
    if (!response.ok) {
      const detail = await response.text();
      console.error("AI gateway error", response.status, detail);
      throw new Error("The AI could not read this photo. Please try another image.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      console.error("Unparsable AI output", raw.slice(0, 500));
      throw new Error("The AI reply could not be read. Please try again.");
    }

    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v.trim() : fallback);
    const num = (v: unknown, fallback = 0) => {
      const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? Math.round(n) : fallback;
    };
    const list = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 8) : [];

    const priceMin = num(parsed["price_min"], 300);
    const priceMaxRaw = num(parsed["price_max"], 0);
    const priceMax = priceMaxRaw > priceMin ? priceMaxRaw : Math.round(priceMin * 1.4);

    const rawTranslations = Array.isArray(parsed["translations"]) ? parsed["translations"] : [];
    const translations = rawTranslations
      .map((t) => {
        const item = (t ?? {}) as Record<string, unknown>;
        return {
          language: str(item["language"]).toLowerCase().slice(0, 2),
          title: str(item["title"]),
          description: str(item["description"]),
          category: str(item["category"]),
        };
      })
      .filter((t) => ["en", "hi", "kn", "ta"].includes(t.language) && t.title);

    return {
      title: str(parsed["title"], "Handmade craft piece"),
      seo_title: str(parsed["seo_title"], str(parsed["title"], "Handmade craft piece")),
      description: str(parsed["description"]),
      category: str(parsed["category"], "Home Decor"),
      craft_type: str(parsed["craft_type"]),
      materials: list(parsed["materials"]),
      tags: list(parsed["tags"]).map((t) => t.toLowerCase()),
      price_min: priceMin,
      price_max: priceMax,
      price_reasoning: str(parsed["price_reasoning"]),
      translations,
    };
  });
