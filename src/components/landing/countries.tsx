import { TAX_RULES } from "@/lib/tax-rules";
import { Country } from "@/types";

const flags: Record<Country, string> = {
  ES: "\u{1F1EA}\u{1F1F8}",
  FR: "\u{1F1EB}\u{1F1F7}",
  DE: "\u{1F1E9}\u{1F1EA}",
};

export function Countries() {
  return (
    <section id="countries" className="py-24 px-6 bg-zinc-900/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Supported countries
        </h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          Each country has unique crypto tax rules. We handle the complexity so
          you don&apos;t have to.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.entries(TAX_RULES) as [Country, (typeof TAX_RULES)[Country]][]).map(
            ([code, rules]) => (
              <div
                key={code}
                className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-950/50"
              >
                <div className="text-4xl mb-3">{flags[code]}</div>
                <h3 className="text-xl font-semibold mb-3">{rules.name}</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>
                    <span className="text-zinc-300">Tax rate:</span>{" "}
                    {rules.capitalGainsBrackets.length === 1
                      ? `${(rules.capitalGainsBrackets[0].rate * 100).toFixed(0)}% flat`
                      : `${(rules.capitalGainsBrackets[0].rate * 100).toFixed(0)}% - ${(rules.capitalGainsBrackets[rules.capitalGainsBrackets.length - 1].rate * 100).toFixed(0)}%`}
                  </li>
                  <li>
                    <span className="text-zinc-300">Exemption:</span>{" "}
                    {rules.annualExemption > 0
                      ? `${rules.annualExemption} EUR`
                      : "None"}
                  </li>
                  {rules.holdingPeriodMonths && (
                    <li>
                      <span className="text-zinc-300">Tax-free after:</span>{" "}
                      {rules.holdingPeriodMonths} months
                    </li>
                  )}
                </ul>
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <p className="text-xs text-zinc-500">{rules.notes[0]}</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
