import { Coins } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Coins className="h-5 w-5" />
          <span className="text-sm">
            CryptoTax EU &mdash; AI-powered crypto tax reports
          </span>
        </div>
        <p className="text-xs text-zinc-600">
          Not financial or tax advice. Always consult a qualified tax professional.
        </p>
      </div>
    </footer>
  );
}
