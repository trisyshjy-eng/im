"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Item, ItemCategory, UserRole } from "@/lib/types/database";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/form";
import { formatDateShort } from "@/lib/utils/format";
import { deleteItemAction } from "@/lib/actions/items";
import { ItemForm } from "./ItemForm";

export function ItemsClient({
  items,
  role,
}: {
  items: Item[];
  role: UserRole;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ItemCategory | "all">("all");
  const [modalItem, setModalItem] = useState<Item | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const canManage = role === "admin";

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  async function handleDelete() {
    if (!deleting) return;
    setPendingDelete(true);
    await deleteItemAction(deleting.id);
    setPendingDelete(false);
    setDeleting(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="품목명으로 검색"
            className={`${inputClass} max-w-xs`}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | "all")}
            className={`${inputClass} w-36`}
          >
            <option value="all">전체 분류</option>
            <option value="생산품">생산품</option>
            <option value="소스류">소스류</option>
          </select>
        </div>
        {canManage && (
          <Button onClick={() => setModalItem(null)}>
            <Plus size={16} />
            품목 추가
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-soft/40 text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">품목명</th>
              <th className="px-5 py-3 font-medium">분류</th>
              <th className="px-5 py-3 text-right font-medium">규격(g)</th>
              <th className="px-5 py-3 text-center font-medium">사용여부</th>
              <th className="px-5 py-3 font-medium">등록일</th>
              {canManage && <th className="px-5 py-3 text-right font-medium">관리</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {item.spec_weight_g.toLocaleString("ko-KR")}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      item.is_active ? "bg-accent" : "bg-gray-300"
                    }`}
                  />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {formatDateShort(item.created_at.slice(0, 10))}
                </td>
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModalItem(item)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent-soft hover:text-accent"
                        aria-label="수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        aria-label="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalItem !== undefined}
        onClose={() => setModalItem(undefined)}
        title={modalItem ? "품목 수정" : "품목 추가"}
      >
        <ItemForm
          key={modalItem?.id ?? "new"}
          item={modalItem ?? undefined}
          onSuccess={() => setModalItem(undefined)}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="품목 삭제">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{deleting?.name}</span> 품목을
          삭제하면 관련된 모든 재고 기록도 함께 삭제됩니다. 계속하시겠습니까?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={pendingDelete}>
            {pendingDelete ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
