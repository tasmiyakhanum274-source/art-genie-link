import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-foreground font-semibold">ArtisanLink</span> — AI driven market
          linkage &amp; smart cataloging for artisans.
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/" className="hover:text-foreground">
            Marketplace
          </Link>
          <Link to="/artisans" className="hover:text-foreground">
            Artisans
          </Link>
          <Link to="/about" className="hover:text-foreground">
            How it works
          </Link>
        </nav>
      </div>
    </footer>
  );
}
