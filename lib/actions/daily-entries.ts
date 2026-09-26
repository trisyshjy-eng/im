"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole, CAN_EDIT_ENTRIES } from "@/lib/auth/get-profile";
import { isValidDateString } from "@/lib/utils/date";

const rowSchema = z.object({
  item_id: z.string().uuid(),
  produced_qty: z.coerce.number().int().min(0),
  shipped_qty: z.coerce.number().int().min(0),
});

const payloadSchema = z.object({
  date: z.string().refine(isValidDateString, "날짜 형식이 올바르지 않습니다."),
  rows: z.array(rowSchema),
});

export type SaveDailyEntriesResult = { error?: string; success?: boolean };

export async function saveDailyEntriesAction(
  date: string,
  rows: { item_id: string; produced_qty: number; shipped_qty: number }[]
): Promise<SaveDailyEntriesResult> {
  const profile = await requireProfile();
  requireRole(profile, CAN_EDIT_ENTRIES);

  const parsed = payloadSchema.safeParse({ date, rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const supabase = await createClient();

  for (const row of parsed.data.rows) {
    const { error } = await supabase.rpc("upsert_daily_stock_entry", {
      p_item_id: row.item_id,
      p_entry_date: parsed.data.date,
      p_produced_qty: row.produced_qty,
      p_shipped_qty: row.shipped_qty,
      p_actor: profile.id,
    });

    if (error) {
      return {
        error:
          error.message.includes("stock_qty")
            ? "재고수량이 음수가 될 수 없습니다. 출고수량을 확인해 주세요."
            : "저장 중 오류가 발생했습니다.",
      };
    }
  }

  revalidatePath("/daily-entry");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/history");
  return { success: true };
}
