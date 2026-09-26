"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { inviteUserAction, type InviteState } from "@/lib/actions/users";
import { inputClass, labelClass } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "초대 중..." : "초대 보내기"}
    </Button>
  );
}

export function InviteForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useActionState<InviteState, FormData>(inviteUserAction, undefined);

  useEffect(() => {
    if (state?.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          이름
        </label>
        <input id="name" name="name" required className={inputClass} placeholder="홍길동" />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
          placeholder="name@company.com"
        />
      </div>
      <div>
        <label htmlFor="role" className={labelClass}>
          역할
        </label>
        <select id="role" name="role" defaultValue="viewer" className={inputClass}>
          <option value="admin">관리자</option>
          <option value="writer">입력자</option>
          <option value="viewer">조회자</option>
        </select>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
