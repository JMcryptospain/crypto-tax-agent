import { Country } from "@/types";

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface CountryTaxRules {
  name: string;
  currency: string;
  // Capital gains tax brackets for crypto
  capitalGainsBrackets: TaxBracket[];
  // Holding period for tax-free gains (months), null if not applicable
  holdingPeriodMonths: number | null;
  // Whether staking rewards are taxed as income
  stakingTaxedAsIncome: boolean;
  // Free allowance for capital gains per year
  annualExemption: number;
  notes: string[];
}

export const TAX_RULES: Record<Country, CountryTaxRules> = {
  ES: {
    name: "Spain",
    currency: "EUR",
    capitalGainsBrackets: [
      { min: 0, max: 6000, rate: 0.19 },
      { min: 6000, max: 50000, rate: 0.21 },
      { min: 50000, max: 200000, rate: 0.23 },
      { min: 200000, max: 300000, rate: 0.27 },
      { min: 300000, max: null, rate: 0.28 },
    ],
    holdingPeriodMonths: null, // No holding period exemption
    stakingTaxedAsIncome: true,
    annualExemption: 0,
    notes: [
      "Crypto-to-crypto swaps are taxable events.",
      "FIFO method is required for cost basis calculation.",
      "Modelo 721 declaration required for crypto assets held abroad exceeding 50,000 EUR.",
      "Losses can offset gains within the same tax year and carry forward 4 years.",
    ],
  },
  FR: {
    name: "France",
    currency: "EUR",
    capitalGainsBrackets: [
      { min: 0, max: null, rate: 0.30 }, // Flat tax (PFU)
    ],
    holdingPeriodMonths: null,
    stakingTaxedAsIncome: true,
    annualExemption: 305, // 305 EUR annual exemption on total proceeds
    notes: [
      "Flat tax of 30% (12.8% income tax + 17.2% social charges) applies to crypto gains.",
      "Only crypto-to-fiat conversions are taxable; crypto-to-crypto swaps are NOT taxable.",
      "Occasional traders use the flat tax; professional traders are taxed as BIC.",
      "Weighted average cost method is used for cost basis.",
    ],
  },
  DE: {
    name: "Germany",
    currency: "EUR",
    capitalGainsBrackets: [
      { min: 0, max: null, rate: 0.0 }, // Tax-free if held > 1 year
    ],
    holdingPeriodMonths: 12, // 1 year holding period for tax-free
    stakingTaxedAsIncome: true,
    annualExemption: 1000, // 1,000 EUR Freigrenze (not deductible, all-or-nothing)
    notes: [
      "Gains from crypto held longer than 1 year are completely tax-free.",
      "If held less than 1 year, gains are taxed as personal income (up to 45%).",
      "The 1,000 EUR exemption is a Freigrenze: if total gains exceed it, ALL gains are taxed.",
      "Staking may extend the holding period to 10 years (debated, check current guidance).",
      "FIFO method is commonly used for cost basis.",
    ],
  },
};

export function calculateTax(
  country: Country,
  netGainsEur: number
): number {
  const rules = TAX_RULES[country];

  if (netGainsEur <= 0) return 0;

  // Germany: special handling for holding period (simplified — assumes short-term)
  if (country === "DE") {
    if (netGainsEur <= rules.annualExemption) return 0;
    // Approximate with average income tax rate of 30% for short-term gains
    return netGainsEur * 0.3;
  }

  // France: check annual exemption on proceeds
  if (country === "FR") {
    if (netGainsEur <= rules.annualExemption) return 0;
    return netGainsEur * 0.3;
  }

  // Spain: progressive brackets
  let remaining = netGainsEur;
  let tax = 0;
  for (const bracket of rules.capitalGainsBrackets) {
    if (remaining <= 0) break;
    const bracketSize = bracket.max !== null ? bracket.max - bracket.min : remaining;
    const taxable = Math.min(remaining, bracketSize);
    tax += taxable * bracket.rate;
    remaining -= taxable;
  }

  return Math.round(tax * 100) / 100;
}
