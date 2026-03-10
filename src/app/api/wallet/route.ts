import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectChainActivity } from "@/lib/alchemy";
import { fetchEtherscanTransactions, TxType } from "@/lib/etherscan";
import { z } from "zod";

const walletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  label: z.string().optional(),
});

// Map Etherscan tx types to our DB-compatible types
const TX_TYPE_MAP: Record<TxType, string> = {
  transfer_in: "transfer_in",
  transfer_out: "transfer_out",
  contract_interaction: "contract_interaction",
  token_transfer: "token_transfer",
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = walletSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { address, label } = parsed.data;

  // Auto-detect chains with activity (keeps multi-chain detection)
  const chainActivity = await detectChainActivity(address);
  const activeChains = chainActivity.filter((c) => c.hasActivity);
  const chainsDetected = activeChains.map((c) => c.chain);

  // Save wallet connection
  const { error: walletError } = await supabase
    .from("wallet_connections")
    .insert({
      user_id: user.id,
      address,
      chains_detected: chainsDetected,
      label,
    });

  if (walletError) {
    return NextResponse.json({ error: walletError.message }, { status: 500 });
  }

  // Fetch real transaction history from Etherscan
  const { transactions: etherscanTxs, counts } =
    await fetchEtherscanTransactions(address);

  // Map to DB rows
  const dbRows = etherscanTxs.map((tx) => {
    const isIncoming =
      tx.type === "transfer_in" ||
      (tx.type === "token_transfer" &&
        tx.to_address.toLowerCase() === address.toLowerCase());

    return {
      user_id: user.id,
      source: "wallet" as const,
      tx_hash: tx.tx_hash,
      timestamp: tx.timestamp,
      type: TX_TYPE_MAP[tx.type],
      asset_in: isIncoming ? tx.asset : undefined,
      amount_in: isIncoming ? tx.value_eth : undefined,
      asset_out: !isIncoming ? tx.asset : undefined,
      amount_out: !isIncoming ? tx.value_eth : undefined,
      fee_amount: tx.fee_eth > 0 ? tx.fee_eth : undefined,
      fee_asset: tx.fee_eth > 0 ? "ETH" : undefined,
      raw_data: tx.raw_data,
    };
  });

  if (dbRows.length > 0) {
    // Insert in batches of 500 to avoid payload limits
    const batchSize = 500;
    for (let i = 0; i < dbRows.length; i += batchSize) {
      const batch = dbRows.slice(i, i + batchSize);
      const { error: txError } = await supabase
        .from("transactions")
        .insert(batch);

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    wallet: { address, label },
    chains_detected: activeChains.map((c) => ({
      chain: c.chain,
      name: c.name,
      balance: c.balanceFormatted,
      tx_count: c.txCount,
    })),
    transactions_imported: dbRows.length,
    breakdown: counts,
  });
}
