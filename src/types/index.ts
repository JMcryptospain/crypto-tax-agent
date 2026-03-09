export type Country = "ES" | "FR" | "DE";

export interface UserProfile {
  id: string;
  email: string;
  country: Country;
  created_at: string;
}

export interface WalletConnection {
  id: string;
  user_id: string;
  address: string;
  chains_detected: string[];
  label?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  source: "wallet" | "csv_binance" | "csv_coinbase";
  tx_hash?: string;
  timestamp: string;
  type: "buy" | "sell" | "swap" | "transfer" | "staking_reward" | "airdrop" | "unknown";
  asset_in?: string;
  amount_in?: number;
  asset_out?: string;
  amount_out?: number;
  fee_amount?: number;
  fee_asset?: string;
  price_eur?: number;
  raw_data?: Record<string, unknown>;
}

export interface TaxReport {
  id: string;
  user_id: string;
  country: Country;
  tax_year: number;
  total_gains_eur: number;
  total_losses_eur: number;
  net_taxable_eur: number;
  tax_owed_eur: number;
  summary_markdown: string;
  optimization_tips: string[];
  created_at: string;
}

export interface AnalysisRequest {
  user_id: string;
  country: Country;
  tax_year: number;
}

export interface CSVUploadResult {
  transactions_imported: number;
  errors: string[];
}
