import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import type { Role } from "@/types/action";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }
  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    return null;
  }
  return user;
}

export function hasRole(role: Role, permission: Permission) {
  return can(role, permission);
}
