import { PageHeader } from "@/components/ui/PageHeader";
import { getStockOverview } from "@/lib/data/stock";
import { StockClient } from "./StockClient";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const rows = await getStockOverview();

  return (
    <div>
      <PageHeader
        title="재고 현황"
        subtitle="품목별 규격, 전월재고, 현재 재고수량·재고량을 확인합니다"
      />
      <StockClient rows={rows} initialSearch={params.search} />
    </div>
  );
}
