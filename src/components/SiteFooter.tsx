import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-12 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-foreground font-semibold">ArtisanLink</span> — {t("footer.tagline")}
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/" className="hover:text-foreground">
            {t("nav.marketplace")}
          </Link>
          <Link to="/artisans" className="hover:text-foreground">
            {t("nav.artisans")}
          </Link>
          <Link to="/about" className="hover:text-foreground">
            {t("nav.about")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
