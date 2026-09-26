import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DailyStockEntry, Item } from "@/lib/types/database";
import { yearMonthOf } from "@/lib/utils/date";

export interface DailyEntryRow {
  item: Item;
  entry: DailyStockEntry | null;
  prevMonthStockQty: number;
}

export async function getDailyEntryGrid(date: string): Promise<DailyEntryRow[]> {
  const supabase = await createClient();
  const yearMonth = yearMonthOf(date);

  const [{ data: items, error: itemsError }, { data: entries, error: entriesError }, { data: summaries, error: summariesError }] =
    await Promise.all([
      supabase.from("items").select("*").eq("is_active", true).order("created_at"),
      supabase.from("daily_stock_entries").select("*").eq("entry_date", date),
      supabase
        .from("monthly_summaries")
        .select("item_id, prev_month_stock_qty")
        .eq("year_month", yearMonth),
    ]);

  if (itemsError) throw itemsError;
  if (entriesError) throw entriesError;
  if (summariesError) throw summariesError;

  const entryByItem = new Map((entries ?? []).map((e) => [e.item_id, e]));
  const prevMonthByItem = new Map(
    (summaries ?? []).map((s) => [s.item_id, s.prev_month_stock_qty])
  );

  return (items ?? []).map((item) => ({
    item,
    entry: entryByItem.get(item.id) ?? null,
    prevMonthStockQty: prevMonthByItem.get(item.id) ?? 0,
  }));
}

export async function getHistory(
  itemId: string,
  startDate: string,
  endDate: string
): Promise<DailyStockEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_stock_entries")
    .select("*")
    .eq("item_id", itemId)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
