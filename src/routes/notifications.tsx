import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — ArtisanLink" },
      { name: "description", content: "Buyer saves, enquiries and updates about your listings." },
      { property: "og:title", content: "Notifications — ArtisanLink" },
      { property: "og:description", content: "Buyer saves, enquiries and listing updates." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  ),
});

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return rows ?? [];
    },
  });

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    void queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
  };

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
          Mark all as read
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="card-surface text-muted-foreground mt-8 p-10 text-center">
          Nothing here yet. Buyer activity will show up on this page.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {data!.map((item) => (
            <div
              key={item.id}
              className={`card-surface flex gap-3 p-4 ${item.is_read ? "opacity-70" : ""}`}
            >
              <Bell className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{item.title}</p>
                {item.body && <p className="text-muted-foreground text-sm">{item.body}</p>}
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(item.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
