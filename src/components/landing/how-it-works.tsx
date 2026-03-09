import { Wallet, Upload, Brain, FileText } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect your wallet",
    description:
      "Paste your wallet address and we auto-detect activity across Ethereum, Arbitrum, Optimism, Base, Polygon, and Taiko.",
  },
  {
    icon: Upload,
    step: "02",
    title: "Upload exchange CSVs",
    description:
      "Export your transaction history from Binance or Coinbase and upload the CSV files.",
  },
  {
    icon: Brain,
    step: "03",
    title: "AI analyzes everything",
    description:
      "Our AI agent classifies transactions, calculates cost basis, and applies your country's tax rules.",
  },
  {
    icon: FileText,
    step: "04",
    title: "Get your tax report",
    description:
      "Receive a detailed report with your tax liability, breakdown by asset, and optimization tips.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          From wallet to tax report in four simple steps. No accounting degree
          required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20 group hover:border-emerald-500/30 transition"
            >
              <span className="text-5xl font-bold text-zinc-800/50 absolute top-4 right-6">
                {item.step}
              </span>
              <item.icon className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
