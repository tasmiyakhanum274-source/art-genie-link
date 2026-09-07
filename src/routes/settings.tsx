import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, LANGUAGES } from "@/lib/artisan";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile settings — ArtisanLink" },
      {
        name: "description",
        content: "Update your name, phone, village or city, craft speciality and preferred language.",
      },
      { property: "og:title", content: "Profile settings — ArtisanLink" },
      { property: "og:description", content: "Update your details and preferred language." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    craft_specialty: "",
    bio: "",
    preferred_language: "en",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      craft_specialty: profile.craft_specialty ?? "",
      bio: profile.bio ?? "",
      preferred_language: profile.preferred_language ?? "en",
    });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile updated");
  };

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">Profile settings</h1>

      <div className="card-surface mt-6 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Village or city</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="craft">Craft speciality</Label>
            <Select
              value={form.craft_specialty || undefined}
              onValueChange={(value) => setForm({ ...form, craft_specialty: value })}
            >
              <SelectTrigger id="craft">
                <SelectValue placeholder="Choose your craft" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Preferred language</Label>
            <Select
              value={form.preferred_language}
              onValueChange={(value) => setForm({ ...form, preferred_language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">About you</Label>
          <Textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Your craft tradition, years of experience, your family workshop..."
          />
        </div>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </PageShell>
  );
}
