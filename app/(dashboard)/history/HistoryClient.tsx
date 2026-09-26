"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { Item, DailyStockEntry } from "@/lib/types/database";
import { formatNumber, formatWeightKg } from "@/lib/utils/format";
import { inputClass, labelClass } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";

export function HistoryClient({
  items,
  selectedItem,
  start,
  end,
  entries,
}: {
  items: Item[];
  selectedItem: Item | null;
  start: string;
  end: string;
  entries: DailyStockEntry[];
}) {
  const router = useRouter();
  const [itemId, setItemId] = useState(selectedItem?.id ?? "");
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/history?item_id=${itemId}&start=${startDate}&end=${endDate}`);
  }

  const chartData = entries.map((e) => ({
    date: `${Number(e.entry_date.slice(5, 7))}/${Number(e.entry_date.slice(8, 10))}`,
    amount: e.stock_amount_g,
    isLast: false,
  }));
  if (chartData.length > 0) chartData[chartData.length - 1].isLast = true;

  const exportHref =
    itemId && startDate && endDate
      ? `/api/export/history?item_id=${itemId}&start=${startDate}&end=${endDate}`
      : undefined;

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelClass}>품목</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className={`${inputClass} w-56`}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>시작일</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <span className="pb-2 text-muted-foreground">~</span>
          <div>
            <label className={labelClass}>종료일</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button type="submit">조회</Button>
        </div>
        {exportHref && (
          <a href={exportHref}>
            <Button variant="secondary">
              <Download size={16} />
              엑셀 다운로드
            </Button>
          </a>
        )}
      </form>

      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">
          재고량 추이 — {selectedItem?.name ?? "-"} (g)
        </h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                formatter={(value) => [`${formatNumber(Number(value))}g`, "재고량"]}
                cursor={{ fill: "var(--color-accent-soft)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isLast ? "var(--color-accent)" : "var(--color-accent-soft)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            조회 기간에 데이터가 없습니다.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-soft/40 text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">날짜</th>
              <th className="px-5 py-3 text-right font-medium">생산수량</th>
              <th className="px-5 py-3 text-right font-medium">출고수량</th>
              <th className="px-5 py-3 text-right font-medium">재고수량</th>
              <th className="px-5 py-3 text-right font-medium">재고량(g)</th>
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">{entry.entry_date}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {formatNumber(entry.produced_qty)}
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {formatNumber(entry.shipped_qty)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">
                  {formatNumber(entry.stock_qty)}
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {formatNumber(entry.stock_amount_g)}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  조회된 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        합계: 재고량 {formatWeightKg(entries.at(-1)?.stock_amount_g ?? 0)}kg (최근일 기준)
      </p>
    </div>
  );
}
