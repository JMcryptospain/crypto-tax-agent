import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6">
      {/* Gradient background effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Now supporting Spain, France & Germany
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.1] mb-6">
          AI-powered crypto tax
          <br />
          <span className="text-emerald-400">reports for Europe</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 text-balance">
          Connect your wallets, upload exchange CSVs, and let our AI agent
          analyze your transactions, calculate your tax liability, and suggest
          optimizations — all in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-base transition"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-base transition"
          >
            See how it works
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
          {[
            {
              icon: Zap,
              title: "AI-Powered Analysis",
              desc: "Claude AI classifies every transaction and calculates your exact tax liability.",
            },
            {
              icon: Globe,
              title: "Country-Specific Rules",
              desc: "Precise tax calculations for Spain, France, and Germany — each with unique rules.",
            },
            {
              icon: Shield,
              title: "Optimization Tips",
              desc: "Get personalized suggestions to legally minimize your crypto tax burden.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
            >
              <feature.icon className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
