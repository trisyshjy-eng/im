import { type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth/get-profile";
import { getHistory } from "@/lib/data/daily-entries";
import { getItem } from "@/lib/data/items";
import { toCsv, csvResponse } from "@/lib/utils/csv";
import { isValidDateString } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  await requireProfile();

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!itemId || !start || !end || !isValidDateString(start) || !isValidDateString(end)) {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }

  const [item, entries] = await Promise.all([getItem(itemId), getHistory(itemId, start, end)]);

  if (!item) {
    return new Response("품목을 찾을 수 없습니다.", { status: 404 });
  }

  const csv = toCsv(
    ["날짜", "생산수량", "출고수량", "재고수량", "재고량(g)"],
    entries.map((e) => [e.entry_date, e.produced_qty, e.shipped_qty, e.stock_qty, e.stock_amount_g])
  );

  return csvResponse(`재고이력_${item.name}_${start}_${end}.csv`, csv);
}
