import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/session";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader title="Settings" description={`${user.email} · ${user.role === "ADMIN" ? "Admin" : "Manager"}`} />
      <SettingsForm name={user.name} />
    </div>
  );
}
