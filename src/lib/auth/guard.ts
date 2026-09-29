import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { can, type Permission } from "@/lib/permissions";

export async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new AppError("Please sign in again.");
  }
  return session.user;
}

export async function authorize(permission: Permission) {
  const user = await requireSessionUser();
  if (!can(user.role, permission)) {
    throw new AppError("You do not have permission to do that.");
  }
  return user;
}
