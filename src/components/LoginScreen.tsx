import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { NotebookPen, Eye, EyeOff, ArrowLeft, MailCheck } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

export function LoginScreen() {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
      } else if (mode === "signup") {
        const { error, needsConfirm } = await signUp(email, password);
        if (error) toast.error(error);
        else if (needsConfirm) {
          setSentTo(email);
          toast.success("Check your inbox to verify your email.");
        } else {
          toast.success("Account created. You're signed in.");
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) toast.error(error);
        else {
          setSentTo(email);
          toast.success("Password reset email sent.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
          <MailCheck className="size-10 text-primary mx-auto mb-3" />
          <h2 className="font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a {mode === "forgot" ? "password reset" : "verification"} link to{" "}
            <span className="font-medium text-foreground">{sentTo}</span>.
          </p>
          <Button
            variant="outline"
            className="mt-5 w-full"
            onClick={() => {
              setSentTo(null);
              setMode("signin");
              setPassword("");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </Shell>
    );
  }

  const title =
    mode === "signin"
      ? "Sign in to your notes"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

  return (
    <Shell title={title}>
      <form
        onSubmit={onSubmit}
        className="space-y-4 bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm"
      >
        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Back
          </button>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            We recommend using a{" "}
            <a
              href="https://duckduckgo.com/email/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              duck email
            </a>
            .
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Sign up"
                : "Send reset link"}
        </Button>

        {mode !== "forgot" && (
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        )}
      </form>
    </Shell>
  );
}

function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <NotebookPen className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">yes jnn</h1>
          {title && <p className="text-sm text-muted-foreground mt-1 text-center">{title}</p>}
        </div>
        {children}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Based on{" "}
          <a
            href="https://github.com/laurent22/joplin"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Joplin
          </a>
          {" • "}
          <Link to="/about" className="underline hover:text-foreground">
            About
          </Link>
        </p>
      </div>
    </div>
  );
}
