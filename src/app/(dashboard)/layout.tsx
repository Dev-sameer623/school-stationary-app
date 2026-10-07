import { AppShell } from "@/components/dashboard/shell";
import { IdleLogout } from "@/components/shop/idle-logout";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <IdleLogout href="/api/staff/idle-logout" />
      {children}
    </AppShell>
  );
}
