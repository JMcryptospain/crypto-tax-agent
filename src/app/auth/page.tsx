"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Coins, Mail, Lock, UserRound } from "lucide-react";
import Link from "next/link";

type AuthMode = "magic-link" | "password";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://crypto-tax-agent-production.up.railway.app/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  }

  async function handleGuest() {
    setGuestLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
      setGuestLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  const anyLoading = loading || guestLoading;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Coins className="h-7 w-7 text-emerald-400" />
          <span className="text-xl font-semibold tracking-tight">
            CryptoTax<span className="text-emerald-400">EU</span>
          </span>
        </Link>

        {sent ? (
          <div className="text-center p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <Mail className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-zinc-400">
              We sent a magic link to <strong className="text-zinc-200">{email}</strong>.
              Click it to sign in.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <h2 className="text-lg font-semibold mb-1">Welcome</h2>
            <p className="text-sm text-zinc-500 mb-5">
              {mode === "password"
                ? isSignUp
                  ? "Create an account to get started."
                  : "Sign in to your account."
                : "Sign in with a magic link — no password needed."}
            </p>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-zinc-800/50 mb-5">
              <button
                type="button"
                onClick={() => { setMode("password"); setError(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  mode === "password"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Lock className="h-3 w-3" /> Email & password
              </button>
              <button
                type="button"
                onClick={() => { setMode("magic-link"); setError(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  mode === "magic-link"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Mail className="h-3 w-3" /> Magic link
              </button>
            </div>

            <form onSubmit={mode === "password" ? handlePassword : handleMagicLink}>
              <label className="block text-sm text-zinc-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm mb-3"
              />

              {mode === "password" && (
                <>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm mb-4"
                  />
                </>
              )}

              {error && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition disabled:opacity-50"
              >
                {loading
                  ? mode === "magic-link"
                    ? "Sending..."
                    : isSignUp
                      ? "Creating account..."
                      : "Signing in..."
                  : mode === "magic-link"
                    ? "Send magic link"
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
              </button>

              {mode === "password" && (
                <p className="text-center text-xs text-zinc-500 mt-3">
                  {isSignUp ? "Already have an account?" : "Don\u2019t have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    className="text-emerald-400 hover:text-emerald-300 transition"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              )}
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900/30 px-2 text-zinc-600">or</span>
              </div>
            </div>

            <button
              type="button"
              disabled={anyLoading}
              onClick={handleGuest}
              className="w-full py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserRound className="h-4 w-4" />
              {guestLoading ? "Signing in..." : "Continue as guest"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
