import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole, UserStatus } from "@/lib/types/database";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastSignInAt: string | null;
}

export async function getUsers(): Promise<UserRow[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const lastSignInMap = new Map((authData?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    status: p.status,
    lastSignInAt: lastSignInMap.get(p.id) ?? null,
  }));
}
