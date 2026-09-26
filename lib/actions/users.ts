"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile, requireRole, CAN_MANAGE_USERS } from "@/lib/auth/get-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, UserStatus } from "@/lib/types/database";

const inviteSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
  role: z.enum(["admin", "writer", "viewer"]),
});

export type InviteState = { error?: string; success?: boolean } | undefined;

export async function inviteUserAction(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_USERS);

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { name: parsed.data.name, role: parsed.data.role },
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    const message = error.message.toLowerCase();
    let friendly = "초대에 실패했습니다.";
    if (message.includes("already")) {
      friendly = "이미 등록된 이메일입니다.";
    } else if (message.includes("invalid")) {
      friendly = "올바르지 않은 이메일 주소입니다.";
    } else if (message.includes("rate limit")) {
      friendly =
        "이메일 발송 한도를 초과했습니다. Supabase 프로젝트에 커스텀 SMTP를 설정하면 해결됩니다 (Authentication → Emails → SMTP Settings).";
    }
    return { error: friendly };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_USERS);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) return { error: "역할 변경에 실패했습니다." };

  revalidatePath("/users");
  return {};
}

export async function toggleUserStatusAction(
  userId: string,
  status: UserStatus
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_USERS);

  if (userId === profile.id) {
    return { error: "본인 계정 상태는 변경할 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);

  if (error) return { error: "상태 변경에 실패했습니다." };

  revalidatePath("/users");
  return {};
}
