import { Tags, AlertTriangle, BarChart3, Boxes } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboardStats } from "@/lib/data/dashboard";
import { formatDateKorean, formatWeightKg, formatRelativeTime } from "@/lib/utils/format";
import { todayDateString } from "@/lib/utils/date";
import { DashboardTopActions } from "./DashboardTopActions";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const maxCategoryAmount = Math.max(1, ...stats.categoryTotals.map((c) => c.amountG));

  return (
    <div>
      <PageHeader
        title="대시보드"
        subtitle={`${formatDateKorean(todayDateString())} 기준 실시간 재고 현황`}
        actions={<DashboardTopActions lowStockCount={stats.lowStockCount} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Tags size={18} />}
          value={String(stats.totalItems)}
          unit="개"
          label="전체 관리 품목"
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          value={String(stats.lowStockCount)}
          unit="개"
          label="재고 부족 임박"
          tone="danger"
        />
        <StatCard
          icon={<BarChart3 size={18} />}
          value={formatWeightKg(stats.monthProducedAmountG)}
          unit="kg"
          label="이번달 총 생산량"
        />
        <StatCard
          icon={<Boxes size={18} />}
          value={formatWeightKg(stats.monthShippedAmountG)}
          unit="kg"
          label="이번달 총 출고량"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">재고 부족 임박 품목</h2>
            <a href="/stock" className="text-sm font-medium text-accent hover:underline">
              전체 보기
            </a>
          </div>
          <div className="space-y-1">
            {stats.lowStockItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-accent-soft/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{item.stockQty}개</span>
                  <StatusBadge status={item.status as never} />
                </div>
              </div>
            ))}
            {stats.lowStockItems.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                재고 부족 임박 품목이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-foreground">분류별 재고 현황</h2>
          <div className="space-y-4">
            {stats.categoryTotals.map((c) => (
              <div key={c.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.category}</span>
                  <span className="text-muted-foreground">{formatWeightKg(c.amountG)}kg</span>
                </div>
                <div className="h-2 w-full rounded-full bg-accent-soft">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(c.amountG / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-6 font-semibold text-foreground">최근 입력 내역</h2>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {activity.itemName} {activity.action} {activity.qty}개 입력
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(activity.at)}
                </span>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                최근 입력 내역이 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
