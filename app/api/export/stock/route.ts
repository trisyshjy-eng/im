import { requireProfile } from "@/lib/auth/get-profile";
import { getStockOverview } from "@/lib/data/stock";
import { getStockStatus } from "@/lib/utils/stock-status";
import { toCsv, csvResponse } from "@/lib/utils/csv";
import { todayDateString } from "@/lib/utils/date";

export async function GET() {
  await requireProfile();
  const rows = await getStockOverview();

  const csv = toCsv(
    ["품목명", "분류", "규격(g)", "전월재고", "재고수량", "재고량(g)", "상태"],
    rows.map((row) => [
      row.item.name,
      row.item.category,
      row.item.spec_weight_g,
      row.prevMonthStockQty,
      row.stockQty,
      row.stockAmountG,
      getStockStatus(row.stockQty, row.item),
    ])
  );

  return csvResponse(`재고현황_${todayDateString()}.csv`, csv);
}
