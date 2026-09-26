"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  LayoutGrid,
  Package,
  ClipboardCheck,
  Tag,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";
import type { Profile } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutGrid, adminOnly: false },
  { href: "/stock", label: "재고 현황", icon: Package, adminOnly: false },
  { href: "/daily-entry", label: "일일 입력", icon: ClipboardCheck, adminOnly: false },
  { href: "/items", label: "품목 관리", icon: Tag, adminOnly: false },
  { href: "/history", label: "재고 이력/리포트", icon: BarChart3, adminOnly: false },
] as const;

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "관리자",
  writer: "입력자",
  viewer: "조회자",
};

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Box size={20} />
        </span>
        <span className="text-lg font-bold text-foreground">재고관리</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted-foreground hover:bg-accent-soft/60"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        {profile.role === "admin" && (
          <>
            <div className="my-2 border-t border-border" />
            <Link
              href="/users"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname.startsWith("/users")
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted-foreground hover:bg-accent-soft/60"
              }`}
            >
              <Users size={18} />
              사용자 관리
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent-soft/60"
        >
          <LogOut size={18} />
          로그아웃
        </button>
        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {profile.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {profile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[profile.role]}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
