import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { TAX_RULES } from "@/lib/tax-rules";
import { Country } from "@/types";
import { z } from "zod";

const anthropic = new Anthropic();

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  country: z.enum(["ES", "FR", "DE"]),
  tax_year: z.number().int(),
  report_summary: z.string(),
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
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { messages, country, tax_year, report_summary } = parsed.data;
  const rules = TAX_RULES[country as Country];

  // Fetch user's transaction data for context
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: true });

  const txSummary = (transactions || []).map((tx) => ({
    date: tx.timestamp,
    type: tx.type,
    asset_in: tx.asset_in,
    amount_in: tx.amount_in,
    asset_out: tx.asset_out,
    amount_out: tx.amount_out,
    price_eur: tx.price_eur,
    source: tx.source,
    raw_data: tx.raw_data,
  }));

  const systemPrompt = `You are an expert European crypto tax advisor AI having a follow-up conversation with a user. You already generated their tax report and now they're asking questions.

You are friendly, knowledgeable, and conversational. Give clear, actionable answers. Use markdown formatting for readability.

CONTEXT:
- Country: ${rules.name}
- Tax Year: ${tax_year}
- Tax Rules: ${JSON.stringify(rules, null, 2)}

USER'S PORTFOLIO DATA (${txSummary.length} records):
${JSON.stringify(txSummary, null, 2)}

PREVIOUSLY GENERATED TAX REPORT:
${report_summary}

GUIDELINES:
- Answer questions about their specific tax situation based on the data above
- Explain tax concepts in simple terms
- Suggest legal optimization strategies when relevant
- If asked about something outside your data, say so and suggest what data they could provide
- Always remind users that this is not a substitute for professional tax advice when giving specific recommendations
- Keep answers concise but thorough`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({ message: text });
}
