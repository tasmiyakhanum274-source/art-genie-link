import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — ArtisanLink" },
      {
        name: "description",
        content:
          "Create an ArtisanLink account as an artisan to list crafts with AI, or as a buyer to discover handmade products.",
      },
      { property: "og:title", content: "Sign in or join — ArtisanLink" },
      { property: "og:description", content: "Join ArtisanLink as an artisan or a buyer." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"artisan" | "buyer">("artisan");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSignupSent(true);
      toast.success("Check your email to confirm your account.");
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <span className="bg-gradient-warm text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
          <Palette className="h-5 w-5" aria-hidden />
        </span>
        <span className="font-display text-xl font-semibold">ArtisanLink</span>
      </Link>

      <div className="card-surface animate-rise w-full max-w-md p-6 sm:p-8">
        {signupSent ? (
          <div className="space-y-3 text-center">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to <span className="font-medium">{email}</span>. Open it
              to activate your account, then sign in.
            </p>
            <Button variant="outline" onClick={() => setSignupSent(false)} className="mt-2">
              Back to sign in
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-gradient-warm w-full border-0"
                  size="lg"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Lakshmi Devi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am joining as</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as "artisan" | "buyer")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="role-artisan"
                      className="hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm"
                    >
                      <RadioGroupItem value="artisan" id="role-artisan" /> Artisan
                    </Label>
                    <Label
                      htmlFor="role-buyer"
                      className="hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm"
                    >
                      <RadioGroupItem value="buyer" id="role-buyer" /> Buyer
                    </Label>
                  </RadioGroup>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-gradient-warm w-full border-0"
                  size="lg"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {!signupSent && (
          <>
            <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" size="lg" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
