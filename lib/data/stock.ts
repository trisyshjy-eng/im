import "server-only";
import { createClient } from "@/lib/supabase/server";
import { yearMonthOf, todayDateString } from "@/lib/utils/date";
import type { Item, ItemCategory } from "@/lib/types/database";

export interface StockOverviewRow {
  item: Item;
  stockQty: number;
  stockAmountG: number;
  prevMonthStockQty: number;
}

export async function getStockOverview(category?: ItemCategory): Promise<StockOverviewRow[]> {
  const supabase = await createClient();
  const yearMonth = yearMonthOf(todayDateString());

  let itemsQuery = supabase.from("items").select("*").eq("is_active", true).order("name");
  if (category) itemsQuery = itemsQuery.eq("category", category);

  const [{ data: items, error: itemsError }, { data: stocks, error: stocksError }, { data: summaries, error: summariesError }] =
    await Promise.all([
      itemsQuery,
      supabase.from("current_item_stock").select("*"),
      supabase
        .from("monthly_summaries")
        .select("item_id, prev_month_stock_qty")
        .eq("year_month", yearMonth),
    ]);

  if (itemsError) throw itemsError;
  if (stocksError) throw stocksError;
  if (summariesError) throw summariesError;

  const stockByItem = new Map((stocks ?? []).map((s) => [s.item_id, s]));
  const prevByItem = new Map((summaries ?? []).map((s) => [s.item_id, s.prev_month_stock_qty]));

  return (items ?? []).map((item) => {
    const stock = stockByItem.get(item.id);
    return {
      item,
      stockQty: stock?.stock_qty ?? 0,
      stockAmountG: stock?.stock_amount_g ?? 0,
      prevMonthStockQty: prevByItem.get(item.id) ?? 0,
    };
  });
}
