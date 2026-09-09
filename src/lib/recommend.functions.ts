/**
 * AI related-product recommendations.
 * The browser sends a compact candidate list; the model ranks it server-side.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.7-flash";

const candidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  craft_type: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  price_min: z.number(),
  location: z.string().nullable().optional(),
});

const inputSchema = z.object({
  current: candidateSchema,
  candidates: z.array(candidateSchema).max(40),
  limit: z.number().min(1).max(8).default(4),
});

type Candidate = z.infer<typeof candidateSchema>;

/** Deterministic fallback so the section always shows something useful. */
function heuristicRank(current: Candidate, candidates: Candidate[], limit: number) {
  const score = (c: Candidate) => {
    let s = 0;
    if (c.category === current.category) s += 4;
    if (c.craft_type && c.craft_type === current.craft_type) s += 3;
    s += c.tags.filter((t) => current.tags.includes(t)).length;
    s += c.materials.filter((m) => current.materials.includes(m)).length;
    if (c.location && c.location === current.location) s += 1;
    const gap = Math.abs(c.price_min - current.price_min);
    s += gap < Math.max(200, current.price_min * 0.4) ? 2 : 0;
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a)).slice(0, limit).map((c) => c.id);
}

export const recommendRelated = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ids: string[] }> => {
    const { current, candidates, limit } = data;
    if (candidates.length === 0) return { ids: [] };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ids: heuristicRank(current, candidates, limit) };

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You recommend handmade Indian craft products a shopper would also like. " +
                `Pick the ${limit} best matches from the candidate list, considering craft type, materials, style, use and a comparable price. ` +
                'Reply with ONLY JSON: {"ids": ["<candidate id>", ...]} using ids from the list, best first.',
            },
            {
              role: "user",
              content: JSON.stringify({ viewing: current, candidates }),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) return { ids: heuristicRank(current, candidates, limit) };

      const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = (payload.choices?.[0]?.message?.content ?? "")
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      const parsed = JSON.parse(raw) as { ids?: unknown };
      const valid = new Set(candidates.map((c) => c.id));
      const ids = Array.isArray(parsed.ids)
        ? parsed.ids.map(String).filter((id) => valid.has(id)).slice(0, limit)
        : [];
      return { ids: ids.length ? ids : heuristicRank(current, candidates, limit) };
    } catch (error) {
      console.error("Recommendation failed", error);
      return { ids: heuristicRank(current, candidates, limit) };
    }
  });
