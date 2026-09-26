"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, Bell } from "lucide-react";

export function DashboardTopActions({ lowStockCount }: { lowStockCount: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/stock${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="품목 검색"
          className="w-56 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </form>
      <button
        onClick={() => router.push("/stock")}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-accent"
        aria-label="알림"
      >
        <Bell size={16} />
        {lowStockCount > 0 && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>
    </div>
  );
}
