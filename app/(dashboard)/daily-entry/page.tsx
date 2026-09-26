import { PageHeader } from "@/components/ui/PageHeader";
import { getDailyEntryGrid } from "@/lib/data/daily-entries";
import { requireProfile } from "@/lib/auth/get-profile";
import { todayDateString, isValidDateString } from "@/lib/utils/date";
import { DailyEntryClient } from "./DailyEntryClient";

export default async function DailyEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const date =
    params.date && isValidDateString(params.date) ? params.date : todayDateString();

  const rows = await getDailyEntryGrid(date);
  const canEdit = profile.role === "admin" || profile.role === "writer";

  return (
    <div>
      <PageHeader
        title="일일 입력"
        subtitle="품목별 생산수량과 출고수량을 입력하면 재고가 자동으로 계산됩니다"
      />
      <DailyEntryClient date={date} rows={rows} canEdit={canEdit} />
    </div>
  );
}
