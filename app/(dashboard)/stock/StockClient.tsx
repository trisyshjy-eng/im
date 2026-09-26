"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { ItemCategory } from "@/lib/types/database";
import type { StockOverviewRow } from "@/lib/data/stock";
import { getStockStatus } from "@/lib/utils/stock-status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils/format";
import { inputClass } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";

const TABS: ItemCategory[] = ["생산품", "소스류"];

export function StockClient({
  rows,
  initialSearch,
}: {
  rows: StockOverviewRow[];
  initialSearch?: string;
}) {
  const [tab, setTab] = useState<ItemCategory>("생산품");
  const [search, setSearch] = useState(initialSearch ?? "");

  const filtered = useMemo(() => {
    return rows.filter(
      (row) => row.item.category === tab && row.item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, tab, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-accent-soft text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="품목명으로 검색"
            className={`${inputClass} w-56`}
          />
          <a href="/api/export/stock">
            <Button variant="secondary">
              <Download size={16} />
              엑셀 다운로드
            </Button>
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-soft/40 text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">품목명</th>
              <th className="px-5 py-3 text-right font-medium">규격(g)</th>
              <th className="px-5 py-3 text-right font-medium">전월재고</th>
              <th className="px-5 py-3 text-right font-medium">재고수량</th>
              <th className="px-5 py-3 text-right font-medium">재고량(g)</th>
              <th className="px-5 py-3 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const status = getStockStatus(row.stockQty, row.item);
              const low = status !== "정상";
              return (
                <tr
                  key={row.item.id}
                  className={`border-b border-border last:border-0 ${
                    low ? "bg-danger-soft/40" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-foreground">{row.item.name}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {formatNumber(row.item.spec_weight_g)}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {formatNumber(row.prevMonthStockQty)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${
                      low ? "text-danger" : "text-foreground"
                    }`}
                  >
                    {formatNumber(row.stockQty)}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {formatNumber(row.stockAmountG)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  조회된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
