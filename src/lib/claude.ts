import Anthropic from "@anthropic-ai/sdk";
import { Country, Transaction } from "@/types";
import { TAX_RULES, calculateTax } from "./tax-rules";

const anthropic = new Anthropic();

interface AnalysisResult {
  total_gains_eur: number;
  total_losses_eur: number;
  net_taxable_eur: number;
  tax_owed_eur: number;
  summary_markdown: string;
  optimization_tips: string[];
}

export async function analyzeTransactions(
  transactions: Transaction[],
  country: Country,
  taxYear: number
): Promise<AnalysisResult> {
  const rules = TAX_RULES[country];

  const systemPrompt = `You are an expert European crypto tax advisor AI. You analyze cryptocurrency transactions and calculate tax liability according to specific country rules.

Country: ${rules.name}
Tax Year: ${taxYear}
Currency: ${rules.currency}

TAX RULES FOR ${rules.name.toUpperCase()}:
- Capital gains brackets: ${JSON.stringify(rules.capitalGainsBrackets)}
- Holding period for tax-free gains: ${rules.holdingPeriodMonths ? `${rules.holdingPeriodMonths} months` : "Not applicable"}
- Staking rewards taxed as income: ${rules.stakingTaxedAsIncome ? "Yes" : "No"}
- Annual exemption: ${rules.annualExemption} EUR
- Important notes:
${rules.notes.map((n) => `  - ${n}`).join("\n")}

DATA SOURCES:
- Wallet snapshots: On-chain portfolio data with current balances and total transaction counts per chain. These show holdings but not individual transaction history.
- CSV transactions: Detailed transaction-level data from exchanges (Binance, Coinbase) with dates, amounts, and prices.
- When you have only wallet snapshots without CSV data, provide a portfolio overview, estimate potential tax scenarios based on the holdings, and strongly recommend the user upload exchange CSVs for accurate calculations.

INSTRUCTIONS:
1. Analyze all transactions and wallet snapshots for the given tax year
2. Classify each transaction type (buy, sell, swap, staking reward, airdrop, transfer)
3. Calculate cost basis using the method required by the country (FIFO for Spain/Germany, weighted average for France)
4. Calculate total gains and losses
5. Apply country-specific exemptions and rules
6. Provide optimization suggestions

You MUST respond with valid JSON matching this exact schema:
{
  "total_gains_eur": number,
  "total_losses_eur": number,
  "net_taxable_eur": number,
  "tax_owed_eur": number,
  "summary_markdown": "string with markdown formatted report",
  "optimization_tips": ["tip1", "tip2", ...]
}

The summary_markdown should be a conversational, easy-to-understand report that includes:
- Overview of trading activity
- Breakdown of gains/losses by asset
- Tax calculation explanation
- Important deadlines and filing requirements`;

  const txSummary = transactions.map((tx) => ({
    date: tx.timestamp,
    type: tx.type,
    asset_in: tx.asset_in,
    amount_in: tx.amount_in,
    asset_out: tx.asset_out,
    amount_out: tx.amount_out,
    price_eur: tx.price_eur,
    fee: tx.fee_amount ? `${tx.fee_amount} ${tx.fee_asset}` : null,
    source: tx.source,
  }));

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Here are my crypto transactions for tax year ${taxYear}. Please analyze them and calculate my tax liability for ${rules.name}.

TRANSACTIONS (${transactions.length} total):
${JSON.stringify(txSummary, null, 2)}

Please provide the complete tax analysis as JSON.`,
      },
    ],
    system: systemPrompt,
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

  // Validate tax calculation with our own rules as a sanity check
  const calculatedTax = calculateTax(country, result.net_taxable_eur);
  if (Math.abs(calculatedTax - result.tax_owed_eur) > result.tax_owed_eur * 0.2) {
    // If AI's calculation differs by more than 20%, use our calculation
    result.tax_owed_eur = calculatedTax;
    result.summary_markdown += `\n\n> **Note:** Tax amount was adjusted using verified calculation rules.`;
  }

  return result;
}
