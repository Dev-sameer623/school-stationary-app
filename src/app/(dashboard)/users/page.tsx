import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/status-badge";
import { AccessDenied, Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { UserForm } from "@/components/users/user-form";
import { requirePermission } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listUsers } from "@/lib/services/users";
import { readParam } from "@/lib/utils";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("usersManage");
  if (!user) return <AccessDenied />;
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const status = (readParam(params.status) ?? "ALL") as "ACTIVE" | "INACTIVE" | "ALL";
  const users = await listUsers({ query, status });

  return (
    <div>
      <PageHeader title="Users" description="Admins can create staff accounts and change roles. The last active admin cannot be removed.">
        <UserForm />
      </PageHeader>
      <UrlFilters className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input name="q" defaultValue={query} placeholder="Search name or email" aria-label="Search users" />
        <Select name="status" defaultValue={status} aria-label="User status">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </UrlFilters>
      {users.length === 0 ? (
        <EmptyState title="No users found." description="Try a different name, email, or status." />
      ) : (
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
      )}
    </div>
  );
}
