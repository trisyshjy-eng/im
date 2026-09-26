import { PageHeader } from "@/components/ui/PageHeader";
import { getItems } from "@/lib/data/items";
import { requireProfile } from "@/lib/auth/get-profile";
import { ItemsClient } from "./ItemsClient";

export default async function ItemsPage() {
  const profile = await requireProfile();
  const items = await getItems();

  return (
    <div>
      <PageHeader title="품목 관리" subtitle="재고를 추적할 품목을 등록하고 관리합니다" />
      <ItemsClient items={items} role={profile.role} />
    </div>
  );
}
