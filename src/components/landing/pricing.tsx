import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Try it out with a small portfolio",
    features: [
      "Up to 50 transactions",
      "1 wallet connection",
      "1 CSV upload",
      "Basic tax report",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "49",
    period: "per tax year",
    description: "For active traders and DeFi users",
    features: [
      "Unlimited transactions",
      "Unlimited wallets",
      "Unlimited CSV uploads",
      "Detailed AI report with optimization tips",
      "Multi-country support",
      "Report export (PDF)",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          Pay per tax year, not per month. No subscriptions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-xl border ${
                plan.highlighted
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-zinc-800/50 bg-zinc-900/20"
              }`}
            >
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-zinc-500 ml-1">
                  EUR {plan.period && `/ ${plan.period}`}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                className={`block text-center py-2.5 rounded-lg font-medium text-sm transition ${
                  plan.highlighted
                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    : "border border-zinc-700 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
