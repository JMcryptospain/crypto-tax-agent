import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectChainActivity, CHAINS } from "@/lib/alchemy";
import { z } from "zod";

const walletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  label: z.string().optional(),
});

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

  // Auto-detect chains with activity
  const chainActivity = await detectChainActivity(address);
  const activeChains = chainActivity.filter((c) => c.hasActivity);

  if (activeChains.length === 0) {
    return NextResponse.json(
      { error: "No on-chain activity found for this address on any supported chain." },
      { status: 404 }
    );
  }

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

  // Store one snapshot transaction per active chain so the AI agent has portfolio data
  const now = new Date().toISOString();
  const snapshots = activeChains.map((c) => ({
    user_id: user.id,
    source: "wallet" as const,
    timestamp: now,
    type: "transfer" as const,
    asset_in: CHAINS[c.chain].nativeCurrency,
    amount_in: c.balanceFormatted,
    raw_data: {
      snapshot: true,
      chain: c.chain,
      chain_name: c.name,
      address,
      balance_wei: c.balance,
      balance_formatted: c.balanceFormatted,
      total_tx_count: c.txCount,
    },
  }));

  const { error: txError } = await supabase
    .from("transactions")
    .insert(snapshots);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json({
    wallet: { address, label },
    chains_detected: activeChains.map((c) => ({
      chain: c.chain,
      name: c.name,
      balance: c.balanceFormatted,
      tx_count: c.txCount,
    })),
    transactions_imported: activeChains.length,
  });
}
