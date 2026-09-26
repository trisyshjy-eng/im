import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Item, ItemCategory } from "@/lib/types/database";

export async function getItems(options?: {
  category?: ItemCategory | "all";
  search?: string;
  activeOnly?: boolean;
}): Promise<Item[]> {
  const supabase = await createClient();
  let query = supabase.from("items").select("*").order("created_at", { ascending: true });

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }
  if (options?.search) {
    query = query.ilike("name", `%${options.search}%`);
  }
  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getItem(id: string): Promise<Item | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}
