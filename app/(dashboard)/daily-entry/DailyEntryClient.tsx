"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyEntryRow } from "@/lib/data/daily-entries";
import { saveDailyEntriesAction } from "@/lib/actions/daily-entries";
import { getStockStatus, isLowStock } from "@/lib/utils/stock-status";
import { formatNumber, formatDateKorean } from "@/lib/utils/format";
import { addDays, todayDateString } from "@/lib/utils/date";
import { Button } from "@/components/ui/Button";

interface RowState {
  produced: string;
  shipped: string;
}

export function DailyEntryClient({
  date,
  rows,
  canEdit,
}: {
  date: string;
  rows: DailyEntryRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.item.id,
        {
          produced: String(r.entry?.produced_qty ?? 0),
          shipped: String(r.entry?.shipped_qty ?? 0),
        },
      ])
    )
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  function goToDate(newDate: string) {
    router.push(`/daily-entry?date=${newDate}`);
  }

  function updateValue(itemId: string, field: keyof RowState, raw: string) {
    setValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: raw },
    }));
  }

  const computed = useMemo(() => {
    return rows.map((r) => {
      const state = values[r.item.id] ?? { produced: "0", shipped: "0" };
      const produced = Math.max(0, Number(state.produced) || 0);
      const shipped = Math.max(0, Number(state.shipped) || 0);
      const prevStock = r.entry?.prev_stock_qty ?? r.prevMonthStockQty;
      const stockQty = prevStock + produced - shipped;
      const spec = r.item.spec_weight_g;
      return {
        row: r,
        produced,
        shipped,
        stockQty,
        producedAmount: produced * spec,
        shippedAmount: shipped * spec,
        stockAmount: stockQty * spec,
      };
    });
  }, [rows, values]);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      // 변경되지 않은 행(0/0 신규 행 포함)은 보내지 않는다.
      // 그렇지 않으면 매 저장마다 전 품목에 빈 기록이 쌓여 "최근 입력 내역"이 무의미한 0건으로 뒤덮인다.
      const payload = computed
        .filter((c) => {
          const originalProduced = c.row.entry?.produced_qty ?? 0;
          const originalShipped = c.row.entry?.shipped_qty ?? 0;
          return c.produced !== originalProduced || c.shipped !== originalShipped;
        })
        .map((c) => ({
          item_id: c.row.item.id,
          produced_qty: c.produced,
          shipped_qty: c.shipped,
        }));

      if (payload.length === 0) {
        setMessage({ type: "success", text: "변경된 내용이 없습니다." });
        return;
      }

      const result = await saveDailyEntriesAction(date, payload);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "저장되었습니다." });
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{formatDateKorean(date)}</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card">
            <button
              onClick={() => goToDate(addDays(date, -1))}
              className="p-2 text-muted-foreground hover:text-accent"
              aria-label="이전 날짜"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={date}
              max={todayDateString()}
              onChange={(e) => e.target.value && goToDate(e.target.value)}
              className="border-x border-border px-2 py-1.5 text-sm focus:outline-none"
            />
            <button
              onClick={() => goToDate(addDays(date, 1))}
              disabled={date >= todayDateString()}
              className="p-2 text-muted-foreground hover:text-accent disabled:opacity-30"
              aria-label="다음 날짜"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {canEdit && (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "저장 중..." : "저장"}
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "error"
              ? "bg-danger-soft text-danger"
              : "bg-success-soft text-success"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-soft/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">품목명</th>
              <th className="px-4 py-3 text-right font-medium">규격(g)</th>
              <th className="px-4 py-3 text-right font-medium">전월재고</th>
              <th className="px-4 py-3 text-right font-medium">생산수량</th>
              <th className="px-4 py-3 text-right font-medium">총생산량</th>
              <th className="px-4 py-3 text-right font-medium">출고수량</th>
              <th className="px-4 py-3 text-right font-medium">총출고량</th>
              <th className="px-4 py-3 text-right font-medium">재고수량</th>
              <th className="px-4 py-3 text-right font-medium">재고량</th>
            </tr>
          </thead>
          <tbody>
            {computed.map((c) => {
              const status = getStockStatus(c.stockQty, c.row.item);
              const low = isLowStock(status);
              return (
                <tr
                  key={c.row.item.id}
                  className={`border-b border-border last:border-0 ${
                    low ? "bg-danger-soft/40" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {c.row.item.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatNumber(c.row.item.spec_weight_g)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatNumber(c.row.prevMonthStockQty)}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={values[c.row.item.id]?.produced ?? "0"}
                      onChange={(e) =>
                        updateValue(c.row.item.id, "produced", e.target.value)
                      }
                      className="w-24 rounded-md border border-border bg-card px-2 py-1.5 text-right text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatNumber(c.producedAmount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      disabled={!canEdit}
                      value={values[c.row.item.id]?.shipped ?? "0"}
                      onChange={(e) =>
                        updateValue(c.row.item.id, "shipped", e.target.value)
                      }
                      className="w-24 rounded-md border border-border bg-card px-2 py-1.5 text-right text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatNumber(c.shippedAmount)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      low ? "text-danger" : "text-foreground"
                    }`}
                  >
                    {formatNumber(c.stockQty)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatNumber(c.stockAmount)}
                  </td>
                </tr>
              );
            })}
            {computed.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  등록된 품목이 없습니다. 먼저 품목을 등록해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        빨간 배경 행은 재고 부족(임박) 품목입니다. 총생산량·총출고량·재고수량·재고량은
        자동 계산되어 직접 수정할 수 없습니다.
      </p>
    </div>
  );
}
