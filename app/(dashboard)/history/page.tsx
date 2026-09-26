import { PageHeader } from "@/components/ui/PageHeader";
import { getItems } from "@/lib/data/items";
import { getHistory } from "@/lib/data/daily-entries";
import { addDays, isValidDateString, todayDateString } from "@/lib/utils/date";
import { HistoryClient } from "./HistoryClient";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ item_id?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const items = await getItems({ activeOnly: true });

  const itemId = params.item_id && items.some((i) => i.id === params.item_id)
    ? params.item_id
    : items[0]?.id;

  const today = todayDateString();
  const end = params.end && isValidDateString(params.end) ? params.end : today;
  const start =
    params.start && isValidDateString(params.start) ? params.start : addDays(end, -6);

  const entries = itemId ? await getHistory(itemId, start, end) : [];
  const selectedItem = items.find((i) => i.id === itemId) ?? null;

  return (
    <div>
      <PageHeader
        title="재고 이력/리포트"
        subtitle="품목별 생산·출고·재고 변동 추이를 기간별로 조회합니다"
      />
      <HistoryClient
        items={items}
        selectedItem={selectedItem}
        start={start}
        end={end}
        entries={entries}
      />
    </div>
  );
}
