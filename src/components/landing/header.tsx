"use client";

import Link from "next/link";
import { Coins } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">
            CryptoTax<span className="text-emerald-400">EU</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how-it-works" className="hover:text-zinc-100 transition">
            How it works
          </a>
          <a href="#countries" className="hover:text-zinc-100 transition">
            Countries
          </a>
          <a href="#pricing" className="hover:text-zinc-100 transition">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition"
          >
            Log in
          </Link>
          <Link
            href="/auth"
            className="text-sm px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
