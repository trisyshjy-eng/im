import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * service role 키를 사용하는 관리자 전용 클라이언트.
 * RLS를 우회하므로 사용자 초대/역할 변경 등 admin 서버 액션에서만 사용한다.
 * 클라이언트 번들에 절대 포함되면 안 된다 ("server-only" 임포트로 강제).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
