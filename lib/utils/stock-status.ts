import type { Item } from "@/lib/types/database";

export type StockStatus = "정상" | "임박" | "부족" | "품절";

export function getStockStatus(
  stockQty: number,
  item: Pick<Item, "min_stock_qty" | "warning_stock_qty">
): StockStatus {
  if (stockQty <= 0) return "품절";
  if (stockQty <= item.min_stock_qty) return "부족";
  if (stockQty <= item.warning_stock_qty) return "임박";
  return "정상";
}

export function isLowStock(status: StockStatus): boolean {
  return status !== "정상";
}

export const STOCK_STATUS_BADGE_STYLE: Record<StockStatus, string> = {
  정상: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  임박: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  부족: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20",
  품절: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20",
};
