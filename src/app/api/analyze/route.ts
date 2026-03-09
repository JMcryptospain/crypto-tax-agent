import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeTransactions } from "@/lib/claude";
import { Country } from "@/types";
import { z } from "zod";

const analyzeSchema = z.object({
  country: z.enum(["ES", "FR", "DE"]),
  tax_year: z.number().int().min(2020).max(2026),
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
  const parsed = analyzeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { country, tax_year } = parsed.data;

  // Fetch all transactions for this user — the AI agent handles year filtering
  const { data: transactions, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!transactions || transactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions or wallet data found. Connect a wallet or upload a CSV first." },
      { status: 404 }
    );
  }

  const result = await analyzeTransactions(
    transactions,
    country as Country,
    tax_year
  );

  // Save report
  const { data: report, error: saveError } = await supabase
    .from("tax_reports")
    .insert({
      user_id: user.id,
      country,
      tax_year,
      ...result,
    })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json(report);
}
