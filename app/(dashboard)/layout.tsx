import { requireProfile } from "@/lib/auth/get-profile";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar profile={profile} />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
