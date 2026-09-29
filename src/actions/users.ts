"use server";

import { revalidatePath } from "next/cache";
import { authorize, requireSessionUser } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { createUser, updateUser } from "@/lib/services/users";
import type { ActionResult } from "@/types/action";
import bcrypt from "bcryptjs";
import {
  fieldErrors,
  passwordSchema,
  profileSchema,
  userSchema,
  userUpdateSchema,
} from "@/lib/validations";

export async function saveUser(input: unknown, id?: string): Promise<ActionResult> {
  try {
    await authorize("usersManage");
    if (id) {
      const parsed = userUpdateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
      }
      await updateUser(id, parsed.data);
    } else {
      const parsed = userSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
      }
      await createUser(parsed.data);
    }
    revalidatePath("/users");
    return { ok: true, message: id ? "User updated." : "User created." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  try {
    const sessionUser = await requireSessionUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name: parsed.data.name },
    });
    revalidatePath("/settings");
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  try {
    const sessionUser = await requireSessionUser();
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return { ok: false, message: "Please sign in again." };
    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) return { ok: false, message: "Current password is incorrect." };
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });
    return { ok: true, message: "Password updated." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
