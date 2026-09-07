import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Sparkles, Languages, IndianRupee, Store, BellRing } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How ArtisanLink works — from photo to buyer" },
      {
        name: "description",
        content:
          "One photo becomes a full product listing: AI writes the description, picks the category, suggests a price range and translates it into four languages.",
      },
      { property: "og:title", content: "How ArtisanLink works — from photo to buyer" },
      {
        property: "og:description",
        content: "AI cataloging, translation and price guidance for artisans.",
      },
    ],
  }),
  component: AboutPage,
});

const steps = [
  {
    icon: Camera,
    title: "Photograph the craft",
    body: "The artisan takes one clear photo on any phone. No typing, no forms, no English needed.",
  },
  {
    icon: Sparkles,
    title: "AI reads the product",
    body: "Vision AI identifies the craft, materials and technique, then writes a market-ready title, description, category and search tags.",
  },
  {
    icon: IndianRupee,
    title: "Fair price guidance",
    body: "A price range is estimated from craft type, materials, complexity, size, labour and region — so nobody undersells their work.",
  },
  {
    icon: Languages,
    title: "Four languages",
    body: "Every listing is stored in English, Hindi, Kannada and Tamil so artisans read it in their language and buyers search in theirs.",
  },
  {
    icon: Store,
    title: "Buyers discover it",
    body: "Listings appear in the marketplace with search, category filters and artisan profiles.",
  },
  {
    icon: BellRing,
    title: "Direct connection",
    body: "When a buyer saves a product or sends an enquiry, the artisan is notified instantly — no middleman.",
  },
];

function AboutPage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold">How ArtisanLink works</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Most artisans cannot write English product pages, do not know marketplace categories and
          have no reference for pricing. ArtisanLink removes all three barriers with a single
          photograph.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="card-surface animate-rise p-6">
            <span className="bg-gradient-warm text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl">
              <step.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-muted-foreground mt-4 text-xs font-medium">STEP {index + 1}</p>
            <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{step.body}</p>
          </article>
        ))}
      </div>

      <section className="card-surface mt-10 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Ready to list your craft?</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a free account, upload one photo, and review what the AI writes for you.
          </p>
        </div>
        <Button asChild size="lg" className="bg-gradient-warm border-0">
          <Link to="/auth">Get started</Link>
        </Button>
      </section>
    </PageShell>
  );
}
