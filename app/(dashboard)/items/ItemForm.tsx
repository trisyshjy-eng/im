"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import type { Item } from "@/lib/types/database";
import { createItemAction, updateItemAction, type ItemFormState } from "@/lib/actions/items";
import { inputClass, labelClass } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : label}
    </Button>
  );
}

export function ItemForm({
  item,
  onSuccess,
}: {
  item?: Item;
  onSuccess: () => void;
}) {
  const action = item ? updateItemAction.bind(null, item.id) : createItemAction;
  const [state, formAction] = useActionState<ItemFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          품목명
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={item?.name}
          className={inputClass}
          placeholder="예: 양념쭈꾸미(70g)-태"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className={labelClass}>
            분류
          </label>
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? "생산품"}
            className={inputClass}
          >
            <option value="생산품">생산품</option>
            <option value="소스류">소스류</option>
          </select>
        </div>
        <div>
          <label htmlFor="spec_weight_g" className={labelClass}>
            규격(g)
          </label>
          <input
            id="spec_weight_g"
            name="spec_weight_g"
            type="number"
            min={0.001}
            step="0.001"
            required
            defaultValue={item?.spec_weight_g}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="min_stock_qty" className={labelClass}>
            부족 기준 수량
          </label>
          <input
            id="min_stock_qty"
            name="min_stock_qty"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={item?.min_stock_qty ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="warning_stock_qty" className={labelClass}>
            임박 기준 수량
          </label>
          <input
            id="warning_stock_qty"
            name="warning_stock_qty"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={item?.warning_stock_qty ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={item?.is_active ?? true}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
        />
        사용함
      </label>

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <SubmitButton label={item ? "수정 저장" : "품목 추가"} />
    </form>
  );
}
