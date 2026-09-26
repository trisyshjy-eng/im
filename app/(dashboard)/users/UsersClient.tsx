"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import type { UserRole, UserStatus } from "@/lib/types/database";
import type { UserRow } from "@/lib/data/users";
import { updateUserRoleAction, toggleUserStatusAction } from "@/lib/actions/users";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { inputClass, labelClass } from "@/components/ui/form";
import { formatRelativeTime } from "@/lib/utils/format";
import { InviteForm } from "./InviteForm";

export function UsersClient({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [role, setRole] = useState<UserRole>("viewer");
  const [status, setStatus] = useState<UserStatus>("active");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openEdit(user: UserRow) {
    setEditing(user);
    setRole(user.role);
    setStatus(user.status);
    setError(null);
  }

  async function handleSave() {
    if (!editing) return;
    setPending(true);
    setError(null);

    if (role !== editing.role) {
      const res = await updateUserRoleAction(editing.id, role);
      if (res.error) {
        setError(res.error);
        setPending(false);
        return;
      }
    }
    if (status !== editing.status) {
      const res = await toggleUserStatusAction(editing.id, status);
      if (res.error) {
        setError(res.error);
        setPending(false);
        return;
      }
    }

    setPending(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus size={16} />
          사용자 초대
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-soft/40 text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">이메일</th>
              <th className="px-5 py-3 font-medium">역할</th>
              <th className="px-5 py-3 font-medium">최근 로그인</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                      {user.name.slice(0, 1)}
                    </span>
                    <span className="font-medium text-foreground">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-5 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {formatRelativeTime(user.lastSignInAt)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      user.status === "active" ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.status === "active" ? "bg-accent" : "bg-gray-300"
                      }`}
                    />
                    {user.status === "active" ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEdit(user)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent-soft hover:text-accent"
                    aria-label="수정"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="사용자 초대">
        <InviteForm onSuccess={() => setInviteOpen(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="사용자 권한 설정">
        {editing && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{editing.name}</p>
              <p className="text-xs text-muted-foreground">{editing.email}</p>
            </div>
            <div>
              <label className={labelClass}>역할</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={inputClass}
              >
                <option value="admin">관리자</option>
                <option value="writer">입력자</option>
                <option value="viewer">조회자</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>상태</label>
              <select
                value={status}
                disabled={editing.id === currentUserId}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className={inputClass}
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
              {editing.id === currentUserId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  본인 계정 상태는 변경할 수 없습니다.
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
