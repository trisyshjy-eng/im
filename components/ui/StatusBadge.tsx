import { STOCK_STATUS_BADGE_STYLE, type StockStatus } from "@/lib/utils/stock-status";

export function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STOCK_STATUS_BADGE_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

const ROLE_BADGE_STYLE: Record<string, string> = {
  admin: "bg-accent-soft text-accent ring-1 ring-inset ring-accent/20",
  writer: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  viewer: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/10",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  writer: "입력자",
  viewer: "조회자",
};

export function RoleBadge({ role }: { role: "admin" | "writer" | "viewer" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE_STYLE[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
