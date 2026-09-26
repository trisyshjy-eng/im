import { PageHeader } from "@/components/ui/PageHeader";
import { requireProfile, requireRole, CAN_MANAGE_USERS } from "@/lib/auth/get-profile";
import { getUsers } from "@/lib/data/users";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const profile = await requireProfile();
  requireRole(profile, CAN_MANAGE_USERS);

  const users = await getUsers();

  return (
    <div>
      <PageHeader
        title="사용자 관리"
        subtitle="역할별 접근 권한을 부여하고 사용자 계정을 관리합니다"
      />
      <UsersClient users={users} currentUserId={profile.id} />
    </div>
  );
}
