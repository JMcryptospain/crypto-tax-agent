import Papa from "papaparse";
import { Transaction } from "@/types";

interface BinanceRow {
  UTC_Time: string;
  Account: string;
  Operation: string;
  Coin: string;
  Change: string;
  Remark: string;
}

interface CoinbaseRow {
  Timestamp: string;
  "Transaction Type": string;
  Asset: string;
  "Quantity Transacted": string;
  "EUR Spot Price at Transaction": string;
  "EUR Subtotal": string;
  "EUR Total (inclusive of fees)": string;
  "EUR Fees": string;
  Notes: string;
}

function mapBinanceOperation(op: string): Transaction["type"] {
  const normalized = op.toLowerCase();
  if (normalized.includes("buy")) return "buy";
  if (normalized.includes("sell")) return "sell";
  if (normalized.includes("swap")) return "swap";
  if (normalized.includes("staking") || normalized.includes("interest"))
    return "staking_reward";
  if (normalized.includes("deposit") || normalized.includes("withdraw"))
    return "transfer";
  if (normalized.includes("airdrop") || normalized.includes("distribution"))
    return "airdrop";
  return "unknown";
}

function mapCoinbaseType(type: string): Transaction["type"] {
  const normalized = type.toLowerCase();
  if (normalized === "buy") return "buy";
  if (normalized === "sell") return "sell";
  if (normalized === "convert") return "swap";
  if (normalized.includes("staking") || normalized.includes("reward"))
    return "staking_reward";
  if (normalized === "send" || normalized === "receive") return "transfer";
  if (normalized.includes("airdrop")) return "airdrop";
  return "unknown";
}

export function parseBinanceCSV(
  csvContent: string,
  userId: string
): { transactions: Omit<Transaction, "id">[]; errors: string[] } {
  const errors: string[] = [];
  const result = Papa.parse<BinanceRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    errors.push(...result.errors.map((e) => `Row ${e.row}: ${e.message}`));
  }

  const transactions: Omit<Transaction, "id">[] = result.data
    .filter((row) => row.UTC_Time && row.Operation)
    .map((row) => {
      const change = parseFloat(row.Change) || 0;
      const isPositive = change >= 0;

      return {
        user_id: userId,
        source: "csv_binance" as const,
        timestamp: new Date(row.UTC_Time).toISOString(),
        type: mapBinanceOperation(row.Operation),
        asset_in: isPositive ? row.Coin : undefined,
        amount_in: isPositive ? Math.abs(change) : undefined,
        asset_out: !isPositive ? row.Coin : undefined,
        amount_out: !isPositive ? Math.abs(change) : undefined,
        raw_data: row as unknown as Record<string, unknown>,
      };
    });

  return { transactions, errors };
}

export function parseCoinbaseCSV(
  csvContent: string,
  userId: string
): { transactions: Omit<Transaction, "id">[]; errors: string[] } {
  const errors: string[] = [];
  const result = Papa.parse<CoinbaseRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    errors.push(...result.errors.map((e) => `Row ${e.row}: ${e.message}`));
  }

  const transactions: Omit<Transaction, "id">[] = result.data
    .filter((row) => row.Timestamp && row["Transaction Type"])
    .map((row) => {
      const type = mapCoinbaseType(row["Transaction Type"]);
      const amount = parseFloat(row["Quantity Transacted"]) || 0;
      const priceEur =
        parseFloat(row["EUR Spot Price at Transaction"]) || undefined;
      const feeEur = parseFloat(row["EUR Fees"]) || undefined;

      return {
        user_id: userId,
        source: "csv_coinbase" as const,
        timestamp: new Date(row.Timestamp).toISOString(),
        type,
        asset_in: type === "buy" ? row.Asset : undefined,
        amount_in: type === "buy" ? amount : undefined,
        asset_out: type === "sell" ? row.Asset : undefined,
        amount_out: type === "sell" ? amount : undefined,
        price_eur: priceEur,
        fee_amount: feeEur,
        fee_asset: feeEur ? "EUR" : undefined,
        raw_data: row as unknown as Record<string, unknown>,
      };
    });

  return { transactions, errors };
}
