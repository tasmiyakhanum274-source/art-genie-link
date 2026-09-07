import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

/** Standard page frame: header, content column, footer. */
export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      <AppHeader />
      <main className={`mx-auto w-full flex-1 px-4 py-8 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
