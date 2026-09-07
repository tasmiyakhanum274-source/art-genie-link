import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Client-side gate: shows a sign-in prompt when there is no session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="card-surface mx-auto max-w-md p-10 text-center">
          <h1 className="text-2xl font-semibold">Please sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You need an account to open this page.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Sign in or create an account</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return <>{children}</>;
}
