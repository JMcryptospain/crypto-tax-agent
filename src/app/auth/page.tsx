"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Mail } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

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
          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
          >
            <h2 className="text-lg font-semibold mb-1">Welcome</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Sign in with a magic link — no password needed.
            </p>

            <label className="block text-sm text-zinc-400 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm mb-4"
            />

            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
