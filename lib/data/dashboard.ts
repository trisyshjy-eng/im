import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStockOverview } from "@/lib/data/stock";
import { getStockStatus } from "@/lib/utils/stock-status";
import { startOfMonth, todayDateString } from "@/lib/utils/date";

export interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  monthProducedAmountG: number;
  monthShippedAmountG: number;
  categoryTotals: { category: string; amountG: number }[];
  lowStockItems: { name: string; category: string; stockQty: number; status: string }[];
  recentActivity: {
    id: string;
    itemName: string;
    action: "생산" | "출고";
    qty: number;
    actorName: string;
    at: string;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = todayDateString();
  const monthStart = startOfMonth(today);

  const overview = await getStockOverview();

  const lowStockItems = overview
    .map((row) => ({
      name: row.item.name,
      category: row.item.category,
      stockQty: row.stockQty,
      status: getStockStatus(row.stockQty, row.item),
    }))
    .filter((row) => row.status !== "정상")
    .sort((a, b) => a.stockQty - b.stockQty);

  const categoryTotals = ["생산품", "소스류"].map((category) => ({
    category,
    amountG: overview
      .filter((row) => row.item.category === category)
      .reduce((sum, row) => sum + row.stockAmountG, 0),
  }));

  const { data: monthEntries, error: monthError } = await supabase
    .from("daily_stock_entries")
    .select("produced_amount_g, shipped_amount_g")
    .gte("entry_date", monthStart)
    .lte("entry_date", today);

  if (monthError) throw monthError;

  const monthProducedAmountG = (monthEntries ?? []).reduce(
    (sum, e) => sum + Number(e.produced_amount_g),
    0
  );
  const monthShippedAmountG = (monthEntries ?? []).reduce(
    (sum, e) => sum + Number(e.shipped_amount_g),
    0
  );

  const { data: recentRows, error: recentError } = await supabase
    .from("daily_stock_entries")
    .select("id, item_id, produced_qty, shipped_qty, updated_by, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (recentError) throw recentError;

  const itemIds = [...new Set((recentRows ?? []).map((r) => r.item_id))];
  const actorIds = [
    ...new Set((recentRows ?? []).map((r) => r.updated_by).filter((v): v is string => !!v)),
  ];

  const [{ data: itemNames }, { data: actorNames }] = await Promise.all([
    itemIds.length
      ? supabase.from("items").select("id, name").in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    actorIds.length
      ? supabase.from("profiles").select("id, name").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const itemNameMap = new Map((itemNames ?? []).map((i) => [i.id, i.name]));
  const actorNameMap = new Map((actorNames ?? []).map((a) => [a.id, a.name]));

  const recentActivity = (recentRows ?? []).map((row) => {
    const isProduction = row.produced_qty > 0;
    return {
      id: row.id,
      itemName: itemNameMap.get(row.item_id) ?? "알 수 없음",
      action: (isProduction ? "생산" : "출고") as "생산" | "출고",
      qty: isProduction ? row.produced_qty : row.shipped_qty,
      actorName: row.updated_by ? actorNameMap.get(row.updated_by) ?? "알 수 없음" : "알 수 없음",
      at: row.updated_at,
    };
  });

  return {
    totalItems: overview.length,
    lowStockCount: lowStockItems.length,
    monthProducedAmountG,
    monthShippedAmountG,
    categoryTotals,
    lowStockItems: lowStockItems.slice(0, 5),
    recentActivity,
  };
}
