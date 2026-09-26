import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";

export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status === "inactive") {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return profile;
}

export function requireRole(profile: Profile, roles: UserRole[]) {
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
}

export const CAN_EDIT_ENTRIES: UserRole[] = ["admin", "writer"];
export const CAN_MANAGE_ITEMS: UserRole[] = ["admin"];
export const CAN_MANAGE_USERS: UserRole[] = ["admin"];
