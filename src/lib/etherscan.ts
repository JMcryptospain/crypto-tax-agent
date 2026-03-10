const ETHERSCAN_BASE = "https://api.etherscan.io/api";

function getApiKey(): string {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) {
    throw new Error("ETHERSCAN_API_KEY is not set in environment variables");
  }
  return key;
}

interface EtherscanTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  gasPrice: string;
  input: string;
  isError: string;
  functionName: string;
  contractAddress: string;
}

interface EtherscanTokenTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  gas: string;
  gasUsed: string;
  gasPrice: string;
}

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T[];
}

export type TxType = "transfer_in" | "transfer_out" | "contract_interaction" | "token_transfer";

export interface ClassifiedTx {
  tx_hash: string;
  timestamp: string;
  from_address: string;
  to_address: string;
  value_eth: number;
  type: TxType;
  asset: string;
  fee_eth: number;
  raw_data: Record<string, unknown>;
}

async function etherscanFetch<T>(params: Record<string, string>): Promise<T[]> {
  const apiKey = getApiKey();
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set("apikey", apiKey);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  console.log(`[Etherscan] Fetching ${params.action} for ${params.address}`);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "1" || !Array.isArray(data.result)) {
    console.error(`[Etherscan] API error for ${params.action}:`, data.message, data.result);
    return [];
  }

  console.log(`[Etherscan] ${params.action}: ${data.result.length} results`);
  return data.result as T[];
}

function classifyEthTx(tx: EtherscanTx, wallet: string): ClassifiedTx {
  const addressLower = wallet.toLowerCase();
  const value = parseInt(tx.value) / 1e18;
  const gasUsed = parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18;

  let type: TxType;
  if (tx.input !== "0x" && tx.input !== "") {
    type = "contract_interaction";
  } else if (tx.to.toLowerCase() === addressLower && value > 0) {
    type = "transfer_in";
  } else {
    type = "transfer_out";
  }

  return {
    tx_hash: tx.hash,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    from_address: tx.from,
    to_address: tx.to,
    value_eth: value,
    type,
    asset: "ETH",
    fee_eth: gasUsed,
    raw_data: tx as unknown as Record<string, unknown>,
  };
}

function classifyTokenTx(tx: EtherscanTokenTx): ClassifiedTx {
  const decimals = parseInt(tx.tokenDecimal) || 18;
  const value = parseInt(tx.value) / Math.pow(10, decimals);
  const gasUsed = parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18;

  return {
    tx_hash: tx.hash,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    from_address: tx.from,
    to_address: tx.to,
    value_eth: value,
    type: "token_transfer",
    asset: tx.tokenSymbol || tx.tokenName || "UNKNOWN",
    fee_eth: gasUsed,
    raw_data: tx as unknown as Record<string, unknown>,
  };
}

export interface FetchResult {
  transactions: ClassifiedTx[];
  counts: Record<TxType, number>;
}

export async function fetchEtherscanTransactions(address: string): Promise<FetchResult> {
  console.log(`[Etherscan] ETHERSCAN_API_KEY defined: ${!!process.env.ETHERSCAN_API_KEY}`);

  const [ethTxs, tokenTxs] = await Promise.all([
    etherscanFetch<EtherscanTx>({
      module: "account",
      action: "txlist",
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "asc",
    }),
    etherscanFetch<EtherscanTokenTx>({
      module: "account",
      action: "tokentx",
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "asc",
    }),
  ]);

  const classifiedEth = ethTxs.map((tx) => classifyEthTx(tx, address));
  const classifiedTokens = tokenTxs.map((tx) => classifyTokenTx(tx));

  // Deduplicate by hash+type (a tx can appear as both ETH and token transfer)
  const seen = new Set<string>();
  const all: ClassifiedTx[] = [];
  for (const tx of [...classifiedEth, ...classifiedTokens]) {
    const key = `${tx.tx_hash}:${tx.type}:${tx.asset}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(tx);
    }
  }

  all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const counts: Record<TxType, number> = {
    transfer_in: 0,
    transfer_out: 0,
    contract_interaction: 0,
    token_transfer: 0,
  };
  for (const tx of all) {
    counts[tx.type]++;
  }

  return { transactions: all, counts };
}
