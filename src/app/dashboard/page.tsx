"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Country } from "@/types";
import ReactMarkdown from "react-markdown";
import { TaxChat } from "@/components/tax-chat";
import {
  Coins,
  Wallet,
  Upload,
  Brain,
  LogOut,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletResult, setWalletResult] = useState<string | null>(null);
  const [detectedChains, setDetectedChains] = useState<
    { chain: string; name: string; balance: number; tx_count: number }[]
  >([]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [exchange, setExchange] = useState<"binance" | "coinbase">("binance");
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  const [country, setCountry] = useState<Country>("ES");
  const [taxYear, setTaxYear] = useState(2025);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConnectWallet() {
    setWalletLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetectedChains(data.chains_detected);
      setWalletResult(
        `Connected! Found activity on ${data.chains_detected.length} chain${data.chains_detected.length !== 1 ? "s" : ""}. Imported ${data.transactions_imported} transactions.`
      );
      setWalletAddress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
    setWalletLoading(false);
  }

  async function handleUploadCSV() {
    if (!csvFile) return;
    setCsvLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("exchange", exchange);
      const res = await fetch("/api/csv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCsvResult(
        `Imported ${data.transactions_imported} transactions.${
          data.errors.length > 0
            ? ` ${data.errors.length} warnings.`
            : ""
        }`
      );
      setCsvFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload CSV");
    }
    setCsvLoading(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, tax_year: taxYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data.summary_markdown);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    }
    setAnalyzing(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold">
              CryptoTax<span className="text-emerald-400">EU</span>
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connect Wallet */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Connect Wallet</h2>
            </div>
            <input
              type="text"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm mb-3"
            />
            <button
              onClick={handleConnectWallet}
              disabled={walletLoading || !walletAddress}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {walletLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {walletLoading ? "Fetching..." : "Connect & Import"}
            </button>
            {walletResult && (
              <p className="text-sm text-emerald-400 mt-2">{walletResult}</p>
            )}
            {detectedChains.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {detectedChains.map((c) => (
                  <div
                    key={c.chain}
                    className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-zinc-800/50"
                  >
                    <span className="text-zinc-300">{c.name}</span>
                    <span className="text-zinc-500">
                      {c.balance.toFixed(4)} native &middot; {c.tx_count} txs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload CSV */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Upload CSV</h2>
            </div>
            <select
              value={exchange}
              onChange={(e) =>
                setExchange(e.target.value as "binance" | "coinbase")
              }
              className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="binance">Binance</option>
              <option value="coinbase">Coinbase</option>
            </select>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 mb-3"
            />
            <button
              onClick={handleUploadCSV}
              disabled={csvLoading || !csvFile}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {csvLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {csvLoading ? "Uploading..." : "Upload & Import"}
            </button>
            {csvResult && (
              <p className="text-sm text-emerald-400 mt-2">{csvResult}</p>
            )}
          </div>
        </div>

        {/* Analyze */}
        <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold">Generate Tax Report</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="ES">Spain</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Tax Year
              </label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {[2025, 2024, 2023, 2022].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                {analyzing ? "Analyzing..." : "Analyze with AI"}
              </button>
            </div>
          </div>
        </div>

        {/* Report */}
        {report && (
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Your Tax Report</h2>
            </div>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 prose-code:text-emerald-400 prose-hr:border-zinc-800">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Chat */}
        {report && (
          <TaxChat
            country={country}
            taxYear={taxYear}
            reportSummary={report}
          />
        )}
      </main>
    </div>
  );
}
