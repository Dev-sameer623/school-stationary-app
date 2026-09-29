import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/status-badge";
import { AccessDenied, Badge } from "@/components/ui/feedback";
import { UserForm } from "@/components/users/user-form";
import { requirePermission } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listUsers } from "@/lib/services/users";

export default async function UsersPage() {
  const user = await requirePermission("usersManage");
  if (!user) return <AccessDenied />;
  const users = await listUsers();

  return (
    <div>
      <PageHeader title="Users" description="Admins can create staff accounts and change roles. The last active admin cannot be removed.">
        <UserForm />
      </PageHeader>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((person) => (
              <tr key={person.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{person.name}</td>
                <td className="px-4 py-3">{person.email}</td>
                <td className="px-4 py-3"><RoleBadge role={person.role} /></td>
                <td className="px-4 py-3">
                  <Badge tone={person.status === "ACTIVE" ? "green" : "slate"}>
                    {person.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">{formatDate(person.createdAt)}</td>
                <td className="px-4 py-3">
                  <UserForm user={person} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
