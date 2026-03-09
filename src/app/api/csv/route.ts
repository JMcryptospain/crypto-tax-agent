import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseBinanceCSV, parseCoinbaseCSV } from "@/lib/csv-parsers";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const exchange = formData.get("exchange") as string | null;

  if (!file || !exchange) {
    return NextResponse.json(
      { error: "File and exchange type are required" },
      { status: 400 }
    );
  }

  if (!["binance", "coinbase"].includes(exchange)) {
    return NextResponse.json(
      { error: "Unsupported exchange. Use 'binance' or 'coinbase'" },
      { status: 400 }
    );
  }

  const csvContent = await file.text();

  const { transactions, errors } =
    exchange === "binance"
      ? parseBinanceCSV(csvContent, user.id)
      : parseCoinbaseCSV(csvContent, user.id);

  if (transactions.length > 0) {
    const { error: dbError } = await supabase
      .from("transactions")
      .insert(transactions);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    transactions_imported: transactions.length,
    errors,
  });
}
