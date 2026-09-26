"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole, CAN_MANAGE_ITEMS } from "@/lib/auth/get-profile";

const itemSchema = z
  .object({
    name: z.string().trim().min(1, "품목명을 입력해 주세요.").max(100),
    category: z.enum(["생산품", "소스류"]),
    spec_weight_g: z.coerce.number().positive("규격은 0보다 커야 합니다."),
    is_active: z.coerce.boolean().default(true),
    min_stock_qty: z.coerce.number().int().min(0, "0 이상이어야 합니다."),
    warning_stock_qty: z.coerce.number().int().min(0, "0 이상이어야 합니다."),
  })
  .refine((v) => v.warning_stock_qty >= v.min_stock_qty, {
    message: "임박 기준 수량은 부족 기준 수량보다 크거나 같아야 합니다.",
    path: ["warning_stock_qty"],
  });

export type ItemFormState = { error?: string; success?: boolean } | undefined;

function parseItemForm(formData: FormData) {
  return itemSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    spec_weight_g: formData.get("spec_weight_g"),
    is_active: formData.get("is_active") === "on",
    min_stock_qty: formData.get("min_stock_qty") || 0,
    warning_stock_qty: formData.get("warning_stock_qty") || 0,
  });
}

export async function createItemAction(
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_ITEMS);

  const parsed = parseItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("items").insert({
    ...parsed.data,
    created_by: profile.id,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 등록된 품목명입니다." : "품목 등록에 실패했습니다.",
    };
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/daily-entry");
  return { success: true };
}

export async function updateItemAction(
  itemId: string,
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_ITEMS);

  const parsed = parseItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("items").update(parsed.data).eq("id", itemId);

  if (error) {
    return {
      error: error.code === "23505" ? "이미 등록된 품목명입니다." : "품목 수정에 실패했습니다.",
    };
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/daily-entry");
  return { success: true };
}

export async function deleteItemAction(itemId: string): Promise<{ error?: string }> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_ITEMS);

  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    return { error: "품목 삭제에 실패했습니다." };
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/daily-entry");
  return {};
}
