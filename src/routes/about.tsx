import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Sparkles, Languages, IndianRupee, Store, BellRing } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

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
  { icon: Camera, title: "about.s1t", body: "about.s1b" },
  { icon: Sparkles, title: "about.s2t", body: "about.s2b" },
  { icon: IndianRupee, title: "about.s3t", body: "about.s3b" },
  { icon: Languages, title: "about.s4t", body: "about.s4b" },
  { icon: Store, title: "about.s5t", body: "about.s5b" },
  { icon: BellRing, title: "about.s6t", body: "about.s6b" },
] as const;

function AboutPage() {
  const { t } = useLanguage();

  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold">{t("about.title")}</h1>
        <p className="text-muted-foreground mt-3 text-lg">{t("about.lead")}</p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="card-surface animate-rise p-6">
            <span className="bg-gradient-warm text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl">
              <step.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-muted-foreground mt-4 text-xs font-medium">
              {t("about.step")} {index + 1}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{t(step.title)}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{t(step.body)}</p>
          </article>
        ))}
      </div>

      <section className="card-surface mt-10 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("about.ctaTitle")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("about.ctaBody")}</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-warm border-0">
          <Link to="/auth">{t("about.ctaBtn")}</Link>
        </Button>
      </section>
    </PageShell>
  );
}
