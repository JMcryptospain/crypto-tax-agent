export type Chain = "ethereum" | "arbitrum" | "optimism" | "base" | "polygon" | "taiko";

export const CHAINS: Record<Chain, { name: string; rpc: string; nativeCurrency: string }> = {
  ethereum: { name: "Ethereum", rpc: "https://eth.llamarpc.com", nativeCurrency: "ETH" },
  arbitrum: { name: "Arbitrum", rpc: "https://arb1.arbitrum.io/rpc", nativeCurrency: "ETH" },
  optimism: { name: "Optimism", rpc: "https://mainnet.optimism.io", nativeCurrency: "ETH" },
  base: { name: "Base", rpc: "https://mainnet.base.org", nativeCurrency: "ETH" },
  polygon: { name: "Polygon", rpc: "https://polygon-rpc.com", nativeCurrency: "POL" },
  taiko: { name: "Taiko", rpc: "https://rpc.mainnet.taiko.xyz", nativeCurrency: "ETH" },
};

interface JsonRpcResponse {
  result: string;
}

async function rpcCall(rpc: string, method: string, params: unknown[]): Promise<JsonRpcResponse> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return res.json();
}

export interface ChainActivity {
  chain: Chain;
  name: string;
  balance: string; // hex wei
  balanceFormatted: number;
  txCount: number;
  hasActivity: boolean;
}

export async function detectChainActivity(address: string): Promise<ChainActivity[]> {
  const results = await Promise.all(
    (Object.entries(CHAINS) as [Chain, (typeof CHAINS)[Chain]][]).map(
      async ([chain, config]) => {
        try {
          const [balanceRes, txCountRes] = await Promise.all([
            rpcCall(config.rpc, "eth_getBalance", [address, "latest"]),
            rpcCall(config.rpc, "eth_getTransactionCount", [address, "latest"]),
          ]);

          const balance = balanceRes.result || "0x0";
          const txCount = parseInt(txCountRes.result || "0x0", 16);
          const balanceFormatted = parseInt(balance, 16) / 1e18;

          return {
            chain,
            name: config.name,
            balance,
            balanceFormatted,
            txCount,
            hasActivity: txCount > 0 || balanceFormatted > 0,
          };
        } catch {
          return {
            chain,
            name: config.name,
            balance: "0x0",
            balanceFormatted: 0,
            txCount: 0,
            hasActivity: false,
          };
        }
      }
    )
  );

  return results;
}

// No block scanning — public RPCs don't support indexed transaction queries.
// Instead, we store one snapshot record per active chain with balance + tx count.
// The AI agent uses this portfolio data for tax analysis.
// Detailed transaction history comes from CSV uploads.
